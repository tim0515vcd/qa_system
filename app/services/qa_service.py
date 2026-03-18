from app.services.search_service import hybrid_search_chunks


def answer_question(query: str, db, limit: int = 5):
    """
    第二版 QA：
    1. 用 hybrid retrieval 找 chunks
    2. 取前幾個 chunks 做簡單整理
    3. 回傳 answer + citations

    先不用 LLM，讓 retrieval-backed QA 先完整。
    """
    results = hybrid_search_chunks(query, db, limit)

    if not results:
        return {
            "answer": "找不到足夠資訊。",
            "citations": [],
        }

    # 取前 3 筆最相關結果來組答案
    top_results = results[:3]

    # 避免重複內容一直出現在答案裡
    seen_contents = set()
    summary_parts = []

    for row in top_results:
        content = row["content"].strip()
        if not content:
            continue

        if content in seen_contents:
            continue

        seen_contents.add(content)
        summary_parts.append(
            f"來源《{row['document_title']}》第 {row['chunk_index']} 段：\n{content}"
        )

    if not summary_parts:
        answer = "找到相關文件，但無法整理出可用內容。"
    elif len(summary_parts) == 1:
        answer = f"根據目前找到的文件內容，最相關資訊如下：\n\n{summary_parts[0]}"
    else:
        answer = "根據目前找到的文件內容，整理出以下重點：\n\n" + "\n\n---\n\n".join(
            summary_parts
        )

    citations = [
        {
            "chunk_id": row["chunk_id"],
            "document_id": row["document_id"],
            "chunk_index": row["chunk_index"],
            "document_title": row["document_title"],
            "content": row["content"],
            "created_at": row["created_at"],
        }
        for row in results
    ]

    return {
        "answer": answer,
        "citations": citations,
    }
