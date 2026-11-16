// Where the Django API lives. `VITE_API_URL` is the origin only; the version
// prefix is owned here so callers pass paths like "/auth/me/".
//
// The localhost default is for `vite dev` only. A production build with no
// `VITE_API_URL` must fail, so the app never ships pointing at localhost.
// vite.config.ts stops CI builds that are missing the value.
const DEV_ORIGIN = "http://localhost:8000";

const configured = import.meta.env.VITE_API_URL;
const hasConfigured = typeof configured === "string" && configured.trim() !== "";

if (!hasConfigured && !import.meta.env.DEV) {
  throw new Error("VITE_API_URL is not set. Set it to the API origin before building.");
}

export const API_ORIGIN = (hasConfigured ? configured.trim() : DEV_ORIGIN).replace(/\/+$/, "");

export const API_PREFIX = "/api/v1";

/** Absolute URL for an API path. Accepts "/auth/me/" or "auth/me/". */
export function apiUrl(path: string): string {
  return `${API_ORIGIN}${API_PREFIX}/${path.replace(/^\/+/, "")}`;
}
