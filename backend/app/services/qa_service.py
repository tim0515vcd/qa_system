from app.services.search_service import hybrid_search_chunks
from app.services.llm_service import generate_answer_with_gemini


def build_snippet(content: str, max_length: int = 120) -> str:
    """
    把 chunk 內容裁成適合 citation 顯示的短摘要。
    """
    content = " ".join(content.strip().split())
    if len(content) <= max_length:
        return content
    return content[:max_length].rstrip() + "..."


def select_context_rows(
    results: list[dict],
    max_context_chunks: int = 3,
) -> list[dict]:
    """
    從 hybrid retrieval 結果中挑選真正要送進 LLM 的 context rows。

    規則：
    1. 優先依照 hybrid score 高低選
    2. 避免重複內容
    3. 盡量保留不同 document，避免單一文件霸榜
    """
    selected: list[dict] = []
    seen_contents: set[str] = set()
    seen_documents: set[str] = set()

    # 第一輪：優先挑不同 document 的高分 chunk
    for row in results:
        content = (row.get("content") or "").strip()
        if not content:
            continue

        content_key = " ".join(content.split())
        doc_id = str(row["document_id"])

        if content_key in seen_contents:
            continue
        if doc_id in seen_documents:
            continue

        selected.append(row)
        seen_contents.add(content_key)
        seen_documents.add(doc_id)

        if len(selected) >= max_context_chunks:
            return selected

    # 第二輪：如果還不夠，再補其他高分但不重複內容的 chunk
    for row in results:
        content = (row.get("content") or "").strip()
        if not content:
            continue

        content_key = " ".join(content.split())
        if content_key in seen_contents:
            continue

        selected.append(row)
        seen_contents.add(content_key)

        if len(selected) >= max_context_chunks:
            break

    return selected


def answer_question(query: str, db, limit: int = 5):
    """
    升級版 QA：
    1. 用 hybrid retrieval 找 chunks
    2. 挑真正要送進 LLM 的 context
    3. 視情況做低信心拒答
    4. 回傳 answer + citations + context metadata
    """
    results = hybrid_search_chunks(query, db, limit)

    # 完全沒找到任何檢索結果
    if not results:
        return {
            "answer": "找不到足夠資訊。",
            "citations": [],
            "context_chunk_ids": [],
            "context_document_ids": [],
            "answer_status": "no_context",
        }

    # 低信心拒答：第一名分數太低時，不進 LLM
    top_score = float(results[0].get("hybrid_score", 0.0))
    top3_avg = sum(float(r.get("hybrid_score", 0.0)) for r in results[:3]) / min(
        len(results), 3
    )

    if top_score < 0.15 or top3_avg < 0.12:
        citations = [
            {
                "chunk_id": row["chunk_id"],
                "document_id": row["document_id"],
                "chunk_index": row["chunk_index"],
                "document_title": row["document_title"],
                "snippet": build_snippet(row["content"]),
                "full_content": row["content"],
                "matched_by_fts": row.get("matched_by_fts", False),
                "matched_by_vector": row.get("matched_by_vector", False),
                "hybrid_score": float(row.get("hybrid_score", 0.0)),
                "created_at": row["created_at"],
            }
            for row in results
        ]

        return {
            "answer": "找不到足夠資訊。",
            "citations": citations,
            "context_chunk_ids": [],
            "context_document_ids": [],
            "answer_status": "weak_context",
        }

    # 挑真正送進 LLM 的 context rows
    context_rows = select_context_rows(results, max_context_chunks=3)

    context_blocks = []
    for row in context_rows:
        content = row["content"].strip()
        context_blocks.append(
            f"[來源: {row['document_title']} / chunk {row['chunk_index']}]\n{content}"
        )

    # 產生答案
    answer = generate_answer_with_gemini(query, context_blocks)

    # 所有 citations 都保留，方便前端展示與 trace
    citations = [
        {
            "chunk_id": row["chunk_id"],
            "document_id": row["document_id"],
            "chunk_index": row["chunk_index"],
            "document_title": row["document_title"],
            "snippet": build_snippet(row["content"]),
            "full_content": row["content"],
            "matched_by_fts": row.get("matched_by_fts", False),
            "matched_by_vector": row.get("matched_by_vector", False),
            "hybrid_score": float(row.get("hybrid_score", 0.0)),
            "created_at": row["created_at"],
        }
        for row in results
    ]

    context_chunk_ids = [str(row["chunk_id"]) for row in context_rows]
    context_document_ids = list(
        dict.fromkeys(str(row["document_id"]) for row in context_rows)
    )

    return {
        "answer": answer,
        "citations": citations,
        "context_chunk_ids": context_chunk_ids,
        "context_document_ids": context_document_ids,
        "answer_status": "answered",
    }
