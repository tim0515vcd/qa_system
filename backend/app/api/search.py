from uuid import UUID

from fastapi import APIRouter

from app.core.deps import DbSession
from app.schemas.search import (
    SearchRequest,
    SearchResponse,
    SearchResultItem,
    VectorSearchRequest,
    VectorSearchResponse,
    VectorSearchResultItem,
    HybridSearchRequest,
    HybridSearchResponse,
    HybridSearchResultItem,
)
from app.schemas.feedback import FeedbackRequest, FeedbackResponse
from app.services.search_service import (
    search_chunks,
    save_search_query,
    vector_search_chunks,
    hybrid_search_chunks,
)
from app.services.feedback_service import create_feedback
from app.services.query_rewrite_service import build_rewritten_query

router = APIRouter(prefix="/api/v1/search", tags=["search"])


@router.post("", response_model=SearchResponse)
def search_api(
    payload: SearchRequest,
    db: DbSession,
):
    """
    FTS 搜尋入口。
    這支除了查詢，也會寫 search_queries，所以需要 transaction 控制。
    """
    try:
        rewrite = build_rewritten_query(payload.query, db)
        results = search_chunks(payload.query, db, payload.limit)

        items = [
            SearchResultItem(
                chunk_id=row["chunk_id"],
                document_id=row["document_id"],
                chunk_index=row["chunk_index"],
                document_title=row["document_title"],
                content=row["content"],
                token_count=row["token_count"],
                created_at=row["created_at"],
            )
            for row in results
        ]

        search_record = save_search_query(
            query=payload.query,
            result_count=len(items),
            db=db,
            retrieval_mode="fts",
            metadata={
                "normalized_query": rewrite["normalized_query"],
                "final_query": rewrite["final_query"],
                "canonical_terms": rewrite["canonical_terms"],
                "expanded_terms": rewrite["expanded_terms"],
            },
        )

        db.commit()

        return SearchResponse(
            search_query_id=search_record.id,
            query=payload.query,
            total=len(items),
            items=items,
        )
    except Exception:
        db.rollback()
        raise


@router.post("/{search_query_id}/feedback", response_model=FeedbackResponse)
def submit_feedback(
    search_query_id: UUID,
    payload: FeedbackRequest,
    db: DbSession,
):
    """
    搜尋結果 feedback。
    這支會寫 query_feedback，所以也要由 router 負責 commit / rollback。
    """
    try:
        feedback = create_feedback(
            search_query_id=str(search_query_id),
            feedback_type=payload.feedback_type,
            reason=payload.reason,
            comment=payload.comment,
            db=db,
        )

        db.commit()

        return FeedbackResponse(
            id=feedback.id,
            search_query_id=feedback.search_query_id,
            feedback_type=feedback.feedback_type,
            reason=feedback.reason,
            comment=feedback.comment,
        )
    except Exception:
        db.rollback()
        raise


@router.post("/vector", response_model=VectorSearchResponse)
def vector_search_api(
    payload: VectorSearchRequest,
    db: DbSession,
):
    """
    vector search 入口。
    這支同樣會寫 search_queries。
    """
    try:
        rewrite = build_rewritten_query(payload.query, db)
        results = vector_search_chunks(payload.query, db, payload.limit)

        items = [
            VectorSearchResultItem(
                chunk_id=row["chunk_id"],
                document_id=row["document_id"],
                chunk_index=row["chunk_index"],
                document_title=row["document_title"],
                content=row["content"],
                token_count=row["token_count"],
                created_at=row["created_at"],
                distance=float(row["distance"]),
            )
            for row in results
        ]

        search_record = save_search_query(
            query=payload.query,
            result_count=len(items),
            db=db,
            retrieval_mode="vector",
            metadata={
                "normalized_query": rewrite["normalized_query"],
                "final_query": rewrite["final_query"],
                "canonical_terms": rewrite["canonical_terms"],
                "expanded_terms": rewrite["expanded_terms"],
            },
        )

        db.commit()

        return VectorSearchResponse(
            search_query_id=search_record.id,
            query=payload.query,
            total=len(items),
            items=items,
        )
    except Exception:
        db.rollback()
        raise


@router.post("/hybrid", response_model=HybridSearchResponse)
def hybrid_search_api(
    payload: HybridSearchRequest,
    db: DbSession,
):
    """
    hybrid search 入口。
    這支也會寫 search_queries。
    """
    try:
        rewrite = build_rewritten_query(payload.query, db)
        results = hybrid_search_chunks(payload.query, db, payload.limit)

        items = [
            HybridSearchResultItem(
                chunk_id=row["chunk_id"],
                document_id=row["document_id"],
                chunk_index=row["chunk_index"],
                document_title=row["document_title"],
                content=row["content"],
                token_count=row["token_count"],
                created_at=row["created_at"],
                hybrid_score=float(row["hybrid_score"]),
                matched_by_fts=bool(row["matched_by_fts"]),
                matched_by_vector=bool(row["matched_by_vector"]),
            )
            for row in results
        ]

        search_record = save_search_query(
            query=payload.query,
            result_count=len(items),
            db=db,
            retrieval_mode="hybrid",
            metadata={
                "normalized_query": rewrite["normalized_query"],
                "final_query": rewrite["final_query"],
                "canonical_terms": rewrite["canonical_terms"],
                "expanded_terms": rewrite["expanded_terms"],
            },
        )

        db.commit()

        return HybridSearchResponse(
            search_query_id=search_record.id,
            query=payload.query,
            total=len(items),
            items=items,
        )
    except Exception:
        db.rollback()
        raise
