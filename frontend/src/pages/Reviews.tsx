import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import "../dashboard.css";
import AdminLogin from "./AdminLogin";
import useAdminAuth from "./useAdminAuth";
import useAdminFeedback, { exportCsv } from "./useAdminFeedback";

type FeedbackType = "review" | "suggestion";
type StatusFilter = "all" | "approved" | "pending";

export default function Reviews() {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";
  const { token, email, password, authStatus, authError, setEmail, setPassword, handleLogin, logout } =
    useAdminAuth(apiBase);
  const { items, status, error, actionError, approveFeedback, deleteFeedback, formatDate } = useAdminFeedback({
    apiBase,
    token,
    onUnauthorized: logout,
  });

  const [filter, setFilter] = useState<"all" | FeedbackType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number>(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = filter === "all" ? true : item.type === filter;
      const matchesStatus =
        statusFilter === "all" ? true : statusFilter === "approved" ? item.is_approved : !item.is_approved;
      const matchesSearch =
        query.length === 0 ||
        item.name.toLowerCase().includes(query) ||
        item.text.toLowerCase().includes(query) ||
        item.contact.toLowerCase().includes(query);
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [items, filter, statusFilter, search]);

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

  const confirmDelete = async () => {
    if (confirmDeleteId === null) return;
    await deleteFeedback(confirmDeleteId);
    setConfirmDeleteId(null);
  };

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
          <div className="dashboard-search">
            <span className="dashboard-search-icon" />
            <input placeholder="Поиск" value={search} onChange={(event) => setSearch(event.target.value)} />
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

        <section className="dashboard-content reviews-layout">
          <div className="dashboard-table-card">
            <div className="dashboard-table-header">
              <h4>Все отзывы</h4>
              <div className="dashboard-filters">
                <button
                  className={`dashboard-filter-btn ${filter === "all" ? "active" : ""}`}
                  type="button"
                  onClick={() => setFilter("all")}
                >
                  Все
                </button>
                <button
                  className={`dashboard-filter-btn ${filter === "review" ? "active" : ""}`}
                  type="button"
                  onClick={() => setFilter("review")}
                >
                  Отзывы
                </button>
                <button
                  className={`dashboard-filter-btn ${filter === "suggestion" ? "active" : ""}`}
                  type="button"
                  onClick={() => setFilter("suggestion")}
                >
                  Предложения
                </button>
              </div>
            </div>

            <div className="dashboard-filter-row">
              <button
                className={`dashboard-filter-btn ${statusFilter === "all" ? "active" : ""}`}
                type="button"
                onClick={() => setStatusFilter("all")}
              >
                Все статусы
              </button>
              <button
                className={`dashboard-filter-btn ${statusFilter === "pending" ? "active" : ""}`}
                type="button"
                onClick={() => setStatusFilter("pending")}
              >
                Неодобренные
              </button>
              <button
                className={`dashboard-filter-btn ${statusFilter === "approved" ? "active" : ""}`}
                type="button"
                onClick={() => setStatusFilter("approved")}
              >
                Одобренные
              </button>
            </div>

            {status === "loading" && <p className="dashboard-state">Загрузка...</p>}
            {status === "error" && <p className="dashboard-error">{error}</p>}
            {status === "idle" && filteredItems.length === 0 && (
              <p className="dashboard-state">Нет отзывов по выбранным фильтрам.</p>
            )}

            <div className="dashboard-table">
              <div className="dashboard-table-row dashboard-table-head reviews">
                <span>Гость</span>
                <span>Тип</span>
                <span>Оценка</span>
                <span>Дата</span>
                <span>Статус</span>
                <span>Действия</span>
              </div>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`dashboard-table-row selectable reviews ${selectedId === item.id ? "active" : ""}`}
                  onClick={() => setSelectedId(item.id)}
                  role="button"
                  tabIndex={0}
                >
                  <span>{item.name}</span>
                  <span className={`dashboard-pill ${item.type}`}>{item.type}</span>
                  <span>{item.rating}</span>
                  <span className="dashboard-date">{formatDate(item.created_at)}</span>
                  <span className={`dashboard-status-pill ${item.is_approved ? "approved" : "pending"}`}>
                    {item.is_approved ? "Одобрен" : "Неодобрен"}
                  </span>
                  <span className="dashboard-actions">
                    {!item.is_approved && (
                      <button
                        type="button"
                        className="dashboard-action-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          approveFeedback(item.id);
                        }}
                      >
                        Одобрить
                      </button>
                    )}
                    <button
                      type="button"
                      className="dashboard-action-btn danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        setConfirmDeleteId(item.id);
                      }}
                    >
                      Удалить
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <aside className="dashboard-detail-card">
            <div className="dashboard-detail-header">
              <h4>Детали отзыва</h4>
            </div>
            {actionError && <p className="dashboard-error">{actionError}</p>}
            {selectedItem ? (
              <div className="dashboard-detail-body">
                <div>
                  <p className="dashboard-detail-label">Гость</p>
                  <p className="dashboard-detail-value">{selectedItem.name}</p>
                </div>
                <div>
                  <p className="dashboard-detail-label">Оценка</p>
                  <p className="dashboard-detail-value">{selectedItem.rating}</p>
                </div>
                <div>
                  <p className="dashboard-detail-label">Тип</p>
                  <p className="dashboard-detail-value">{selectedItem.type === "review" ? "Отзыв" : "Предложение"}</p>
                </div>
                <div>
                  <p className="dashboard-detail-label">Комментарий</p>
                  <p className="dashboard-detail-text">{selectedItem.text}</p>
                </div>
                <div>
                  <p className="dashboard-detail-label">Контакты</p>
                  <p className="dashboard-detail-value">{selectedItem.contact}</p>
                </div>
              </div>
            ) : (
              <p className="dashboard-detail-empty">Нет выбранного отзыва.</p>
            )}
          </aside>
        </section>
      </main>

      {confirmDeleteId !== null && (
        <div className="dashboard-modal">
          <div className="dashboard-modal-card" role="dialog" aria-modal="true">
            <h4>Удалить отзыв?</h4>
            <p>Это действие необратимо.</p>
            <div className="dashboard-modal-actions">
              <button type="button" onClick={() => setConfirmDeleteId(null)}>
                Отмена
              </button>
              <button type="button" className="danger" onClick={confirmDelete}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
