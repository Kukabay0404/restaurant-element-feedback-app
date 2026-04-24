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


@pytest.mark.asyncio
async def test_feedback_create_uses_category_ratings(
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

    low_category_response = await api_client.post(
        "/api/v1/feedback/create",
        json={
            "type": "review",
            "service_rating": 1,
            "food_rating": 1,
            "interior_rating": 1,
            "text": "Everything needs attention",
            "name": "Category Low",
            "contact": "@category-low",
        },
    )
    assert low_category_response.status_code == 201
    low_payload = low_category_response.json()
    assert low_payload["rating"] == 1
    assert low_payload["service_rating"] == 1
    assert low_payload["food_rating"] == 1
    assert low_payload["interior_rating"] == 1
    assert low_payload["is_approved"] is False

    high_category_response = await api_client.post(
        "/api/v1/feedback/create",
        json={
            "type": "review",
            "service_rating": 4,
            "food_rating": 5,
            "interior_rating": 5,
            "text": "Strong experience across categories",
            "name": "Category High",
            "contact": "@category-high",
        },
    )
    assert high_category_response.status_code == 201
    high_payload = high_category_response.json()
    assert high_payload["rating"] == 9
    assert high_payload["service_rating"] == 4
    assert high_payload["food_rating"] == 5
    assert high_payload["interior_rating"] == 5
    assert high_payload["is_approved"] is True


@pytest.mark.asyncio
async def test_feedback_create_backfills_category_ratings_from_overall_rating(
    api_client: AsyncClient,
) -> None:
    response = await api_client.post(
        "/api/v1/feedback/create",
        json={
            "type": "review",
            "rating": 8,
            "text": "Legacy client payload",
            "name": "Legacy User",
            "contact": "@legacy",
        },
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["rating"] == 8
    assert payload["service_rating"] == 4
    assert payload["food_rating"] == 4
    assert payload["interior_rating"] == 4


@pytest.mark.asyncio
async def test_feedback_create_requires_full_category_set(
    api_client: AsyncClient,
) -> None:
    response = await api_client.post(
        "/api/v1/feedback/create",
        json={
            "type": "review",
            "service_rating": 5,
            "food_rating": 4,
            "text": "Partial category payload",
            "name": "Broken User",
            "contact": "@broken",
        },
    )
    assert response.status_code == 422
