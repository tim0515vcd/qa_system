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
    qa_result = answer_question(payload.query, db, payload.limit)

    search_record = save_search_query(
        query=payload.query,
        result_count=len(qa_result["citations"]),
        db=db,
        retrieval_mode="hybrid_qa",
    )

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
                content=item["content"],
                created_at=item["created_at"],
            )
            for item in qa_result["citations"]
        ],
    )
