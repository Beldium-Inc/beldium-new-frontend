import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Mountain } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// The Miner Portal is a standalone product, not another card in the shared
// compliance sector picker (see COMPLIANCE_VERTICALS in lib/verticals.ts).
// This route is its own entry point: its own URL, its own branding, its own
// sign-in/sign-up, independent of /signin and /onboarding/*. It still
// authenticates against the same accounts API and hands off to the same
// `useSession` mechanism as the rest of the platform, since the authenticated
// /miner/* app already depends on that; only the surrounding chrome and entry
// flow are separate.

export const Route = createFileRoute("/miner-portal")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Beldium Miner Portal" },
      {
        name: "description",
        content:
          "Sign in or register for the Beldium Miner Portal: your organisation, sites, production and compliance in one place.",
      },
    ],
  }),
  component: MinerPortalEntry,
});

type Mode = "signin" | "signup" | "verify";

function MinerPortalEntry() {
  const { session, hydrated } = useSession();
  const { signIn: authenticate, signUp, confirmEmail, resendCode } = useAuth();
  const { signIn: startSession } = useSession();
  const navigate = useNavigate();

  const [mode, setMode] = React.useState<Mode>("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (hydrated && session?.vertical === "mining" && session.role === "miner") {
      navigate({ to: "/miner/dashboard" });
    }
  }, [hydrated, session, navigate]);

  // Hands off into the Miner Hub — a richer, single miner-facing workspace
  // (marketplace, supply chain, finance) — rather than the narrower `mining`
  // vertical scoped to the miner role. Still the same session/auth.
  const enterMinerWorkspace = () => {
    startSession("mining", "miner");
    navigate({ to: "/miner/dashboard" });
  };

  const submitSignIn = async () => {
    const address = email.trim();
    if (!address.includes("@") || password.length === 0) {
      toast.error("Enter your email address and password.");
      return;
    }
    setSubmitting(true);
    try {
      await authenticate({ email: address, password });
      enterMinerWorkspace();
    } catch (error) {
      if (error instanceof ApiError && error.code === "email_not_verified") {
        toast.error("Verify your email address to finish setting up this account.");
        setMode("verify");
        return;
      }
      toast.error(error instanceof ApiError ? error.message : "Sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitSignUp = async () => {
    const address = email.trim();
    if (!address.includes("@") || password.length < 8) {
      toast.error("Enter a valid email and a password of at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    if (!agreed) {
      toast.error("You need to accept the terms to continue.");
      return;
    }
    setSubmitting(true);
    try {
      await signUp({
        email: address,
        password,
        confirm_password: confirmPassword,
        agreed_terms: agreed,
        onboarding_role: "miner",
      });
      toast.success("Account created. Check your email for a verification code.");
      setMode("verify");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not create the account.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitVerify = async () => {
    const address = email.trim();
    if (code.trim().length === 0) {
      toast.error("Enter the six-digit code from your email.");
      return;
    }
    setSubmitting(true);
    try {
      await confirmEmail({ email: address, code: code.trim() });
      enterMinerWorkspace();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "That code didn't work. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-[1200px] gap-10 px-6 py-10 lg:grid-cols-[0.9fr_1fr] lg:items-center lg:py-16">
        <div className="space-y-8">
          <Link to="/miner-portal" className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Mountain className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-base font-semibold">Beldium Miner Portal</p>
              <p className="text-xs text-accent/80">A standalone workspace for miners</p>
            </div>
          </Link>

          <div className="space-y-4">
            <h1 className="font-display text-4xl leading-tight font-semibold sm:text-5xl">
              Your organisation, sites and compliance, in one place
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-primary-foreground/75">
              Register your mining organisation, submit your application, track its review, and
              manage sites, production, inventory, equipment, documents and corrective actions
              once you're verified.
            </p>
          </div>

          <p className="max-w-lg rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-3 text-xs leading-relaxed text-primary-foreground/70">
            The Miner Portal is separate from Beldium's compliance-review platform. If you're a
            compliance partner or regulator, sign in at{" "}
            <Link to="/signin" className="underline">
              the compliance sign-in
            </Link>{" "}
            instead.
          </p>
        </div>

        <div className="rounded-2xl bg-card p-6 text-card-foreground shadow-raised sm:p-8">
          {mode === "signin" && (
            <>
              <h2 className="font-display text-xl font-semibold">Sign in to the Miner Portal</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Welcome back. Sign in to your organisation's workspace.
              </p>
              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Email address</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button className="w-full" size="lg" disabled={submitting} onClick={submitSignIn}>
                  {submitting ? "Signing in…" : "Sign in to Miner Portal"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  New to Beldium?{" "}
                  <button
                    className="font-semibold text-brand underline"
                    onClick={() => setMode("signup")}
                  >
                    Create an account
                  </button>
                </p>
              </div>
            </>
          )}

          {mode === "signup" && (
            <>
              <h2 className="font-display text-xl font-semibold">Register your organisation</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your account, then complete your application from the dashboard.
              </p>
              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Email address</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <label className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
                  I agree to the Beldium terms of service and privacy policy.
                </label>
                <Button className="w-full" size="lg" disabled={submitting} onClick={submitSignUp}>
                  {submitting ? "Creating account…" : "Create account"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    className="font-semibold text-brand underline"
                    onClick={() => setMode("signin")}
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          )}

          {mode === "verify" && (
            <>
              <h2 className="font-display text-xl font-semibold">Verify your email</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a six-digit code to {email || "your email address"}.
              </p>
              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Verification code</Label>
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <Button className="w-full" size="lg" disabled={submitting} onClick={submitVerify}>
                  {submitting ? "Verifying…" : "Verify and continue"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Didn't get a code?{" "}
                  <button
                    className="font-semibold text-brand underline"
                    onClick={() =>
                      resendCode(email.trim())
                        .then(() => toast.success("Code resent."))
                        .catch(() => toast.error("Could not resend the code."))
                    }
                  >
                    Resend
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
