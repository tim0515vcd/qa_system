import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class QueryFeedback(Base):
    __tablename__ = "query_feedback"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # 對應哪一次 search_queries 紀錄
    search_query_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("search_queries.id", ondelete="CASCADE"),
        nullable=False,
    )

    # like / dislike
    feedback_type: Mapped[str] = mapped_column(String(20), nullable=False)

    # 可選，像 not_relevant / incomplete / wrong_result
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # 可選，讓使用者補充文字
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
