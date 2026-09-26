import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { refreshAccessToken } from "@/lib/api/client";
import { useHasTokens } from "@/lib/api/queries";
import { accessExpiresAt, readTokens, subscribeSessionExpired } from "@/lib/api/tokens";
import { useAuth } from "@/lib/auth";
import { useSession } from "@/lib/session";

// Signs a person out after a stretch of inactivity.
//
// The backend enforces the hard edge: /auth/token/refresh/ only answers a
// caller whose access token (SIMPLE_JWT ACCESS_TOKEN_LIFETIME, 30 min) is still
// live, so a client that stops refreshing is locked out once it lapses. This
// component is the other half. While the person is active it refreshes the
// access token shortly before it expires, and once they have been idle for
// IDLE_MS it warns them, then ends the session cleanly: refresh token
// blacklisted, dashboard session cleared, back to /signin.
//
// Activity is shared across tabs through localStorage, so working in one tab
// keeps the others alive and they all time out together.

const DEFAULT_IDLE_MINUTES = 15;
// Must sit below the server's access lifetime (30 min) minus REFRESH_MARGIN_MS,
// or an idle-but-not-yet-warned tab could lose its token before we sign it out.
const MAX_IDLE_MINUTES = 25;

function idleMinutes(): number {
  const configured = Number(import.meta.env.VITE_SESSION_IDLE_MINUTES);
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_IDLE_MINUTES;
  return Math.min(configured, MAX_IDLE_MINUTES);
}

const IDLE_MS = idleMinutes() * 60_000;
/** How long the "are you still there?" dialog shows before sign-out. */
const WARNING_MS = Math.min(60_000, IDLE_MS / 2);
/** Refresh the access token once it is this close to expiring. */
const REFRESH_MARGIN_MS = 2 * 60_000;
/** Back-off between refresh attempts that came back "unavailable". */
const REFRESH_RETRY_MS = 15_000;
/** mousemove fires constantly; only persist activity this often. */
const ACTIVITY_WRITE_MS = 5_000;
const TICK_MS = 1_000;

const ACTIVITY_KEY = "beldium.activity.v1";
const ACTIVITY_EVENTS = [
  "pointerdown",
  "pointermove",
  "keydown",
  "wheel",
  "scroll",
  "touchstart",
] as const;

let memoryActivity: number | null = null;

function readActivity(): number | null {
  let stored: number | null = null;
  try {
    const raw = window.localStorage.getItem(ACTIVITY_KEY);
    const parsed = raw ? Number(raw) : NaN;
    stored = Number.isFinite(parsed) ? parsed : null;
  } catch {
    // Private mode: fall back to this tab's own record.
  }
  if (stored === null) return memoryActivity;
  if (memoryActivity === null) return stored;
  return Math.max(stored, memoryActivity);
}

function writeActivity(at: number): void {
  memoryActivity = at;
  try {
    window.localStorage.setItem(ACTIVITY_KEY, String(at));
  } catch {
    // Kept in memory only.
  }
}

function clearActivity(): void {
  memoryActivity = null;
  try {
    window.localStorage.removeItem(ACTIVITY_KEY);
  } catch {
    // Nothing to clean up.
  }
}

type EndReason = "idle" | "expired";

export function SessionTimeout() {
  const hasTokens = useHasTokens();
  const auth = useAuth();
  const session = useSession();
  const navigate = useNavigate();

  /** Milliseconds left before sign-out while the warning is up, else null. */
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const warningRef = React.useRef(false);
  warningRef.current = remaining !== null;

  // The auth/session values change identity on every render; the timers below
  // read the latest through a ref instead of re-binding every second.
  const latest = React.useRef({ auth, session, navigate });
  latest.current = { auth, session, navigate };

  const endingRef = React.useRef(false);
  const end = React.useCallback(async (reason: EndReason) => {
    if (endingRef.current) return;
    endingRef.current = true;
    setRemaining(null);
    clearActivity();
    const { auth, session, navigate } = latest.current;
    try {
      await auth.signOut();
    } finally {
      session.signOut();
      endingRef.current = false;
    }
    toast.info(
      reason === "idle"
        ? "You were signed out after a period of inactivity."
        : "Your session has expired. Please sign in again.",
    );
    void navigate({ to: "/signin" });
  }, []);

  // The API client reports a refused refresh (401 path) here.
  React.useEffect(() => subscribeSessionExpired(() => void end("expired")), [end]);

  React.useEffect(() => {
    if (!hasTokens) {
      setRemaining(null);
      return;
    }

    // A tab opened with tokens but no activity record (fresh sign-in, or the
    // record was cleared at the last sign-out) starts its clock now. A stale
    // record from days ago is kept, so reopening an abandoned tab signs out.
    if (readActivity() === null) writeActivity(Date.now());

    let lastWrite = 0;
    const onActivity = () => {
      // Once the warning is up, only the explicit "Stay signed in" counts;
      // an accidental nudge of the mouse shouldn't silently extend the session.
      if (warningRef.current) return;
      const now = Date.now();
      memoryActivity = now;
      if (now - lastWrite >= ACTIVITY_WRITE_MS) {
        lastWrite = now;
        writeActivity(now);
      }
    };

    let lastRefreshAttempt = 0;
    const tick = () => {
      if (endingRef.current) return;
      const now = Date.now();
      const idle = now - (readActivity() ?? now);

      if (idle >= IDLE_MS) {
        void end("idle");
        return;
      }
      setRemaining(idle >= IDLE_MS - WARNING_MS ? IDLE_MS - idle : null);

      // Keep an active session alive: the server won't refresh a lapsed token.
      const tokens = readTokens();
      const expiresAt = tokens ? accessExpiresAt(tokens.access) : null;
      if (
        expiresAt !== null &&
        expiresAt - now <= REFRESH_MARGIN_MS &&
        idle < IDLE_MS - WARNING_MS &&
        now - lastRefreshAttempt >= REFRESH_RETRY_MS
      ) {
        lastRefreshAttempt = now;
        void refreshAccessToken();
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };

    for (const name of ACTIVITY_EVENTS) {
      window.addEventListener(name, onActivity, { passive: true, capture: true });
    }
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(tick, TICK_MS);
    tick();

    return () => {
      for (const name of ACTIVITY_EVENTS) {
        window.removeEventListener(name, onActivity, { capture: true });
      }
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [hasTokens, end]);

  const staySignedIn = () => {
    writeActivity(Date.now());
    setRemaining(null);
    const tokens = readTokens();
    const expiresAt = tokens ? accessExpiresAt(tokens.access) : null;
    if (expiresAt !== null && expiresAt - Date.now() <= REFRESH_MARGIN_MS) {
      void refreshAccessToken();
    }
  };

  const seconds = remaining === null ? 0 : Math.max(0, Math.ceil(remaining / 1000));

  return (
    <AlertDialog open={remaining !== null}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you still there?</AlertDialogTitle>
          <AlertDialogDescription>
            For your security you'll be signed out in{" "}
            <span className="font-semibold tabular-nums text-foreground">{seconds}s</span> because
            of inactivity.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => void end("idle")}>Sign out now</AlertDialogCancel>
          <AlertDialogAction onClick={staySignedIn}>Stay signed in</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
