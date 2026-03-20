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

    正式版做法：
    1. 先跑 query rewrite，拿到 normalized / final query
    2. 再進 search_chunks()
    3. 把 rewrite 資訊一起存進 search_queries.metadata
       方便之後 debug「為什麼這題搜不到」
    """
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
    """
    搜尋結果回饋入口。

    這邊保留原本設計即可：
    - positive / negative feedback
    - reason / comment
    後面你可以拿這些資料回頭分析：
    - 哪些 query 常失敗
    - 哪些 rewrite 規則要補
    """
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
    """
    vector search 入口。

    正式版一樣先做 rewrite，
    但 vector search 內部通常只吃 normalized_query，
    避免擴展詞把 embedding 語意空間拉歪。
    """
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
            # 你新的 search_service 如果回傳的是 distance，
            # schema 若仍叫 score，這裡先轉成「距離值」塞進去。
            # 之後若你要更語意一致，建議 schema 也改名成 distance。
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

    return VectorSearchResponse(
        search_query_id=search_record.id,
        query=payload.query,
        total=len(items),
        items=items,
    )


@router.post("/hybrid", response_model=HybridSearchResponse)
def hybrid_search_api(
    payload: HybridSearchRequest,
    db: DbSession,
):
    """
    hybrid search 入口。

    做法：
    - 先記錄 rewrite 資訊
    - hybrid_search_chunks() 內部做 FTS + vector merge
    - 回傳 hybrid_score / matched flags
    """
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

    return HybridSearchResponse(
        search_query_id=search_record.id,
        query=payload.query,
        total=len(items),
        items=items,
    )
