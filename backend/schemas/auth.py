from pydantic import BaseModel, Field, EmailStr

class Token(BaseModel):
    access_token : str
    token_type : str = Field(default='bearer')


class BootstrapAdmin(BaseModel):
    secret : str
    email : EmailStr
    password : str
