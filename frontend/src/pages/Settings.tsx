import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "../dashboard.css";
import AdminLogin from "./AdminLogin";
import useAdminAuth from "./useAdminAuth";

type ModerationSettings = {
  auto_approve_enabled: boolean;
  manual_review_rating_threshold: number;
};

const DEFAULT_SETTINGS: ModerationSettings = {
  auto_approve_enabled: false,
  manual_review_rating_threshold: 6,
};

export default function Settings() {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";
  const { token, email, password, authStatus, authError, setEmail, setPassword, handleLogin, logout } =
    useAdminAuth(apiBase);

  const [settings, setSettings] = useState<ModerationSettings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "error">("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const apiFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
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
        logout();
        throw new Error("Требуется вход");
      }
      return response;
    },
    [apiBase, logout, token]
  );

  const loadSettings = useCallback(async () => {
    setStatus("loading");
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch("/api/v1/feedback/admin/settings/moderation");
      if (!response.ok) {
        throw new Error("Не удалось загрузить настройки");
      }
      const data = (await response.json()) as ModerationSettings;
      setSettings({
        auto_approve_enabled: data.auto_approve_enabled,
        manual_review_rating_threshold: data.manual_review_rating_threshold,
      });
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Не удалось загрузить настройки");
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!token) return;
    void loadSettings();
  }, [token, loadSettings]);

  const saveSettings = useCallback(async () => {
    setStatus("saving");
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch("/api/v1/feedback/admin/settings/moderation", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        throw new Error("Не удалось сохранить настройки");
      }
      const data = (await response.json()) as ModerationSettings;
      setSettings(data);
      setStatus("idle");
      setSuccess("Настройки сохранены");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Не удалось сохранить настройки");
    }
  }, [apiFetch, settings]);

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
          <h2 className="settings-title">Настройки модерации</h2>
          <div className="dashboard-topbar-actions">
            <button className="dashboard-logout-btn" type="button" onClick={logout}>
              Выйти
            </button>
          </div>
        </header>

        <section className="settings-layout">
          <article className="dashboard-table-card">
            <div className="dashboard-table-header">
              <h4>Модерация</h4>
            </div>

            {status === "loading" && <p className="dashboard-state">Загрузка настроек...</p>}
            {error && <p className="dashboard-error">{error}</p>}
            {success && <p className="settings-success">{success}</p>}

            <div className="settings-form">
              <label className="settings-field settings-toggle">
                <span>Авто-одобрение</span>
                <input
                  type="checkbox"
                  checked={settings.auto_approve_enabled}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      auto_approve_enabled: event.target.checked,
                    }))
                  }
                />
              </label>

              <label className="settings-field">
                <span>Порог рейтинга для ручной проверки</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.manual_review_rating_threshold}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isNaN(next)) return;
                    setSettings((prev) => ({
                      ...prev,
                      manual_review_rating_threshold: Math.min(10, Math.max(1, next)),
                    }));
                  }}
                />
              </label>

              <p className="dashboard-state">
                Отзывы с рейтингом ниже или равным порогу попадут на ручную проверку.
              </p>

              <div className="settings-actions">
                <button
                  type="button"
                  className="dashboard-export-btn"
                  disabled={status === "saving" || status === "loading"}
                  onClick={() => void saveSettings()}
                >
                  {status === "saving" ? "Сохранение..." : "Сохранить"}
                </button>
                <button
                  type="button"
                  className="dashboard-logout-btn"
                  disabled={status === "saving"}
                  onClick={() => void loadSettings()}
                >
                  Обновить
                </button>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
