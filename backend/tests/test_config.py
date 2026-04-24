from pathlib import Path

import pytest

from core.config import Settings


def test_settings_ignore_extra_env_vars(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    for env_name in ("DATABASE_URL", "JWT_SECRET_KEY", "JWT_ALG"):
        monkeypatch.delenv(env_name, raising=False)

    env_file = tmp_path / ".env"
    env_file.write_text(
        "\n".join(
            [
                "DATABASE_URL=sqlite+aiosqlite:///./test.db",
                "JWT_SECRET_KEY=test-secret",
                "JWT_ALG=HS256",
                "POSTGRES_DB=element_feedback",
                "POSTGRES_USER=postgres",
                "POSTGRES_PASSWORD=postgres",
                "PGADMIN_DEFAULT_EMAIL=test@example.com",
                "PGADMIN_DEFAULT_PASSWORD=admin",
            ]
        ),
        encoding="utf-8",
    )

    settings = Settings(_env_file=env_file)

    assert settings.DATABASE_URL == "sqlite+aiosqlite:///./test.db"
    assert settings.JWT_SECRET_KEY == "test-secret"
    assert settings.JWT_ALG == "HS256"
