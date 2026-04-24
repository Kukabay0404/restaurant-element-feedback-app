const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const HTML_RESPONSE_MESSAGE = "API вернул HTML вместо JSON. Проверьте подключение frontend к backend.";

type ErrorPayload = {
  detail?: string;
};

const normalizeBase = (value?: string) => {
  if (!value) return "";
  return value.replace(/\/+$/, "");
};

const looksLikeHtml = (value: string) => value.trimStart().startsWith("<");

export const getApiBase = () => {
  const envBase = normalizeBase(import.meta.env.VITE_API_BASE_URL);
  if (envBase) return envBase;

  if (typeof window !== "undefined") {
    const { hostname, port, protocol } = window.location;
    if (LOCAL_HOSTS.has(hostname) && !["", "80", "8001"].includes(port)) {
      return `${protocol}//${hostname}:8001`;
    }
  }

  return "";
};

export const readJsonResponse = async <T>(response: Response, fallbackMessage: string): Promise<T> => {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    throw new Error(looksLikeHtml(text) ? HTML_RESPONSE_MESSAGE : fallbackMessage);
  }
  return (await response.json()) as T;
};

export const readErrorMessage = async (response: Response, fallbackMessage: string) => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as ErrorPayload | null;
    if (payload && typeof payload.detail === "string" && payload.detail.trim().length > 0) {
      return payload.detail;
    }
  }

  const text = await response.text().catch(() => "");
  if (looksLikeHtml(text)) {
    return HTML_RESPONSE_MESSAGE;
  }

  return fallbackMessage;
};
