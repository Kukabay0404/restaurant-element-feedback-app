"""add feedback category ratings

Revision ID: c4b7a2e91d31
Revises: 7c2d6b4f1a10
Create Date: 2026-04-23 22:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c4b7a2e91d31"
down_revision: Union[str, Sequence[str], None] = "7c2d6b4f1a10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("feedbacks") as batch_op:
        batch_op.add_column(sa.Column("service_rating", sa.Integer(), nullable=True, server_default="3"))
        batch_op.add_column(sa.Column("food_rating", sa.Integer(), nullable=True, server_default="3"))
        batch_op.add_column(sa.Column("interior_rating", sa.Integer(), nullable=True, server_default="3"))

    op.execute(
        """
        UPDATE feedbacks
        SET
            service_rating = CASE
                WHEN rating <= 2 THEN 1
                WHEN rating <= 4 THEN 2
                WHEN rating <= 6 THEN 3
                WHEN rating <= 8 THEN 4
                ELSE 5
            END,
            food_rating = CASE
                WHEN rating <= 2 THEN 1
                WHEN rating <= 4 THEN 2
                WHEN rating <= 6 THEN 3
                WHEN rating <= 8 THEN 4
                ELSE 5
            END,
            interior_rating = CASE
                WHEN rating <= 2 THEN 1
                WHEN rating <= 4 THEN 2
                WHEN rating <= 6 THEN 3
                WHEN rating <= 8 THEN 4
                ELSE 5
            END
        """
    )

    with op.batch_alter_table("feedbacks") as batch_op:
        batch_op.alter_column("service_rating", nullable=False, server_default=None)
        batch_op.alter_column("food_rating", nullable=False, server_default=None)
        batch_op.alter_column("interior_rating", nullable=False, server_default=None)
        batch_op.create_check_constraint("service_rating_range_check", "service_rating BETWEEN 1 AND 5")
        batch_op.create_check_constraint("food_rating_range_check", "food_rating BETWEEN 1 AND 5")
        batch_op.create_check_constraint("interior_rating_range_check", "interior_rating BETWEEN 1 AND 5")


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("feedbacks") as batch_op:
        batch_op.drop_constraint("service_rating_range_check", type_="check")
        batch_op.drop_constraint("food_rating_range_check", type_="check")
        batch_op.drop_constraint("interior_rating_range_check", type_="check")
        batch_op.drop_column("service_rating")
        batch_op.drop_column("food_rating")
        batch_op.drop_column("interior_rating")
