from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    # 使用者輸入的查詢文字
    query: str = Field(..., min_length=1)

    # 最多回傳幾筆 chunk
    limit: int = Field(default=5, ge=1, le=20)


class SearchResultItem(BaseModel):
    chunk_id: UUID
    document_id: UUID
    chunk_index: int
    document_title: str
    content: str
    token_count: int | None
    created_at: datetime


class SearchResponse(BaseModel):
    # 這次 search_queries 的主鍵，前端可直接拿去送 feedback
    search_query_id: UUID
    query: str
    total: int
    items: list[SearchResultItem]


class VectorSearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    limit: int = Field(default=5, ge=1, le=20)


class VectorSearchResultItem(BaseModel):
    chunk_id: UUID
    document_id: UUID
    chunk_index: int
    document_title: str
    content: str
    token_count: int | None
    created_at: datetime
    score: float


class VectorSearchResponse(BaseModel):
    search_query_id: UUID
    query: str
    total: int
    items: list[VectorSearchResultItem]


class HybridSearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    limit: int = Field(default=5, ge=1, le=20)


class HybridSearchResultItem(BaseModel):
    chunk_id: UUID
    document_id: UUID
    chunk_index: int
    document_title: str
    content: str
    token_count: int | None
    created_at: datetime

    # hybrid 分數，越大越好
    hybrid_score: float

    # 額外保留來源資訊，方便 debug
    matched_by_fts: bool
    matched_by_vector: bool


class HybridSearchResponse(BaseModel):
    search_query_id: UUID
    query: str
    total: int
    items: list[HybridSearchResultItem]
