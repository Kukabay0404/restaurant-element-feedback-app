import { useCallback, useState, type FormEvent } from "react";

const TOKEN_KEY = "admin_token";

export type AuthState = {
  token: string;
  email: string;
  password: string;
  authStatus: "idle" | "loading" | "error";
  authError: string;
};

export default function useAdminAuth(apiBase: string) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authStatus, setAuthStatus] = useState<"idle" | "loading" | "error">("idle");
  const [authError, setAuthError] = useState("");

  const saveToken = useCallback((value: string) => {
    setToken(value);
    if (value) {
      localStorage.setItem(TOKEN_KEY, value);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const logout = useCallback(() => {
    saveToken("");
  }, [saveToken]);

  const handleLogin = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
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
    },
    [apiBase, email, password, saveToken]
  );

  return {
    token,
    email,
    password,
    authStatus,
    authError,
    setEmail,
    setPassword,
    handleLogin,
    logout,
    saveToken,
  };
}
