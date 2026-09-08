// Where the Django API lives. `VITE_API_URL` is the origin only; the version
// prefix is owned here so callers pass paths like "/auth/me/".
const DEFAULT_ORIGIN = "http://localhost:8000";

const configured = import.meta.env.VITE_API_URL;

export const API_ORIGIN = (
  typeof configured === "string" && configured.trim() ? configured.trim() : DEFAULT_ORIGIN
).replace(/\/+$/, "");

export const API_PREFIX = "/api/v1";

/** Absolute URL for an API path. Accepts "/auth/me/" or "auth/me/". */
export function apiUrl(path: string): string {
  return `${API_ORIGIN}${API_PREFIX}/${path.replace(/^\/+/, "")}`;
}
