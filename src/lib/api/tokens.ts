// The client side of the session.
//
// The access token lives in memory only, so script injected into the page can
// never read it back out of storage. The refresh token is not held here at
// all: the API keeps it in an HttpOnly cookie (backend task G9) that script
// cannot read either.
//
// What is stored is a plain flag that says "this browser signed in". It holds
// no secret. A reloaded tab sees the flag and asks the API for a new access
// token with the cookie; other tabs use the flag to follow sign in and sign
// out.
//
// This module is imported during SSR, so every storage access is guarded and
// resolves to "signed out" on the server.

export type TokenPair = {
  access: string;
  /** Always empty now: the refresh token lives in the HttpOnly cookie. Kept for older callers. */
  refresh: string;
};

const SIGNED_IN_KEY = "beldium.auth.signed-in.v2";
// The old store held both tokens in localStorage. Removed on first load.
const LEGACY_KEY = "beldium.auth.v1";

let access: string | null = null;
let signedInFlag: boolean | null = null;
const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readFlag(): boolean {
  if (!isBrowser()) return false;
  if (signedInFlag === null) {
    try {
      window.localStorage.removeItem(LEGACY_KEY);
      signedInFlag = window.localStorage.getItem(SIGNED_IN_KEY) === "1";
    } catch {
      signedInFlag = false;
    }
  }
  return signedInFlag;
}

function writeFlag(value: boolean): void {
  signedInFlag = value;
  if (!isBrowser()) return;
  try {
    if (value) window.localStorage.setItem(SIGNED_IN_KEY, "1");
    else window.localStorage.removeItem(SIGNED_IN_KEY);
  } catch {
    // Private mode: the flag stays in memory for this tab only.
  }
}

function notify(): void {
  for (const listener of listeners) listener();
}

/** The access token in memory, if this tab has one. */
export function readTokens(): TokenPair | null {
  if (!isBrowser() || !access) return null;
  return { access, refresh: "" };
}

/**
 * True when this browser signed in, even if this tab has not yet swapped the
 * cookie for an access token (a reload). Requests made in that state go out
 * without a bearer, get a 401, and the client restores the session first.
 */
export function hasSession(): boolean {
  return Boolean(access) || readFlag();
}

/** Keep the access token from a token answer. Any refresh token in the body is ignored. */
export function writeTokens(tokens: { access: string; refresh?: string | undefined }): void {
  access = tokens.access;
  writeFlag(true);
  notify();
}

export function clearTokens(): void {
  access = null;
  writeFlag(false);
  notify();
}

/** Notified whenever the session changes here or in another tab. */
export function subscribeTokens(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let crossTabBound = false;

/** Follow sign in and sign out that happened in another tab. */
export function bindCrossTabSync(): void {
  if (crossTabBound || !isBrowser()) return;
  crossTabBound = true;
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== SIGNED_IN_KEY) return;
    signedInFlag = null;
    if (!readFlag()) access = null;
    notify();
  });
}

/**
 * When the access token stops being accepted, in epoch ms, read from its `exp`
 * claim. Null if the token can't be decoded; callers treat that as "unknown"
 * and fall back to the 401 path. No signature check: this only schedules work.
 */
export function accessExpiresAt(token: string): number | null {
  const segment = token.split(".")[1];
  if (!segment) return null;
  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const claims = JSON.parse(atob(padded)) as { exp?: unknown };
    return typeof claims.exp === "number" ? claims.exp * 1000 : null;
  } catch {
    return null;
  }
}

const expiryListeners = new Set<() => void>();

/**
 * The server refused to extend the session (idle too long, or the cookie was
 * revoked). Clears the session and tells the UI, which signs the person out
 * rather than leaving a half-dead session.
 */
export function expireSession(): void {
  clearTokens();
  for (const listener of expiryListeners) listener();
}

export function subscribeSessionExpired(listener: () => void): () => void {
  expiryListeners.add(listener);
  return () => {
    expiryListeners.delete(listener);
  };
}
