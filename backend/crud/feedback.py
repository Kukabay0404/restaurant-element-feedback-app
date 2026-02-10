from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from schemas.feedback import FeedbackCreate
from models.feedback import FeedBack
from crud.moderation import get_or_create_moderation_settings

async def create_feedback(db :AsyncSession, payload : FeedbackCreate):
    moderation_settings = await get_or_create_moderation_settings(db)
    should_auto_approve = (
        moderation_settings.auto_approve_enabled
        and payload.rating > moderation_settings.manual_review_rating_threshold
    )
    feedback = FeedBack(
        type=payload.type, 
        rating=payload.rating,
        text=payload.text,
        name=payload.name,
        contact=payload.contact,
        is_approved=should_auto_approve,
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback

async def get_feedback_by_id(f_id : int, db : AsyncSession):
    res = await db.execute(select(FeedBack).where(FeedBack.id == f_id))
    return res.scalar_one_or_none()

async def delete_feedback(feedback : FeedBack, db : AsyncSession):
    await db.delete(feedback)
    await db.commit()

async def get_feedback_list(db: AsyncSession, approved_only : bool = True):
    stmt = select(FeedBack)
    if approved_only:
        stmt = stmt.where(FeedBack.is_approved.is_(True))
    res = await db.execute(stmt.order_by(FeedBack.created_at.desc()))
    return res.scalars().all()

async def set_feedback_approved(feedback : FeedBack, is_approved : bool, db : AsyncSession):
    feedback.is_approved = is_approved
    await db.commit()
    await db.refresh(feedback)
    return feedback
