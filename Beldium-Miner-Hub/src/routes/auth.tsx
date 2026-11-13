import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/errors";
import { readPendingJoinCode } from "@/lib/join-code";
import { fetchMinerSetup } from "@/lib/setup";

const title = "Sign in - Beldium Miner Hub";
const description =
  "Universal sign-in for miners, mining organisation admins and organisation staff.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, completeMfa } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Set when the password was right and the account asks for an authenticator code.
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  /** Where a freshly signed-in person goes. */
  async function goOn() {
    // Anyone who stopped part-way through signup goes back to the
    // application instead of landing on an empty workspace.
    const setup = await fetchMinerSetup().catch(() => null);
    if (setup?.stage === "no_organisation" && readPendingJoinCode()) {
      navigate({ to: "/join" });
      return;
    }
    if (setup && (setup.stage === "no_organisation" || setup.stage === "unsubmitted")) {
      navigate({
        to: "/application",
        search: { organisationName: setup.organisation?.name },
      });
      return;
    }
    navigate({ to: "/portal" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.includes("@") || password.length < 1) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await signIn({ email: email.trim(), password });
      if (result.kind === "mfa_required") {
        setMfaToken(result.mfaToken);
        setPassword("");
        return;
      }
      await goOn();
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "email_not_verified") {
        navigate({ to: "/verify", search: { email: email.trim() } });
        return;
      }
      setError(cause instanceof ApiError ? cause.message : "Sign in failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaToken) return;
    setError("");
    const value = code.trim();
    if (!useBackupCode && value.replace(/\D/g, "").length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    if (useBackupCode && value.replace(/[^a-z0-9]/gi, "").length !== 8) {
      setError("Enter one of your backup codes, like abcd-2345.");
      return;
    }
    setSubmitting(true);
    try {
      await completeMfa({ mfaToken, code: value });
      await goOn();
    } catch (cause) {
      if (
        cause instanceof ApiError &&
        (cause.code === "mfa_challenge_expired" || cause.code === "mfa_challenge_invalid")
      ) {
        // The five-minute window ran out: back to the password.
        setMfaToken(null);
        setCode("");
      }
      setError(cause instanceof ApiError ? cause.message : "That code could not be checked.");
    } finally {
      setSubmitting(false);
    }
  }

  if (mfaToken) {
    return (
      <AuthLayout
        title="Two-step sign-in"
        subtitle={
          useBackupCode
            ? "Enter one of the backup codes you saved when you set up your authenticator app. Each works once."
            : "Open your authenticator app and enter the 6-digit code it shows for Beldium."
        }
        footer={
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => {
              setMfaToken(null);
              setCode("");
              setError("");
            }}
          >
            Use a different account
          </button>
        }
      >
        <form onSubmit={submitCode} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="mfa-code">
              {useBackupCode ? "Backup code" : "Authentication code"}
            </Label>
            <Input
              id="mfa-code"
              autoFocus
              value={code}
              autoComplete="one-time-code"
              inputMode={useBackupCode ? "text" : "numeric"}
              maxLength={useBackupCode ? 9 : 6}
              className="font-mono tracking-[0.35em]"
              placeholder={useBackupCode ? "abcd-2345" : "000000"}
              onChange={(e) =>
                setCode(useBackupCode ? e.target.value : e.target.value.replace(/\D/g, ""))
              }
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Checking…" : "Verify and sign in"}
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => {
              setUseBackupCode((v) => !v);
              setCode("");
              setError("");
            }}
          >
            {useBackupCode
              ? "Use my authenticator app instead"
              : "Lost your phone? Use a backup code"}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Sign in to Beldium Miner Hub"
      subtitle="One sign-in for every miner role. Your workspace adapts to your verification status."
      footer={
        <>
          New to Beldium?{" "}
          <Link
            to="/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create a miner account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourmine.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
