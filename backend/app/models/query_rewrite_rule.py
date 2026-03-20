import uuid
from datetime import datetime

from sqlalchemy import String, Float, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class QueryRewriteRule(Base):
    __tablename__ = "query_rewrite_rules"

    # 主鍵 UUID
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # 使用者可能輸入的原始詞
    # 例如：refund / 退費 / sign in / docs
    source_term: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    # 系統希望轉換成的目標詞
    # 例如：退款 / 登入 / 文件
    target_term: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    # rewrite 類型，正式版先保留幾種常見用途：
    # - normalize：做正規化，例如 refund -> 退款
    # - synonym：做擴展，例如 文件 -> doc
    # - alias：別名
    # - translation：中英翻譯對齊
    rewrite_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="normalize",
    )

    # 權重先保留，這版先不直接用在 hybrid score，
    # 但之後你可拿來做：
    # - 擴展詞排序
    # - 規則優先級
    # - A/B test
    weight: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=1.0,
    )

    # 是否啟用這條規則
    # 這樣你不需要刪資料，直接開關就能控制
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    # 建立時間
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )
