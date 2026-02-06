from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Literal


class FeedbackCreate(BaseModel):
    type : Literal['review', 'suggestion']
    rating : int = Field(ge=1, le=10, examples=[1,5,10])
    text : str = Field(min_length=1)
    name : str = Field(min_length=1, max_length=60)
    contact : str = Field(min_length=1, max_length=50, examples=['+number', '@instagram'])


class FeedbackOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)

    id : int
    type : Literal['review', 'suggestion']
    rating : int 
    text : str 
    name : str 
    contact : str
    created_at : datetime
    source : str | None
    is_approved : bool
