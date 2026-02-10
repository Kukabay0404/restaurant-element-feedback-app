import os
import tempfile
from collections.abc import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Ensure settings can initialize in test context before app/security imports.
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
os.environ.setdefault("JWT_ALG", "HS256")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test_bootstrap.db")

import models.feedback  # noqa: F401
import models.moderation_settings  # noqa: F401
import models.user  # noqa: F401
from core.security import create_access, hash_password
from db.base import Base
from db.session import get_db
from main import app
from models.user import User


@pytest.fixture(scope="session", autouse=True)
def test_env() -> Generator[None, None, None]:
    yield


@pytest_asyncio.fixture()
async def db_session_factory() -> AsyncGenerator[async_sessionmaker[AsyncSession], None]:
    fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    db_url = f"sqlite+aiosqlite:///{db_path}"

    engine = create_async_engine(db_url, future=True)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    try:
        yield session_factory
    finally:
        await engine.dispose()
        if os.path.exists(db_path):
            os.remove(db_path)


@pytest_asyncio.fixture()
async def api_client(
    db_session_factory: async_sessionmaker[AsyncSession],
) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with db_session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture()
async def admin_auth_header(
    db_session_factory: async_sessionmaker[AsyncSession],
) -> dict[str, str]:
    async with db_session_factory() as session:
        user = User(email="admin@test.local", hashed_password=hash_password("admin123"))
        session.add(user)
        await session.commit()
        await session.refresh(user)
    token = create_access(subject=str(user.id), expire_minutes=60)
    return {"Authorization": f"Bearer {token}"}
