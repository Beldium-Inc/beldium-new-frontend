import { apiUrl } from "./config";
import { apiErrorFromBody, networkError } from "./errors";
import { clearTokens, readTokens, writeTokens, type TokenPair } from "./tokens";

export type QueryValue = string | number | boolean | null | undefined;

// `exactOptionalPropertyTypes` is on, so each optional field spells out
// `| undefined`: callers routinely forward an optional signal straight through.
export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE" | undefined;
  /**
   * Serialised as a JSON request body, unless it is already a `FormData`, in
   * which case it is sent as-is: compliance document and CV uploads are
   * multipart, and the boundary has to come from the browser.
   */
  body?: unknown;
  query?: Record<string, QueryValue> | undefined;
  /** Send the bearer token. Off for register/verify/token, which are public. */
  auth?: boolean | undefined;
  signal?: AbortSignal | undefined;
};

type RefreshOutcome =
  | { status: "refreshed"; tokens: TokenPair }
  /** The refresh token itself was rejected: the session is over. */
  | { status: "expired" }
  /** The refresh call could not be made; the stored pair is left alone. */
  | { status: "unavailable" };

let refreshInFlight: Promise<RefreshOutcome> | null = null;

/**
 * Exchange the refresh token for a new pair. Concurrent 401s share one call so
 * a page that fires several requests at once doesn't burn several refreshes;
 * the backend rotates and blacklists on every use, so only the first would win.
 */
function refreshAccessToken(): Promise<RefreshOutcome> {
  const current = readTokens();
  if (!current) return Promise.resolve({ status: "expired" });

  const inFlight = (refreshInFlight ??= (async (): Promise<RefreshOutcome> => {
    let response: Response;
    try {
      response = await fetch(apiUrl("/auth/token/refresh/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh: current.refresh }),
      });
    } catch {
      return { status: "unavailable" };
    }

    if (!response.ok) {
      clearTokens();
      return { status: "expired" };
    }

    const payload = (await readBody(response)) as { access?: unknown; refresh?: unknown } | null;
    if (!payload || typeof payload.access !== "string") {
      clearTokens();
      return { status: "expired" };
    }

    // ROTATE_REFRESH_TOKENS is on, so a fresh refresh token normally comes back
    // with it; fall back to the existing one if a deployment turns that off.
    const tokens: TokenPair = {
      access: payload.access,
      refresh: typeof payload.refresh === "string" ? payload.refresh : current.refresh,
    };
    writeTokens(tokens);
    return { status: "refreshed", tokens };
  })().finally(() => {
    refreshInFlight = null;
  }));

  return inFlight;
}

async function readBody(response: Response): Promise<unknown> {
  let text: string;
  try {
    text = await response.text();
  } catch (cause) {
    throw networkError(cause);
  }
  if (!text) return null;
  if (!(response.headers.get("content-type") ?? "").includes("json")) {
    // A Django debug page or a proxy error: don't surface raw HTML to the user.
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/**
 * One request against the Beldium API: attaches the bearer token, refreshes it
 * once on a 401 and retries, and turns every failure into an `ApiError`.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true, signal } = options;

  const url = new URL(apiUrl(path));
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  const isMultipart = typeof FormData !== "undefined" && body instanceof FormData;
  const serialised = body === undefined || isMultipart ? undefined : JSON.stringify(body);

  const send = async (accessToken: string | null): Promise<Response> => {
    const headers: Record<string, string> = { Accept: "application/json" };
    // Setting Content-Type by hand on a multipart body would omit the boundary.
    if (serialised !== undefined) headers["Content-Type"] = "application/json";
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const init: RequestInit = { method, headers };
    if (isMultipart) init.body = body as FormData;
    else if (serialised !== undefined) init.body = serialised;
    if (signal) init.signal = signal;

    try {
      return await fetch(url.toString(), init);
    } catch (cause) {
      if (signal?.aborted) throw cause;
      throw networkError(cause);
    }
  };

  let response = await send(auth ? (readTokens()?.access ?? null) : null);

  if (response.status === 401 && auth && readTokens()) {
    const outcome = await refreshAccessToken();
    if (outcome.status === "refreshed") response = await send(outcome.tokens.access);
  }

  if (response.status === 204 || response.status === 205) return undefined as T;

  const payload = await readBody(response);
  if (!response.ok) throw apiErrorFromBody(payload, response.status);
  return payload as T;
}
