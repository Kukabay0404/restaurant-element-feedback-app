import { useEffect, useMemo, useState } from "react";

import { getApiBase, readJsonResponse } from "../api";
import {
  defaultCategoryRatings,
  formatCategoryBreakdown,
  normalizeRating,
  ratingCategories,
  ratingOptions,
  type CategoryRatings,
  type RatingField,
} from "../feedbackRatings";

type FeedbackType = "review" | "suggestion";

type FeedbackItem = {
  id: number;
  type: FeedbackType;
  rating: number;
  service_rating: number;
  food_rating: number;
  interior_rating: number;
  text: string;
  name: string;
  contact: string;
  created_at: string;
  source?: string | null;
  is_approved: boolean;
};

export default function Feedback() {
  const [type, setType] = useState<FeedbackType>("review");
  const [categoryRatings, setCategoryRatings] = useState<CategoryRatings>(defaultCategoryRatings);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [listStatus, setListStatus] = useState<"idle" | "loading" | "error">("idle");
  const [listError, setListError] = useState("");
  const [filter, setFilter] = useState<"all" | FeedbackType>("all");
  const rating = useMemo(() => normalizeRating(categoryRatings), [categoryRatings]);

  const canSubmit = useMemo(
    () => name.trim().length > 0 && contact.trim().length > 0 && text.trim().length > 0,
    [name, contact, text]
  );

  const apiBase = getApiBase();

  const loadFeedback = async () => {
    setListStatus("loading");
    setListError("");
    try {
      const response = await fetch(`${apiBase}/api/v1/feedback/`);
      if (!response.ok) {
        throw new Error("Не удалось загрузить отзывы");
      }
      const data = await readJsonResponse<FeedbackItem[]>(response, "Не удалось загрузить отзывы");
      setItems(data);
      setListStatus("idle");
    } catch (err) {
      setListStatus("error");
      setListError(err instanceof Error ? err.message : "Не удалось загрузить отзывы");
    }
  };

  useEffect(() => {
    void loadFeedback();
  }, []);

  const updateCategoryRating = (key: RatingField, value: number) => {
    setCategoryRatings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submitFeedback = async () => {
    setStatus("loading");
    setError("");

    const payloadRatings =
      type === "suggestion"
        ? {
            rating: 10,
            service_rating: 5,
            food_rating: 5,
            interior_rating: 5,
          }
        : {
            rating,
            ...categoryRatings,
          };

    try {
      const response = await fetch(`${apiBase}/api/v1/feedback/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          ...payloadRatings,
          name: name.trim(),
          contact: contact.trim(),
          text: text.trim(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const detail = typeof payload?.detail === "string" ? payload.detail : "Ошибка отправки";
        throw new Error(detail);
      }

      setStatus("success");
      setCategoryRatings(defaultCategoryRatings);
      setName("");
      setContact("");
      setText("");
      await loadFeedback();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Ошибка отправки");
    }
  };

  const visibleItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.type === filter);
  }, [items, filter]);

  return (
    <div className="page">
      <div className="glow" aria-hidden />
      <div className="card">
        <div className="header">
          <p className="brand">ELEMENT</p>
          <p className="tagline">Совершенство вкуса</p>
          <a className="anchor" href="#reviews">
            Смотреть отзывы
          </a>
        </div>

        <div className="toggle">
          <button
            className={`toggle-btn ${type === "review" ? "active" : ""}`}
            onClick={() => setType("review")}
            type="button"
          >
            Отзыв
          </button>
          <button
            className={`toggle-btn ${type === "suggestion" ? "active" : ""}`}
            onClick={() => setType("suggestion")}
            type="button"
          >
            Предложение
          </button>
          <span className="toggle-pill" />
        </div>

        {type === "review" && (
          <div className="rating">
            {ratingCategories.map((category) => (
              <div className="rating-line" key={category.key}>
                <p className="rating-label">{category.label}</p>
                <div className="rating-row" role="radiogroup" aria-label={`${category.label}: оценка от 1 до 5`}>
                  {ratingOptions.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`rating-btn ${categoryRatings[category.key] === value ? "active" : ""}`}
                      onClick={() => updateCategoryRating(category.key, value)}
                      aria-pressed={categoryRatings[category.key] === value}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="fields">
          <div className="field">
            <label htmlFor="name">Имя</label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Как к вам обращаться"
            />
          </div>
          <div className="field">
            <label htmlFor="contact">Контакты</label>
            <input
              id="contact"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="Instagram или телефон"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="text">Ваш опыт</label>
          <textarea
            id="text"
            rows={4}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Поделитесь впечатлениями..."
          />
        </div>

        <button className="submit" onClick={submitFeedback} disabled={!canSubmit || status === "loading"} type="button">
          {status === "loading" ? "Отправляем..." : "Отправить"}
        </button>

        {status === "success" && <p className="message success">Спасибо! Мы получили ваше предложение.</p>}
        {status === "error" && <p className="message error">{error}</p>}
        {!canSubmit && status !== "success" && (
          <p className="message hint">Заполните все поля, чтобы отправить отзыв.</p>
        )}
      </div>

      <section className="reviews" id="reviews">
        <div className="reviews-header">
          <p className="section-title">Отзывы гостей</p>
          <div className="filter">
            <button
              type="button"
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Все
            </button>
            <button
              type="button"
              className={`filter-btn ${filter === "review" ? "active" : ""}`}
              onClick={() => setFilter("review")}
            >
              Отзывы
            </button>
            <button
              type="button"
              className={`filter-btn ${filter === "suggestion" ? "active" : ""}`}
              onClick={() => setFilter("suggestion")}
            >
              Предложения
            </button>
          </div>
        </div>

        {listStatus === "loading" && <p className="message hint">Загрузка отзывов...</p>}
        {listStatus === "error" && <p className="message error">{listError}</p>}

        {listStatus !== "loading" && visibleItems.length === 0 && (
          <p className="message hint">Пока нет одобренных отзывов.</p>
        )}

        <div className="grid">
          {visibleItems.map((item) => (
            <article key={item.id} className="review-card">
              <div className="review-top">
                <span className="review-name">{item.name}</span>
                {item.type === "review" && <span className="review-rating">{item.rating}</span>}
              </div>
              <p className="review-text">{item.text}</p>
              {item.type === "review" && <p className="review-breakdown">{formatCategoryBreakdown(item)}</p>}
              <div className="review-meta">
                <span className="review-type">{item.type === "review" ? "Отзыв" : "Предложение"}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

