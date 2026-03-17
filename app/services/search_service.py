from sqlalchemy import text
from sqlalchemy.orm import Session
from app.models.chunk import DocumentChunk
from app.models.document import Document
from app.models.search_query import SearchQuery

from app.services.embedding_service import fake_embedding


def search_chunks(query: str, db: Session, limit: int = 5):
    """
    PostgreSQL Full-Text Search 版本。
    先用 plainto_tsquery 將自然語言查詢轉成 tsquery，
    再用 ts_rank 做相關度排序。
    """
    sql = text(
        """
        SELECT
            dc.id AS chunk_id,
            dc.document_id AS document_id,
            dc.chunk_index AS chunk_index,
            d.title AS document_title,
            dc.content AS content,
            dc.token_count AS token_count,
            dc.created_at AS created_at,
            ts_rank(dc.content_tsv, plainto_tsquery('english', :query)) AS rank
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        WHERE dc.content_tsv @@ plainto_tsquery('english', :query)
        ORDER BY rank DESC, dc.created_at DESC
        LIMIT :limit
        """
    )

    rows = db.execute(sql, {"query": query, "limit": limit}).mappings().all()
    return rows


def save_search_query(
    query: str, result_count: int, db: Session, retrieval_mode: str = "fts"
) -> SearchQuery:
    """
    紀錄一次搜尋行為，方便後續分析與 feedback。
    """
    record = SearchQuery(
        query=query,
        result_count=result_count,
        retrieval_mode=retrieval_mode,
        metadata_={},
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def vector_search_chunks(query: str, db: Session, limit: int = 5):
    """
    第一版 vector search。
    用 fake embedding 產生 query vector，
    再用 pgvector cosine distance 做最近鄰搜尋。
    """
    query_embedding = fake_embedding(query)

    sql = text(
        """
        SELECT
            dc.id AS chunk_id,
            dc.document_id AS document_id,
            dc.chunk_index AS chunk_index,
            d.title AS document_title,
            dc.content AS content,
            dc.token_count AS token_count,
            dc.created_at AS created_at,
            dc.embedding <=> CAST(:query_embedding AS vector) AS score
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        WHERE dc.embedding IS NOT NULL
        ORDER BY dc.embedding <=> CAST(:query_embedding AS vector) ASC
        LIMIT :limit
        """
    )

    rows = (
        db.execute(
            sql,
            {
                "query_embedding": str(query_embedding),
                "limit": limit,
            },
        )
        .mappings()
        .all()
    )

    return rows


def hybrid_search_chunks(query: str, db: Session, limit: int = 5):
    """
    最小版 hybrid search：
    1. 跑 FTS
    2. 跑 vector
    3. 以 chunk_id 合併去重
    4. 若同時被兩邊命中，給較高 hybrid_score
    """
    fts_rows = search_chunks(query, db, limit)
    vector_rows = vector_search_chunks(query, db, limit)

    merged: dict[str, dict] = {}

    # 先放 FTS 結果
    for rank, row in enumerate(fts_rows):
        chunk_id = str(row["chunk_id"])
        merged[chunk_id] = {
            "chunk_id": row["chunk_id"],
            "document_id": row["document_id"],
            "chunk_index": row["chunk_index"],
            "document_title": row["document_title"],
            "content": row["content"],
            "token_count": row["token_count"],
            "created_at": row["created_at"],
            "matched_by_fts": True,
            "matched_by_vector": False,
            # FTS 先用 rank-based 分數，名次越前分數越高
            "fts_score": 1.0 / (rank + 1),
            "vector_score": 0.0,
        }

    # 再合併 vector 結果
    for rank, row in enumerate(vector_rows):
        chunk_id = str(row["chunk_id"])

        # vector 的 score 是 distance，越小越好
        distance = float(row["score"])
        similarity_score = 1.0 / (1.0 + distance)

        if chunk_id in merged:
            merged[chunk_id]["matched_by_vector"] = True
            merged[chunk_id]["vector_score"] = similarity_score
        else:
            merged[chunk_id] = {
                "chunk_id": row["chunk_id"],
                "document_id": row["document_id"],
                "chunk_index": row["chunk_index"],
                "document_title": row["document_title"],
                "content": row["content"],
                "token_count": row["token_count"],
                "created_at": row["created_at"],
                "matched_by_fts": False,
                "matched_by_vector": True,
                "fts_score": 0.0,
                "vector_score": similarity_score,
            }

    # 算 hybrid_score
    items = []
    for value in merged.values():
        bonus = 0.3 if value["matched_by_fts"] and value["matched_by_vector"] else 0.0
        hybrid_score = value["fts_score"] + value["vector_score"] + bonus

        value["hybrid_score"] = hybrid_score
        items.append(value)

    items.sort(key=lambda x: x["hybrid_score"], reverse=True)

    return items[:limit]
