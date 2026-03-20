from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DocumentChunkItem(BaseModel):
    id: UUID
    document_id: UUID
    chunk_index: int
    content: str

    section_heading: str | None
    heading_level: int | None
    chunk_type: str | None
    content_language: str | None

    page_number: int | None
    start_offset: int | None
    end_offset: int | None
    token_count: int | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentChunkListResponse(BaseModel):
    items: list[DocumentChunkItem]
    total: int
