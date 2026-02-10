import { useCallback, useEffect, useMemo, useState } from "react";

type FeedbackType = "review" | "suggestion";

export type FeedbackItem = {
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

export type Stats = {
  total: number;
  avgRating: number | null;
  newThisWeek: number;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU");
};

export const escapeCsv = (value: string | number | boolean | null | undefined) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const exportCsv = (rows: FeedbackItem[]) => {
  const header = ["id", "name", "type", "rating", "date", "contact", "text", "approved"];
  const lines = rows.map((item) =>
    [item.id, item.name, item.type, item.rating, item.created_at, item.contact, item.text, item.is_approved]
      .map(escapeCsv)
      .join(",")
  );
  const csv = `${header.join(",")}\n${lines.join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `feedback-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export default function useAdminFeedback({
  apiBase,
  token,
  onUnauthorized,
}: {
  apiBase: string;
  token: string;
  onUnauthorized: () => void;
}) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

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
        onUnauthorized();
        throw new Error("Требуется вход");
      }
      return response;
    },
    [apiBase, onUnauthorized, token]
  );

  const loadFeedback = useCallback(async () => {
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
  }, [apiFetch]);

  const loadFeedbackSilent = useCallback(async () => {
    try {
      const response = await apiFetch("/api/v1/feedback/admin");
      if (!response.ok) return;
      const data = (await response.json()) as FeedbackItem[];
      setItems(data);
      setError("");
      setStatus("idle");
    } catch {
      // Ignore background refresh errors to avoid breaking the current view.
    }
  }, [apiFetch]);

  const approveFeedback = useCallback(
    async (id: number) => {
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
    },
    [apiFetch]
  );

  const deleteFeedback = useCallback(
    async (id: number) => {
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
    },
    [apiFetch]
  );

  useEffect(() => {
    if (!token) return;
    loadFeedback();
  }, [token, loadFeedback]);

  useEffect(() => {
    if (!token) return;
    const intervalId = window.setInterval(() => {
      void loadFeedbackSilent();
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, [token, loadFeedbackSilent]);

  useEffect(() => {
    if (!token) return;
    const handleVisibility = () => {
      if (!document.hidden) {
        void loadFeedbackSilent();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [token, loadFeedbackSilent]);

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

  return {
    items,
    status,
    error,
    actionError,
    setActionError,
    loadFeedback,
    approveFeedback,
    deleteFeedback,
    stats,
    formatDate,
  };
}
