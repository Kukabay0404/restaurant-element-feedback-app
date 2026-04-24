import math


CATEGORY_RATING_MIN = 1
CATEGORY_RATING_MAX = 5
OVERALL_RATING_MIN = 1
OVERALL_RATING_MAX = 10
CATEGORY_RATING_FIELDS = ("service_rating", "food_rating", "interior_rating")


def _round_half_up(value: float) -> int:
    return math.floor(value + 0.5)


def normalize_rating(*, service_rating: int, food_rating: int, interior_rating: int) -> int:
    min_total = len(CATEGORY_RATING_FIELDS) * CATEGORY_RATING_MIN
    max_total = len(CATEGORY_RATING_FIELDS) * CATEGORY_RATING_MAX
    total = service_rating + food_rating + interior_rating
    normalized = ((total - min_total) / (max_total - min_total)) * (OVERALL_RATING_MAX - OVERALL_RATING_MIN)
    return _round_half_up(normalized) + OVERALL_RATING_MIN


def project_overall_rating_to_category(rating: int) -> int:
    projected = ((rating - OVERALL_RATING_MIN) / (OVERALL_RATING_MAX - OVERALL_RATING_MIN)) * (
        CATEGORY_RATING_MAX - CATEGORY_RATING_MIN
    )
    return _round_half_up(projected) + CATEGORY_RATING_MIN
