import { apiUrl } from "./config";
import { apiErrorFromBody, networkError } from "./errors";
import {
  accessExpiresAt,
  expireSession,
  hasSession,
  readTokens,
  writeTokens,
  type TokenPair,
} from "./tokens";

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
  /** The cookie was refused: the session is over. */
  | { status: "expired" }
  /** The refresh call could not be made; the session is left alone. */
  | { status: "unavailable" };

let refreshInFlight: Promise<RefreshOutcome> | null = null;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callRefresh(bearer: string | null): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
  // The refresh token rides in the HttpOnly cookie, so the body is empty and
  // the browser must be told to send cookies to the API.
  return fetch(apiUrl("/auth/token/refresh/"), {
    method: "POST",
    headers,
    body: "{}",
    credentials: "include",
  });
}

/**
 * Swap the refresh cookie for a new access token. Concurrent callers share one
 * call. The API rotates the cookie on every refresh.
 *
 * With a live access token in memory it rides along as the bearer. Without
 * one (a reloaded tab) the API still accepts a cookie issued within the access
 * token lifetime, so an idle session still ends after the same time as before.
 */
export function refreshAccessToken(): Promise<RefreshOutcome> {
  if (!hasSession()) return Promise.resolve({ status: "expired" });

  const inFlight = (refreshInFlight ??= (async (): Promise<RefreshOutcome> => {
    const current = readTokens();
    const live =
      current && (accessExpiresAt(current.access) ?? Number.POSITIVE_INFINITY) > Date.now()
        ? current.access
        : null;

    let response: Response;
    try {
      response = await callRefresh(live);
      if (response.status === 401) {
        // Another tab may have rotated the cookie a moment ago. The browser
        // now holds the new one, so one more try settles it.
        await wait(400);
        response = await callRefresh(live);
      }
    } catch {
      return { status: "unavailable" };
    }

    // Throttled or a server fault says nothing about the session.
    if (response.status === 429 || response.status >= 500) return { status: "unavailable" };

    if (!response.ok) {
      expireSession();
      return { status: "expired" };
    }

    const payload = (await readBody(response)) as { access?: unknown } | null;
    if (!payload || typeof payload.access !== "string") {
      expireSession();
      return { status: "expired" };
    }
    const tokens: TokenPair = { access: payload.access, refresh: "" };
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
    // Calls under /auth/ set or read the HttpOnly refresh cookie.
    if (path.replace(/^\/+/, "").startsWith("auth/")) init.credentials = "include";
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

  if (response.status === 401 && auth && hasSession()) {
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
  if (response.status === 401 && hasSession()) {
    const outcome = await refreshAccessToken();
    if (outcome.status === "refreshed") response = await send(outcome.tokens.access);
  }
  if (!response.ok) throw apiErrorFromBody(await readBody(response), response.status);
  return response.blob();
}
