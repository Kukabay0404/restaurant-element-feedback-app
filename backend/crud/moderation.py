from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.moderation_settings import ModerationSettings

DEFAULT_MANUAL_REVIEW_RATING_THRESHOLD = 6


async def get_or_create_moderation_settings(db: AsyncSession) -> ModerationSettings:
    result = await db.execute(
        select(ModerationSettings).order_by(ModerationSettings.id.asc()).limit(1)
    )
    settings = result.scalar_one_or_none()
    if settings:
        return settings

    settings = ModerationSettings(
        auto_approve_enabled=False,
        manual_review_rating_threshold=DEFAULT_MANUAL_REVIEW_RATING_THRESHOLD,
    )
    db.add(settings)
    await db.commit()
    await db.refresh(settings)
    return settings


async def update_moderation_settings(
    db: AsyncSession,
    *,
    auto_approve_enabled: bool,
    manual_review_rating_threshold: int,
) -> ModerationSettings:
    settings = await get_or_create_moderation_settings(db)
    settings.auto_approve_enabled = auto_approve_enabled
    settings.manual_review_rating_threshold = manual_review_rating_threshold
    await db.commit()
    await db.refresh(settings)
    return settings
