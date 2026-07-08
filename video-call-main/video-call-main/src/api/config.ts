const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
const isLocalHost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

function normalizeApiUrl(url?: string): string {
  if (!url) {
    const fallbackUrl = isLocalHost ? "http://localhost:4000" : window.location.origin;

    console.warn(
      `VITE_API_URL is not set. Falling back to ${fallbackUrl}. Set VITE_API_URL explicitly for production deployments.`
    );

    return fallbackUrl;
  }

  const trimmed = url.replace(/\/+$/, "");
  return trimmed.replace(/\/api\/v1$/i, "");
}

export const API_URL = normalizeApiUrl(rawApiUrl);

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}
