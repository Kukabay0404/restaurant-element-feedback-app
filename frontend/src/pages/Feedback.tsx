import { useEffect, useMemo, useState } from "react";

type FeedbackType = "review" | "suggestion";

type FeedbackItem = {
  id: number;
  type: FeedbackType;
  rating: number;
  text: string;
  name: string;
  contact: string;
  created_at: string;
  source?: string | null;
  is_approved: boolean;
};

const ratingOptions = Array.from({ length: 10 }, (_, i) => i + 1);

export default function Feedback() {
  const [type, setType] = useState<FeedbackType>("review");
  const [rating, setRating] = useState<number>(9);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string>("");
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [listStatus, setListStatus] = useState<"idle" | "loading" | "error">("idle");
  const [listError, setListError] = useState<string>("");
  const [filter, setFilter] = useState<"all" | FeedbackType>("all");

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && contact.trim().length > 0 && text.trim().length > 0;
  }, [name, contact, text]);

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";

  const loadFeedback = async () => {
    setListStatus("loading");
    setListError("");
    try {
      const response = await fetch(`${apiBase}/api/v1/feedback/`);
      if (!response.ok) {
        throw new Error("Не удалось загрузить отзывы");
      }
      const data = (await response.json()) as FeedbackItem[];
      setItems(data);
      setListStatus("idle");
    } catch (err) {
      setListStatus("error");
      setListError(err instanceof Error ? err.message : "Не удалось загрузить отзывы");
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const submitFeedback = async () => {
    setStatus("loading");
    setError("");

    try {
      const response = await fetch(`${apiBase}/api/v1/feedback/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          rating,
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

        <div className="rating">
          <p className="label">Оценка</p>
          <div className="rating-row">
            {ratingOptions.map((value) => (
              <button
                key={value}
                type="button"
                className={`rating-btn ${rating === value ? "active" : ""}`}
                onClick={() => setRating(value)}
                aria-pressed={rating === value}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

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

        <button
          className="submit"
          onClick={submitFeedback}
          disabled={!canSubmit || status === "loading"}
          type="button"
        >
          {status === "loading" ? "Отправляем..." : "Отправить"}
        </button>

        {status === "success" && <p className="message success">Спасибо! Мы получили ваш отзыв.</p>}
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
                <span className="review-rating">{item.rating}</span>
              </div>
              <p className="review-text">{item.text}</p>
              <div className="review-meta">
                <span className="review-type">
                  {item.type === "review" ? "Отзыв" : "Предложение"}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
