from uuid import UUID
from fastapi import APIRouter, HTTPException

from app.core.deps import DbSession

from app.schemas.search import (
    SearchRequest,
    SearchResponse,
    SearchResultItem,
    VectorSearchRequest,
    VectorSearchResponse,
    VectorSearchResultItem,
)
from app.schemas.feedback import FeedbackRequest, FeedbackResponse

from app.services.search_service import (
    search_chunks,
    save_search_query,
    vector_search_chunks,
)
from app.services.feedback_service import create_feedback

router = APIRouter(prefix="/api/v1/search", tags=["search"])


@router.post("", response_model=SearchResponse)
def search_api(
    payload: SearchRequest,
    db: DbSession,
):
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
    )

    return SearchResponse(
        search_query_id=search_record.id,
        query=payload.query,
        total=len(items),
        items=items,
    )


@router.post("/{search_query_id}/feedback", response_model=FeedbackResponse)
def submit_feedback(
    search_query_id: UUID,
    payload: FeedbackRequest,
    db: DbSession,
):
    try:
        feedback = create_feedback(
            search_query_id=str(search_query_id),
            feedback_type=payload.feedback_type,
            reason=payload.reason,
            comment=payload.comment,
            db=db,
        )
        return FeedbackResponse(
            id=feedback.id,
            search_query_id=feedback.search_query_id,
            feedback_type=feedback.feedback_type,
            reason=feedback.reason,
            comment=feedback.comment,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/vector", response_model=VectorSearchResponse)
def vector_search_api(
    payload: VectorSearchRequest,
    db: DbSession,
):
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
            score=float(row["score"]),
        )
        for row in results
    ]

    search_record = save_search_query(
        query=payload.query,
        result_count=len(items),
        db=db,
        retrieval_mode="vector",
    )

    return VectorSearchResponse(
        search_query_id=search_record.id,
        query=payload.query,
        total=len(items),
        items=items,
    )
