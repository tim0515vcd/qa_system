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
