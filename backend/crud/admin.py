from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.session import get_db
from models.user import User
from schemas.user import UserCreate, UserOut
from core.security import hash_password


async def get_user_by_email(email : str, db : AsyncSession):
    user = await db.execute(select(User).where(User.email == email))
    return user.scalar_one_or_none()

async def get_user_by_id(user_id : int, db : AsyncSession):
    user = await db.execute(select(User).where(User.id == user_id))
    return user.scalar_one_or_none()

async def create_user(email : str, password : str, db : AsyncSession) -> UserOut:
    user = User(
        email=email,
        hashed_password=hash_password(password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def delete_user(user : User, db : AsyncSession) -> None:
    await db.delete(user)
    await db.commit()
