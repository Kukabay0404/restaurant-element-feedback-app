from sqlalchemy import Boolean, Enum, String, CheckConstraint, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from datetime import datetime
from typing import Literal
from db.base import Base 

class FeedBack(Base):
    __tablename__='feedbacks'
    __table_args__ = (
        CheckConstraint("type IN ('review','suggestion')", name="feedback_type_check"),
        CheckConstraint("rating BETWEEN 1 AND 10", name="rating_range_check"),
    )

    id : Mapped[int] = mapped_column(primary_key=True)
    
    type: Mapped[Literal['review', 'suggestion']] = mapped_column(String(20), nullable=False)
    
    rating : Mapped[int] = mapped_column(nullable=False)

    text : Mapped[str] = mapped_column(Text, nullable=False)
    name : Mapped[str] = mapped_column(String(250), nullable=False, index=True)
    contact : Mapped[str] = mapped_column(String(50), nullable=False)
    is_approved : Mapped[bool] = mapped_column(Boolean, nullable=False, server_default='0', index=True)
    
    created_at : Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    source : Mapped[str | None] = mapped_column(String(150), nullable=True)
