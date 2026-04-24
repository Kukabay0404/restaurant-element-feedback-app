from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Literal

from core.feedback_ratings import normalize_rating, project_overall_rating_to_category


class FeedbackCreate(BaseModel):
    type : Literal['review', 'suggestion']
    rating : int | None = Field(default=None, ge=1, le=10, examples=[1,5,10])
    service_rating: int | None = Field(default=None, ge=1, le=5)
    food_rating: int | None = Field(default=None, ge=1, le=5)
    interior_rating: int | None = Field(default=None, ge=1, le=5)
    text : str = Field(min_length=1)
    name : str = Field(min_length=1, max_length=60)
    contact : str = Field(min_length=1, max_length=50, examples=['+number', '@instagram'])

    @model_validator(mode="after")
    def populate_ratings(self) -> "FeedbackCreate":
        category_ratings = [self.service_rating, self.food_rating, self.interior_rating]
        has_category_ratings = any(value is not None for value in category_ratings)

        if has_category_ratings:
            if not all(value is not None for value in category_ratings):
                raise ValueError("All category ratings must be provided together")
            self.rating = normalize_rating(
                service_rating=self.service_rating,
                food_rating=self.food_rating,
                interior_rating=self.interior_rating,
            )
            return self

        if self.rating is None:
            raise ValueError("rating or category ratings are required")

        projected_rating = project_overall_rating_to_category(self.rating)
        self.service_rating = projected_rating
        self.food_rating = projected_rating
        self.interior_rating = projected_rating
        return self


class FeedbackOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)

    id : int
    type : Literal['review', 'suggestion']
    rating : int 
    service_rating: int
    food_rating: int
    interior_rating: int
    text : str 
    name : str 
    contact : str
    created_at : datetime
    source : str | None
    is_approved : bool
