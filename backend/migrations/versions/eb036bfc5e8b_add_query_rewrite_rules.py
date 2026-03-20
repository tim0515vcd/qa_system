"""add query rewrite rules

Revision ID: eb036bfc5e8b
Revises: 4631c50f7fca
Create Date: 2026-03-20 03:34:19.824426
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "eb036bfc5e8b"
down_revision: Union[str, None] = "4631c50f7fca"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 建立 query_rewrite_rules 表
    op.create_table(
        "query_rewrite_rules",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False
        ),
        sa.Column("source_term", sa.String(length=255), nullable=False),
        sa.Column("target_term", sa.String(length=255), nullable=False),
        sa.Column(
            "rewrite_type",
            sa.String(length=50),
            nullable=False,
            server_default="normalize",
        ),
        sa.Column(
            "weight",
            sa.Float(),
            nullable=False,
            server_default="1.0",
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # 常查 source_term / target_term，建立 index
    op.create_index(
        "ix_query_rewrite_rules_source_term",
        "query_rewrite_rules",
        ["source_term"],
    )
    op.create_index(
        "ix_query_rewrite_rules_target_term",
        "query_rewrite_rules",
        ["target_term"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_query_rewrite_rules_target_term", table_name="query_rewrite_rules"
    )
    op.drop_index(
        "ix_query_rewrite_rules_source_term", table_name="query_rewrite_rules"
    )
    op.drop_table("query_rewrite_rules")
