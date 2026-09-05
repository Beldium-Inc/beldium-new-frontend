import * as React from "react";

import { type VerticalSlug, homeFor, roleIn } from "./verticals";

// One sign-in across all seven dashboards. The session records which compliance
// vertical you signed in as and your role within it; each vertical's own store
// is seeded from this rather than hydrating a role of its own.
//
// Previously each dashboard was its own origin (a different localhost port), so
// their storage keys never met. Under one server they share an origin, hence a
// single namespaced key here instead of the seven ad-hoc ones.
const SESSION_KEY = "beldium.session.v1";

export type Session = {
  vertical: VerticalSlug;
  role: string;
};

type Ctx = {
  session: Session | null;
  /** False until the stored session has been read on the client. */
  hydrated: boolean;
  signIn: (vertical: VerticalSlug, role: string) => void;
  signOut: () => void;
};

const SessionContext = React.createContext<Ctx | null>(null);

function readStoredSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (typeof parsed.vertical !== "string" || typeof parsed.role !== "string") return null;
    // Guard against a stored role that no longer exists in the registry.
    if (!roleIn(parsed.vertical as VerticalSlug, parsed.role)) return null;
    return { vertical: parsed.vertical as VerticalSlug, role: parsed.role };
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setSession(readStoredSession());
    setHydrated(true);
  }, []);

  const signIn = React.useCallback((vertical: VerticalSlug, role: string) => {
    const next: Session = { vertical, role };
    setSession(next);
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode); session stays in memory only.
    }
  }, []);

  const signOut = React.useCallback(() => {
    setSession(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // Nothing to clean up.
    }
  }, []);

  const value = React.useMemo<Ctx>(
    () => ({ session, hydrated, signIn, signOut }),
    [session, hydrated, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Ctx {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}

/**
 * Role for the given vertical if the current session belongs to it, else null.
 * Vertical layout routes use this to gate access and seed their own store.
 */
export function useVerticalRole(vertical: VerticalSlug): {
  role: string | null;
  hydrated: boolean;
} {
  const { session, hydrated } = useSession();
  return {
    role: session && session.vertical === vertical ? session.role : null,
    hydrated,
  };
}

export { homeFor };
