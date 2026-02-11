from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api.router import router as v1_router
from core.config import get_settings

app = FastAPI()
settings = get_settings()

default_origins = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
]
configured_origins = []
if settings.CORS_ORIGINS:
    configured_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins or default_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)


if __name__ == '__main__':
    uvicorn.run('main:app', reload=True)
