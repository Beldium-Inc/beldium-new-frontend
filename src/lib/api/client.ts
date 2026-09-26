import { apiUrl } from "./config";
import { apiErrorFromBody, networkError } from "./errors";
import { accessExpiresAt, expireSession, readTokens, writeTokens, type TokenPair } from "./tokens";

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
 * Exchange the refresh token for a new access token. Concurrent callers share
 * one call so a page that fires several requests at once doesn't burn several
 * refreshes.
 *
 * The backend only refreshes for a caller still holding a live access token
 * (the refresh view is `IsAuthenticated`), so the access token rides along as
 * the bearer. Once it has lapsed the session is over: that is the server-side
 * half of the inactivity timeout, and `SessionTimeout` keeps active users on
 * the right side of it by refreshing before expiry.
 */
export function refreshAccessToken(): Promise<RefreshOutcome> {
  const current = readTokens();
  if (!current) return Promise.resolve({ status: "expired" });

  const inFlight = (refreshInFlight ??= (async (): Promise<RefreshOutcome> => {
    const expiresAt = accessExpiresAt(current.access);
    if (expiresAt !== null && expiresAt <= Date.now()) {
      // The server would refuse it; don't spend a throttled request finding out.
      expireSession();
      return { status: "expired" };
    }

    let response: Response;
    try {
      response = await fetch(apiUrl("/auth/token/refresh/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${current.access}`,
        },
        body: JSON.stringify({ refresh: current.refresh }),
      });
    } catch {
      return { status: "unavailable" };
    }

    // Throttled or a server fault says nothing about the session; keep the
    // pair and let the next attempt decide.
    if (response.status === 429 || response.status >= 500) return { status: "unavailable" };

    if (!response.ok) {
      expireSession();
      return { status: "expired" };
    }

    const payload = (await readBody(response)) as { access?: unknown; refresh?: unknown } | null;
    if (!payload || typeof payload.access !== "string") {
      expireSession();
      return { status: "expired" };
    }

    // The refresh view returns only an access token today; keep the existing
    // refresh token unless a deployment starts rotating it again.
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

/**
 * Fetch a protected file (a compliance document, a CV) as a Blob. The download
 * endpoints sit behind the bearer token, so a plain link or <iframe src> would
 * arrive unauthenticated; this sends the token, retries once after a refresh,
 * and hands back something the caller can turn into an object URL.
 */
export async function apiFetchBlob(url: string, signal?: AbortSignal): Promise<Blob> {
  const send = async (accessToken: string | null): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    const init: RequestInit = { headers };
    if (signal) init.signal = signal;
    try {
      return await fetch(url, init);
    } catch (cause) {
      if (signal?.aborted) throw cause;
      throw networkError(cause);
    }
  };

  let response = await send(readTokens()?.access ?? null);
  if (response.status === 401 && readTokens()) {
    const outcome = await refreshAccessToken();
    if (outcome.status === "refreshed") response = await send(outcome.tokens.access);
  }
  if (!response.ok) throw apiErrorFromBody(await readBody(response), response.status);
  return response.blob();
}
