from fastapi import APIRouter

from app.core.deps import DbSession
from app.schemas.qa import QARequest, QAResponse, CitationItem
from app.services.qa_service import answer_question
from app.services.search_service import save_search_query
from app.services.query_rewrite_service import build_rewritten_query

router = APIRouter(prefix="/api/v1/qa", tags=["qa"])


@router.post("/ask", response_model=QAResponse)
def ask_question(
    payload: QARequest,
    db: DbSession,
):
    """
    QA 問答入口。

    除了做問答，也會把 query 記錄到 search_queries。
    這裡把 QA 使用到的 retrieval metadata 一起寫進 DB，
    方便後續分析問答品質。
    """
    try:
        # 先記 rewrite 結果，讓 QA 也能追蹤 query 被怎麼正規化/擴展
        rewrite = build_rewritten_query(payload.query, db)

        # 做檢索 + 問答
        qa_result = answer_question(payload.query, db, payload.limit)

        citations = qa_result["citations"]

        # QA citation / context 資訊
        selected_chunk_ids = [str(item["chunk_id"]) for item in citations]
        selected_document_ids = list(
            dict.fromkeys(str(item["document_id"]) for item in citations)
        )

        # 直接使用 qa_service 回傳的真實 context metadata
        context_chunk_ids = qa_result["context_chunk_ids"]
        context_document_ids = qa_result["context_document_ids"]
        answer_status = qa_result["answer_status"]

        # 只保留前幾筆高價值分數資訊，避免 metadata 過肥
        top_scores = [
            {
                "chunk_id": str(item["chunk_id"]),
                "hybrid_score": float(item["hybrid_score"]),
                "matched_by_fts": bool(item["matched_by_fts"]),
                "matched_by_vector": bool(item["matched_by_vector"]),
            }
            for item in citations[:10]
        ]

        search_record = save_search_query(
            query=payload.query,
            result_count=len(citations),
            db=db,
            retrieval_mode="hybrid_qa",
            metadata={
                "normalized_query": rewrite["normalized_query"],
                "final_query": rewrite["final_query"],
                "canonical_terms": rewrite["canonical_terms"],
                "expanded_terms": rewrite["expanded_terms"],
                "top_k": payload.limit,
                "citation_count": len(citations),
                "selected_chunk_ids": selected_chunk_ids,
                "selected_document_ids": selected_document_ids,
                "qa_context_chunk_ids": context_chunk_ids,
                "qa_context_document_ids": context_document_ids,
                "top_scores": top_scores,
                "answer_status": answer_status,
            },
        )

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
                for item in citations
            ],
        )

    except Exception:
        db.rollback()
        raise
