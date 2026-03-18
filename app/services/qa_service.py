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


def answer_question(query: str, db, limit: int = 5):
    """
    第三版 QA：
    1. 用 hybrid retrieval 找 chunks
    2. 組 context blocks
    3. 呼叫 OpenAI 生成答案
    4. 回傳 answer + citations
    """
    results = hybrid_search_chunks(query, db, limit)

    if not results:
        return {
            "answer": "找不到足夠資訊。",
            "citations": [],
        }

    top_results = results[:3]

    context_blocks = []
    seen_contents = set()

    for row in top_results:
        content = row["content"].strip()
        if not content or content in seen_contents:
            continue

        seen_contents.add(content)
        context_blocks.append(
            f"[來源: {row['document_title']} / chunk {row['chunk_index']}]\n{content}"
        )

    answer = generate_answer_with_gemini(query, context_blocks)

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
        "answer": answer,
        "citations": citations,
    }
