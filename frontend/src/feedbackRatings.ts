export type RatingField = "service_rating" | "food_rating" | "interior_rating";
export type CategoryRatings = Record<RatingField, number>;

export const ratingOptions = Array.from({ length: 5 }, (_, i) => i + 1);

export const ratingCategories: { key: RatingField; label: string }[] = [
  { key: "service_rating", label: "Сервис" },
  { key: "food_rating", label: "Еда" },
  { key: "interior_rating", label: "Интерьер" },
];

export const defaultCategoryRatings: CategoryRatings = {
  service_rating: 3,
  food_rating: 5,
  interior_rating: 4,
};

export const normalizeRating = (ratings: CategoryRatings) => {
  const minTotal = ratingCategories.length;
  const maxTotal = ratingCategories.length * ratingOptions.length;
  const total = ratingCategories.reduce((sum, category) => sum + ratings[category.key], 0);
  return Math.round(((total - minTotal) / (maxTotal - minTotal)) * 9) + 1;
};

export const formatCategoryBreakdown = (ratings: Partial<CategoryRatings>) =>
  ratingCategories
    .filter((category) => typeof ratings[category.key] === "number")
    .map((category) => `${category.label}: ${ratings[category.key]}`)
    .join(" · ");
