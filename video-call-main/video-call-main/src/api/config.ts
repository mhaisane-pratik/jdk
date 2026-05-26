const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL =
  rawApiUrl && rawApiUrl.length > 0
    ? rawApiUrl.replace(/\/+$/, "")
    : window.location.origin;

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}
