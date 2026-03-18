import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SearchQuery(Base):
    __tablename__ = "search_queries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # 使用者原始查詢文字
    query: Mapped[str] = mapped_column(Text, nullable=False)

    # 這次查詢命中了幾筆結果
    result_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # 先記固定值，之後可擴充成 keyword / fts / vector / hybrid
    retrieval_mode: Mapped[str] = mapped_column(
        String(50), nullable=False, default="fts"
    )

    # 預留一些延伸欄位，方便之後加 top_k、filters、debug info
    metadata_: Mapped[dict] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
