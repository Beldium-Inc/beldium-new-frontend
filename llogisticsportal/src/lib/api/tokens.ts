// JWT storage. The API is stateless, so the access/refresh pair is the whole
// client-side session: it lives in localStorage under one namespaced key,
// mirrored in memory so request building never has to touch storage.
//
// This module is imported during SSR, so every storage access is guarded and
// resolves to "signed out" on the server.

export type TokenPair = {
  access: string;
  refresh: string;
};

const STORAGE_KEY = "beldium.auth.v1";

let cache: TokenPair | null = null;
let cacheLoaded = false;
const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parse(raw: string | null): TokenPair | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<TokenPair>;
    if (typeof parsed.access !== "string" || typeof parsed.refresh !== "string") return null;
    if (!parsed.access || !parsed.refresh) return null;
    return { access: parsed.access, refresh: parsed.refresh };
  } catch {
    return null;
  }
}

function notify(): void {
  for (const listener of listeners) listener();
}

export function readTokens(): TokenPair | null {
  if (!isBrowser()) return null;
  if (!cacheLoaded) {
    try {
      cache = parse(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      cache = null;
    }
    cacheLoaded = true;
  }
  return cache;
}

export function writeTokens(tokens: TokenPair): void {
  cache = tokens;
  cacheLoaded = true;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    } catch {
      // Private mode: the pair stays in memory for this tab only.
    }
  }
  notify();
}

export function clearTokens(): void {
  cache = null;
  cacheLoaded = true;
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clean up.
    }
  }
  notify();
}

/** Notified whenever the pair changes here or in another tab. */
export function subscribeTokens(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let crossTabBound = false;

/** Keep this tab in step with sign-in/sign-out that happened in another one. */
export function bindCrossTabSync(): void {
  if (crossTabBound || !isBrowser()) return;
  crossTabBound = true;
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    cacheLoaded = false;
    readTokens();
    notify();
  });
}
