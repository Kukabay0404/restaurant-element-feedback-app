from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from typing import Any

from core.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=['argon2'], deprecated='auto')

def hash_password(password : str):
    return pwd_context.hash(password)

def verify_password(password : str, hash_password : str):
    return pwd_context.verify(password, hash_password)


def create_access(subject : str, expire_minutes : int = settings.ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=expire_minutes)
    payload : dict[str, Any] = {
        'sub' : subject, 
        'iat' : int(now.timestamp()),
        'exp' : int(expire.timestamp())
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALG)

def decode_token(token : str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALG])
    except JWTError as e:
        raise ValueError('Invalid token') from e