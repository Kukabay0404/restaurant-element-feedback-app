import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_moderation_settings_requires_auth(api_client: AsyncClient) -> None:
    response = await api_client.get("/api/v1/feedback/admin/settings/moderation")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_default_moderation_settings(
    api_client: AsyncClient,
    admin_auth_header: dict[str, str],
) -> None:
    response = await api_client.get(
        "/api/v1/feedback/admin/settings/moderation",
        headers=admin_auth_header,
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["auto_approve_enabled"] is False
    assert payload["manual_review_rating_threshold"] == 6


@pytest.mark.asyncio
async def test_patch_moderation_settings(
    api_client: AsyncClient,
    admin_auth_header: dict[str, str],
) -> None:
    update_response = await api_client.patch(
        "/api/v1/feedback/admin/settings/moderation",
        headers=admin_auth_header,
        json={
            "auto_approve_enabled": True,
            "manual_review_rating_threshold": 7,
        },
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["auto_approve_enabled"] is True
    assert updated["manual_review_rating_threshold"] == 7

    fetch_response = await api_client.get(
        "/api/v1/feedback/admin/settings/moderation",
        headers=admin_auth_header,
    )
    assert fetch_response.status_code == 200
    fetched = fetch_response.json()
    assert fetched["auto_approve_enabled"] is True
    assert fetched["manual_review_rating_threshold"] == 7
