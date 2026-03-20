from fastapi import APIRouter

from app.core.deps import DbSession
from app.schemas.qa import QARequest, QAResponse, CitationItem
from app.services.qa_service import answer_question
from app.services.search_service import save_search_query

router = APIRouter(prefix="/api/v1/qa", tags=["qa"])


@router.post("/ask", response_model=QAResponse)
def ask_question(
    payload: QARequest,
    db: DbSession,
):
    """
    QA 問答入口。

    這裡除了做問答，也會把 query 記錄到 search_queries。
    所以這支 API 屬於「有寫入 DB」的路由，
    應由 router 負責 commit / rollback。
    """
    try:
        # 先做檢索 + 問答
        qa_result = answer_question(payload.query, db, payload.limit)

        # 寫入 search query 紀錄
        search_record = save_search_query(
            query=payload.query,
            result_count=len(qa_result["citations"]),
            db=db,
            retrieval_mode="hybrid_qa",
        )

        # service 全部成功後，再由 router 統一 commit
        db.commit()

        return QAResponse(
            search_query_id=search_record.id,
            query=payload.query,
            answer=qa_result["answer"],
            citations=[
                CitationItem(
                    chunk_id=item["chunk_id"],
                    document_id=item["document_id"],
                    chunk_index=item["chunk_index"],
                    document_title=item["document_title"],
                    snippet=item["snippet"],
                    full_content=item["full_content"],
                    matched_by_fts=item["matched_by_fts"],
                    matched_by_vector=item["matched_by_vector"],
                    hybrid_score=item["hybrid_score"],
                    created_at=item["created_at"],
                )
                for item in qa_result["citations"]
            ],
        )

    except Exception:
        # 只要中途有任何一步失敗，就 rollback
        db.rollback()
        raise
