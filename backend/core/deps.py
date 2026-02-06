from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException, status

from fastapi.security import OAuth2PasswordBearer
from db.session import get_db
from core.security import decode_token
from models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/v1/admin/login')


async def get_current_user(
        token : str = Depends(oauth2_scheme),
        db : AsyncSession = Depends(get_db), 
):
    try:
        payload = decode_token(token=token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
    
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
    
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
    
    return user
