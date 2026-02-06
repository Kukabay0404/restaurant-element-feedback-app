from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from schemas.auth import Token, BootstrapAdmin
from schemas.user import UserCreate, UserOut
from db.session import get_db
from crud.admin import create_user, get_user_by_email, get_user_by_id, delete_user
from core.security import verify_password, create_access
from core.deps import get_current_user
from fastapi import status
from core.config import get_settings
from models.user import User

router = APIRouter(
    prefix='/admin',
    tags=['/Admin']
)


@router.post(
    path='/login',
    response_model=Token
)
async def login(form_data : Annotated[OAuth2PasswordRequestForm, Depends()], db : AsyncSession = Depends(get_db)):
    user = await get_user_by_email(form_data.username, db=db)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401)
    
    access_token = create_access(subject=str(user.id))
    return Token(access_token=access_token, token_type='bearer')


@router.post(
    path='/bootstrap',
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
async def bootstrap_admin(
    payload : BootstrapAdmin,
    db : AsyncSession = Depends(get_db),
):
    settings = get_settings()
    if not settings.ADMIN_BOOTSTRAP_SECRET or payload.secret != settings.ADMIN_BOOTSTRAP_SECRET:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Invalid bootstrap secret')

    res = await db.execute(select(func.count(User.id)))
    total_users = res.scalar_one()
    if total_users > 0:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Bootstrap already used')

    existing = await get_user_by_email(payload.email, db=db)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='User already exists')

    return await create_user(email=payload.email, password=payload.password, db=db)


@router.post(
    path='/create',
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_admin(
    payload : UserCreate,
    db : AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    existing = await get_user_by_email(payload.email, db=db)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='User already exists')
    return await create_user(email=payload.email, password=payload.password, db=db)


@router.delete(
    path='/delete/{user_id}',
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
)
async def delete_admin(
    user_id : int,
    db : AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
) -> None:
    user = await get_user_by_id(user_id=user_id, db=db)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    await delete_user(user=user, db=db)
    return None
    
