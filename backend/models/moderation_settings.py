from sqlalchemy import Boolean, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class ModerationSettings(Base):
    __tablename__ = "moderation_settings"
    __table_args__ = (
        CheckConstraint("manual_review_rating_threshold BETWEEN 1 AND 10", name="manual_review_threshold_check"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    auto_approve_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="0")
    manual_review_rating_threshold: Mapped[int] = mapped_column(nullable=False, server_default="6")
