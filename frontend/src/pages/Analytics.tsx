import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import "../dashboard.css";
import AdminLogin from "./AdminLogin";
import useAdminAuth from "./useAdminAuth";
import useAdminFeedback, { exportCsv } from "./useAdminFeedback";

type FeedbackType = "review" | "suggestion";
type StatusFilter = "all" | "approved" | "pending";
type RangeFilter = 7 | 30 | 90;

type Bucket = {
  key: number;
  label: string;
  value: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
const toTimestamp = (value: string) => {
  if (!value) return Number.NaN;
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return value.trim().length <= 10 ? numeric * 1000 : numeric;
  }
  let ts = Date.parse(value);
  if (!Number.isNaN(ts)) return ts;
  ts = Date.parse(value.replace(" ", "T"));
  if (!Number.isNaN(ts)) return ts;
  return Date.parse(`${value.replace(" ", "T")}Z`);
};

export default function Analytics() {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";
  const { token, email, password, authStatus, authError, setEmail, setPassword, handleLogin, logout } =
    useAdminAuth(apiBase);
  const { items, status, error, stats } = useAdminFeedback({
    apiBase,
    token,
    onUnauthorized: logout,
  });

  const [range, setRange] = useState<RangeFilter>(30);
  const [typeFilter, setTypeFilter] = useState<"all" | FeedbackType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredItems = useMemo(() => {
    const from = startOfDay(new Date()) - (range - 1) * DAY_MS;
    return items.filter((item) => {
      const ts = toTimestamp(item.created_at);
      if (Number.isNaN(ts) || ts < from) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (statusFilter === "approved" && !item.is_approved) return false;
      if (statusFilter === "pending" && item.is_approved) return false;
      return true;
    });
  }, [items, range, typeFilter, statusFilter]);

  const approvalRate = useMemo(() => {
    if (filteredItems.length === 0) return 0;
    const approved = filteredItems.filter((item) => item.is_approved).length;
    return Math.round((approved / filteredItems.length) * 100);
  }, [filteredItems]);

  const typeBreakdown = useMemo(() => {
    const reviews = filteredItems.filter((item) => item.type === "review").length;
    const suggestions = filteredItems.filter((item) => item.type === "suggestion").length;
    return { reviews, suggestions };
  }, [filteredItems]);

  const statusBreakdown = useMemo(() => {
    const approved = filteredItems.filter((item) => item.is_approved).length;
    const pending = filteredItems.length - approved;
    return { approved, pending };
  }, [filteredItems]);

  const dailyBuckets = useMemo<Bucket[]>(() => {
    const todayStart = startOfDay(new Date());
    const map = new Map<number, number>();
    for (let i = range - 1; i >= 0; i -= 1) {
      map.set(todayStart - i * DAY_MS, 0);
    }
    filteredItems.forEach((item) => {
      const ts = toTimestamp(item.created_at);
      if (Number.isNaN(ts)) return;
      const key = startOfDay(new Date(ts));
      if (map.has(key)) {
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    });
    return [...map.entries()].map(([key, value]) => ({
      key,
      label: new Date(key).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
      value,
    }));
  }, [filteredItems, range]);

  const lowRatingItems = useMemo(
    () =>
      filteredItems
        .filter((item) => item.rating <= 6)
        .sort((a, b) => a.rating - b.rating)
        .slice(0, 5),
    [filteredItems]
  );

  const maxTrend = Math.max(...dailyBuckets.map((bucket) => bucket.value), 1);

  if (!token) {
    return (
      <AdminLogin
        email={email}
        password={password}
        authStatus={authStatus}
        authError={authError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">ELEMENT</div>
        <nav className="dashboard-nav">
          <NavLink to="/dashboard" end className={({ isActive }) => `dashboard-nav-item ${isActive ? "active" : ""}`}>
            <span className="dashboard-nav-icon" />
            Панель
          </NavLink>
          <NavLink
            to="/dashboard/reviews"
            className={({ isActive }) => `dashboard-nav-item ${isActive ? "active" : ""}`}
          >
            <span className="dashboard-nav-icon" />
            Отзывы
          </NavLink>
          <NavLink
            to="/dashboard/analytics"
            className={({ isActive }) => `dashboard-nav-item ${isActive ? "active" : ""}`}
          >
            <span className="dashboard-nav-icon" />
            Аналитика
          </NavLink>
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) => `dashboard-nav-item ${isActive ? "active" : ""}`}
          >
            <span className="dashboard-nav-icon" />
            Настройки
          </NavLink>
        </nav>
        <div className="dashboard-sidebar-footer">Админ-панель</div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="analytics-filters">
            <div className="dashboard-filters">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  className={`dashboard-filter-btn ${range === days ? "active" : ""}`}
                  type="button"
                  onClick={() => setRange(days as RangeFilter)}
                >
                  {days} дней
                </button>
              ))}
            </div>
            <div className="dashboard-filters">
              <button
                className={`dashboard-filter-btn ${typeFilter === "all" ? "active" : ""}`}
                type="button"
                onClick={() => setTypeFilter("all")}
              >
                Все типы
              </button>
              <button
                className={`dashboard-filter-btn ${typeFilter === "review" ? "active" : ""}`}
                type="button"
                onClick={() => setTypeFilter("review")}
              >
                Отзывы
              </button>
              <button
                className={`dashboard-filter-btn ${typeFilter === "suggestion" ? "active" : ""}`}
                type="button"
                onClick={() => setTypeFilter("suggestion")}
              >
                Предложения
              </button>
            </div>
            <div className="dashboard-filters">
              <button
                className={`dashboard-filter-btn ${statusFilter === "all" ? "active" : ""}`}
                type="button"
                onClick={() => setStatusFilter("all")}
              >
                Все статусы
              </button>
              <button
                className={`dashboard-filter-btn ${statusFilter === "approved" ? "active" : ""}`}
                type="button"
                onClick={() => setStatusFilter("approved")}
              >
                Одобренные
              </button>
              <button
                className={`dashboard-filter-btn ${statusFilter === "pending" ? "active" : ""}`}
                type="button"
                onClick={() => setStatusFilter("pending")}
              >
                Неодобренные
              </button>
            </div>
          </div>
          <div className="dashboard-topbar-actions">
            <button className="dashboard-export-btn" type="button" onClick={() => exportCsv(filteredItems)}>
              Экспорт CSV
            </button>
            <button className="dashboard-logout-btn" type="button" onClick={logout}>
              Выйти
            </button>
          </div>
        </header>

        {status === "loading" && <p className="dashboard-state">Загрузка аналитики...</p>}
        {status === "error" && <p className="dashboard-error">{error}</p>}

        <section className="dashboard-stats">
          <article className="dashboard-stat-card">
            <p>Всего за период</p>
            <h3>{filteredItems.length}</h3>
          </article>
          <article className="dashboard-stat-card">
            <p>Средняя оценка</p>
            <h3>{filteredItems.length === 0 ? "-" : (filteredItems.reduce((sum, item) => sum + item.rating, 0) / filteredItems.length).toFixed(1)}</h3>
          </article>
          <article className="dashboard-stat-card">
            <p>Процент одобрения</p>
            <h3>{approvalRate}%</h3>
          </article>
          <article className="dashboard-stat-card">
            <p>Новые за 7 дней</p>
            <h3>{stats.newThisWeek}</h3>
          </article>
        </section>

        <section className="analytics-layout">
          <article className="dashboard-table-card analytics-card">
            <div className="dashboard-table-header">
              <h4>Динамика отзывов</h4>
            </div>
            <div className="analytics-trend">
              {dailyBuckets.map((bucket) => (
                <div key={bucket.key} className="analytics-trend-col" title={`${bucket.label}: ${bucket.value}`}>
                  <div className="analytics-trend-bar" style={{ height: `${Math.max((bucket.value / maxTrend) * 100, 4)}%` }} />
                  <span>{bucket.label}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-table-card analytics-card">
            <div className="dashboard-table-header">
              <h4>Разрезы</h4>
            </div>
            <div className="analytics-split">
              <div className="analytics-chip">Отзывы: {typeBreakdown.reviews}</div>
              <div className="analytics-chip">Предложения: {typeBreakdown.suggestions}</div>
              <div className="analytics-chip">Одобрено: {statusBreakdown.approved}</div>
              <div className="analytics-chip">Неодобрено: {statusBreakdown.pending}</div>
            </div>
          </article>
        </section>

        <section className="dashboard-table-card analytics-card">
          <div className="dashboard-table-header">
            <h4>Требует внимания (оценка 6 и ниже)</h4>
          </div>
          {lowRatingItems.length === 0 ? (
            <p className="dashboard-state">Нет проблемных отзывов в выбранном периоде.</p>
          ) : (
            <div className="dashboard-table">
              <div className="dashboard-table-row dashboard-table-head">
                <span>Гость</span>
                <span>Тип</span>
                <span>Оценка</span>
                <span>Дата</span>
                <span>Статус</span>
              </div>
              {lowRatingItems.map((item) => (
                <div key={item.id} className="dashboard-table-row">
                  <span>{item.name}</span>
                  <span className={`dashboard-pill ${item.type}`}>{item.type}</span>
                  <span>{item.rating}</span>
                  <span>{new Date(item.created_at).toLocaleDateString("ru-RU")}</span>
                  <span className={`dashboard-status-pill ${item.is_approved ? "approved" : "pending"}`}>
                    {item.is_approved ? "Одобрен" : "Неодобрен"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
