"""add moderation settings

Revision ID: 7c2d6b4f1a10
Revises: 51c76f48f259
Create Date: 2026-02-10 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7c2d6b4f1a10"
down_revision: Union[str, Sequence[str], None] = "51c76f48f259"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "moderation_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("auto_approve_enabled", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("manual_review_rating_threshold", sa.Integer(), server_default=sa.text("6"), nullable=False),
        sa.CheckConstraint("manual_review_rating_threshold BETWEEN 1 AND 10", name="manual_review_threshold_check"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.execute(
        sa.text(
            "INSERT INTO moderation_settings (auto_approve_enabled, manual_review_rating_threshold) VALUES (0, 6)"
        )
    )


def downgrade() -> None:
    op.drop_table("moderation_settings")
