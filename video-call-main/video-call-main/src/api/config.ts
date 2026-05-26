const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

function normalizeApiUrl(url?: string): string {
  if (!url) return window.location.origin;

  const trimmed = url.replace(/\/+$/, "");
  return trimmed.replace(/\/api\/v1$/i, "");
}

export const API_URL = normalizeApiUrl(rawApiUrl);

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}
