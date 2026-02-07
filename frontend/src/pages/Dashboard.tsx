import { useEffect, useMemo, useState } from "react";
import "../dashboard.css";

type FeedbackType = "review" | "suggestion";

type FeedbackItem = {
  id: number;
  name: string;
  type: FeedbackType;
  rating: number;
  text: string;
  contact: string;
  created_at: string;
  source?: string | null;
  is_approved: boolean;
};

type Stats = {
  total: number;
  avgRating: number | null;
  newThisWeek: number;
};

const TOKEN_KEY = "admin_token";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU");
};

export default function Dashboard() {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";

  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authStatus, setAuthStatus] = useState<"idle" | "loading" | "error">("idle");
  const [authError, setAuthError] = useState("");

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [filter, setFilter] = useState<"all" | FeedbackType>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number>(0);

  const saveToken = (value: string) => {
    setToken(value);
    if (value) {
      localStorage.setItem(TOKEN_KEY, value);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers,
    });
    if (response.status === 401) {
      saveToken("");
      throw new Error("Требуется вход");
    }
    return response;
  };

  const loadFeedback = async () => {
    setStatus("loading");
    setError("");
    try {
      const response = await apiFetch("/api/v1/feedback/admin");
      if (!response.ok) {
        throw new Error("Не удалось загрузить отзывы");
      }
      const data = (await response.json()) as FeedbackItem[];
      setItems(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Не удалось загрузить отзывы");
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthStatus("loading");
    setAuthError("");

    try {
      const response = await fetch(`${apiBase}/api/v1/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: email.trim(),
          password,
        }),
      });
      if (!response.ok) {
        throw new Error("Неверный логин или пароль");
      }
      const data = (await response.json()) as { access_token: string };
      saveToken(data.access_token);
      setAuthStatus("idle");
      setPassword("");
    } catch (err) {
      setAuthStatus("error");
      setAuthError(err instanceof Error ? err.message : "Не удалось войти");
    }
  };

  const approveFeedback = async (id: number) => {
    setActionError("");
    try {
      const response = await apiFetch(`/api/v1/feedback/admin/${id}/approve`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Не удалось одобрить отзыв");
      }
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_approved: true } : item)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не удалось одобрить отзыв");
    }
  };

  const deleteFeedback = async (id: number) => {
    setActionError("");
    try {
      const response = await apiFetch(`/api/v1/feedback/delete/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Не удалось удалить отзыв");
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не удалось удалить отзыв");
    }
  };

  useEffect(() => {
    if (token) {
      loadFeedback();
    }
  }, [token]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter = filter === "all" ? true : item.type === filter;
      const matchesSearch =
        query.length === 0 ||
        item.name.toLowerCase().includes(query) ||
        item.text.toLowerCase().includes(query) ||
        item.contact.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [items, filter, search]);

  const pendingItems = useMemo(() => filteredItems.filter((item) => !item.is_approved), [filteredItems]);
  const approvedItems = useMemo(() => filteredItems.filter((item) => item.is_approved), [filteredItems]);

  const stats = useMemo<Stats>(() => {
    if (items.length === 0) {
      return { total: 0, avgRating: null, newThisWeek: 0 };
    }
    const total = items.length;
    const avgRating =
      items.reduce((sum, item) => sum + (item.rating || 0), 0) / Math.max(items.length, 1);
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const newThisWeek = items.filter((item) => {
      const created = new Date(item.created_at).getTime();
      return !Number.isNaN(created) && created >= weekAgo;
    }).length;
    return { total, avgRating: Number.isNaN(avgRating) ? null : avgRating, newThisWeek };
  }, [items]);

  const selectedItem = useMemo(() => {
    return filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0];
  }, [filteredItems, selectedId]);

  useEffect(() => {
    if (filteredItems.length === 0) {
      setSelectedId(0);
      return;
    }
    if (!filteredItems.some((item) => item.id === selectedId)) {
      setSelectedId(filteredItems[0].id);
    }
  }, [filteredItems, selectedId]);

  if (!token) {
    return (
      <div className="dashboard-login-page">
        <form className="dashboard-login-card" onSubmit={handleLogin}>
          <div className="dashboard-login-title">Admin Login</div>
          <label className="dashboard-login-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
            required
          />
          <label className="dashboard-login-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
          />
          <button className="dashboard-login-btn" type="submit" disabled={authStatus === "loading"}>
            {authStatus === "loading" ? "Входим..." : "Войти"}
          </button>
          {authStatus === "error" && <p className="dashboard-login-error">{authError}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">ELEMENT</div>
        <nav className="dashboard-nav">
          <button className="dashboard-nav-item active" type="button">
            <span className="dashboard-nav-icon" />
            Dashboard
          </button>
          <button className="dashboard-nav-item" type="button">
            <span className="dashboard-nav-icon" />
            Reviews
          </button>
          <button className="dashboard-nav-item" type="button">
            <span className="dashboard-nav-icon" />
            Analytics
          </button>
          <button className="dashboard-nav-item" type="button">
            <span className="dashboard-nav-icon" />
            Settings
          </button>
        </nav>
        <div className="dashboard-sidebar-footer">Admin Panel</div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-search">
            <span className="dashboard-search-icon" />
            <input
              placeholder="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="dashboard-topbar-actions">
            <button className="dashboard-icon-btn" type="button" aria-label="Notifications">
              <span />
            </button>
            <button className="dashboard-avatar" type="button" aria-label="Profile">
              <span />
            </button>
            <button className="dashboard-icon-btn dashboard-close" type="button" onClick={() => saveToken("")}>
              x
            </button>
          </div>
        </header>

        <section className="dashboard-stats">
          <article className="dashboard-stat-card">
            <p>Total Reviews</p>
            <h3>{stats.total}</h3>
            <div className="dashboard-sparkline" />
          </article>
          <article className="dashboard-stat-card">
            <p>Average Rating (1-10)</p>
            <h3>{stats.avgRating === null ? "-" : stats.avgRating.toFixed(1)}</h3>
            <div className="dashboard-sparkline" />
          </article>
          <article className="dashboard-stat-card">
            <p>New this Week</p>
            <h3>{stats.newThisWeek}</h3>
            <div className="dashboard-bars">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </article>
        </section>

        <section className="dashboard-content">
          <div className="dashboard-lists">
            <div className="dashboard-table-card">
              <div className="dashboard-table-header">
                <h4>Pending Review</h4>
                <div className="dashboard-filters">
                  <button
                    className={`dashboard-filter-btn ${filter === "all" ? "active" : ""}`}
                    type="button"
                    onClick={() => setFilter("all")}
                  >
                    All
                  </button>
                  <button
                    className={`dashboard-filter-btn ${filter === "review" ? "active" : ""}`}
                    type="button"
                    onClick={() => setFilter("review")}
                  >
                    Reviews
                  </button>
                  <button
                    className={`dashboard-filter-btn ${filter === "suggestion" ? "active" : ""}`}
                    type="button"
                    onClick={() => setFilter("suggestion")}
                  >
                    Suggestions
                  </button>
                </div>
              </div>

              {status === "loading" && <p className="dashboard-state">Loading...</p>}
              {status === "error" && <p className="dashboard-error">{error}</p>}
              {status === "idle" && pendingItems.length === 0 && <p className="dashboard-state">No pending items.</p>}

              <div className="dashboard-table">
                <div className="dashboard-table-row dashboard-table-head">
                  <span>Guest Name</span>
                  <span>Type</span>
                  <span>Rating</span>
                  <span>Date</span>
                  <span>Actions</span>
                </div>
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className={`dashboard-table-row selectable ${selectedId === item.id ? "active" : ""}`}
                    onClick={() => setSelectedId(item.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <span>{item.name}</span>
                    <span className={`dashboard-pill ${item.type}`}>{item.type}</span>
                    <span>{item.rating}</span>
                    <span>{formatDate(item.created_at)}</span>
                    <span className="dashboard-actions">
                      <button
                        type="button"
                        className="dashboard-action-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          approveFeedback(item.id);
                        }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="dashboard-action-btn danger"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteFeedback(item.id);
                        }}
                      >
                        Delete
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-table-card">
              <div className="dashboard-table-header">
                <h4>Approved Review</h4>
              </div>

              {status === "idle" && approvedItems.length === 0 && <p className="dashboard-state">No approved items.</p>}

              <div className="dashboard-table">
                <div className="dashboard-table-row dashboard-table-head">
                  <span>Guest Name</span>
                  <span>Type</span>
                  <span>Rating</span>
                  <span>Date</span>
                  <span>Actions</span>
                </div>
                {approvedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`dashboard-table-row selectable ${selectedId === item.id ? "active" : ""}`}
                    onClick={() => setSelectedId(item.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <span>{item.name}</span>
                    <span className={`dashboard-pill ${item.type}`}>{item.type}</span>
                    <span>{item.rating}</span>
                    <span>{formatDate(item.created_at)}</span>
                    <span className="dashboard-actions">
                      <button
                        type="button"
                        className="dashboard-action-btn danger"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteFeedback(item.id);
                        }}
                      >
                        Delete
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="dashboard-detail-card">
            <div className="dashboard-detail-header">
              <h4>Review Details</h4>
              <button className="dashboard-icon-btn dashboard-close" type="button">
                x
              </button>
            </div>
            {actionError && <p className="dashboard-error">{actionError}</p>}
            {selectedItem ? (
              <div className="dashboard-detail-body">
                <div>
                  <p className="dashboard-detail-label">Guest</p>
                  <p className="dashboard-detail-value">{selectedItem.name}</p>
                </div>
                <div>
                  <p className="dashboard-detail-label">Rating</p>
                  <p className="dashboard-detail-value">{selectedItem.rating}</p>
                </div>
                <div>
                  <p className="dashboard-detail-label">Type</p>
                  <p className="dashboard-detail-value">{selectedItem.type}</p>
                </div>
                <div>
                  <p className="dashboard-detail-label">Comment</p>
                  <p className="dashboard-detail-text">{selectedItem.text}</p>
                </div>
                <div>
                  <p className="dashboard-detail-label">Contact</p>
                  <p className="dashboard-detail-value">{selectedItem.contact}</p>
                </div>
              </div>
            ) : (
              <p className="dashboard-detail-empty">No feedback selected.</p>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
