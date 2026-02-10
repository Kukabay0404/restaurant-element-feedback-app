from pydantic import BaseModel, ConfigDict, Field


class ModerationSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    auto_approve_enabled: bool
    manual_review_rating_threshold: int = Field(ge=1, le=10)


class ModerationSettingsUpdate(BaseModel):
    auto_approve_enabled: bool
    manual_review_rating_threshold: int = Field(ge=1, le=10)
