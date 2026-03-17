from app.services.search_service import hybrid_search_chunks


def answer_question(query: str, db, limit: int = 5):
    """
    第一版 QA：
    先用 hybrid retrieval 找 chunks，
    再用最簡單的規則式答案拼接。
    後面再換成 LLM 生成。
    """
    results = hybrid_search_chunks(query, db, limit)

    if not results:
        return {
            "answer": "找不到足夠資訊。",
            "citations": [],
        }

    # 第一版先直接拿最相關 chunk 當主要答案
    top_chunk = results[0]["content"].strip()

    answer = f"根據目前找到的文件內容，最相關資訊如下：\n\n{top_chunk}"

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
