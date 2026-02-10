import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_feedback_auto_approval_respects_threshold(
    api_client: AsyncClient,
    admin_auth_header: dict[str, str],
) -> None:
    settings_response = await api_client.patch(
        "/api/v1/feedback/admin/settings/moderation",
        headers=admin_auth_header,
        json={
            "auto_approve_enabled": True,
            "manual_review_rating_threshold": 6,
        },
    )
    assert settings_response.status_code == 200

    low_rating_response = await api_client.post(
        "/api/v1/feedback/create",
        json={
            "type": "review",
            "rating": 6,
            "text": "Needs manual review",
            "name": "Low User",
            "contact": "@low",
        },
    )
    assert low_rating_response.status_code == 201

    high_rating_response = await api_client.post(
        "/api/v1/feedback/create",
        json={
            "type": "review",
            "rating": 8,
            "text": "Can be auto approved",
            "name": "High User",
            "contact": "@high",
        },
    )
    assert high_rating_response.status_code == 201

    admin_list_response = await api_client.get(
        "/api/v1/feedback/admin",
        headers=admin_auth_header,
    )
    assert admin_list_response.status_code == 200
    items = admin_list_response.json()
    by_name = {item["name"]: item for item in items}

    assert by_name["Low User"]["is_approved"] is False
    assert by_name["High User"]["is_approved"] is True
