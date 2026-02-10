import type { FormEvent } from "react";

type AdminLoginProps = {
  email: string;
  password: string;
  authStatus: "idle" | "loading" | "error";
  authError: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function AdminLogin({
  email,
  password,
  authStatus,
  authError,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AdminLoginProps) {
  return (
    <div className="dashboard-login-page">
      <form className="dashboard-login-card" onSubmit={onSubmit}>
        <div className="dashboard-login-title">Вход администратора</div>
        <label className="dashboard-login-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="admin@example.com"
          required
        />
        <label className="dashboard-login-label" htmlFor="password">
          Пароль
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
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
