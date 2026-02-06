from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config=SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    DATABASE_URL : str
    JWT_SECRET_KEY : str
    JWT_ALG : str
    ACCESS_TOKEN_EXPIRE_MINUTES : int = 30
    ADMIN_BOOTSTRAP_SECRET : str | None = None

@lru_cache
def get_settings() -> Settings:
    return Settings()
