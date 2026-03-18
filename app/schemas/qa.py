from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class QARequest(BaseModel):
    query: str = Field(..., min_length=1)
    limit: int = Field(default=5, ge=1, le=10)


class CitationItem(BaseModel):
    chunk_id: UUID
    document_id: UUID
    chunk_index: int
    document_title: str

    # 給前端顯示的短摘要
    snippet: str

    # 保留完整 chunk 內容，方便展開檢視
    full_content: str

    matched_by_fts: bool
    matched_by_vector: bool
    hybrid_score: float

    created_at: datetime


class QAResponse(BaseModel):
    search_query_id: UUID
    query: str
    answer: str
    citations: list[CitationItem]
