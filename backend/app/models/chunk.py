import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector

from app.models.base import Base


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
    )

    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # 新增：chunk 所屬章節標題
    section_heading: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # 新增：heading level，例如 #=1, ##=2
    heading_level: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 新增：chunk 類型，先預留 paragraph / list / code / table / heading
    chunk_type: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # 新增：chunk 語言
    content_language: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # PostgreSQL Full-Text Search 用的全文索引欄位
    content_tsv: Mapped[str | None] = mapped_column(TSVECTOR, nullable=True)

    # 向量欄位，維持 384 維
    embedding: Mapped[list[float] | None] = mapped_column(Vector(384), nullable=True)

    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    start_offset: Mapped[int | None] = mapped_column(Integer, nullable=True)
    end_offset: Mapped[int | None] = mapped_column(Integer, nullable=True)
    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
