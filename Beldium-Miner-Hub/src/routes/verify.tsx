import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { AuthLayout } from "@/components/auth-layout";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/errors";
import { AuthenticatorSetup } from "@/components/two-step-settings";

const title = "Verify your account - Beldium Miner Hub";
const description =
  "Confirm your email address and set up two-step sign-in before starting your mining organisation application.";

const searchSchema = z.object({
  email: z.string().optional(),
  role: z.enum(["org_admin", "org_staff", "individual"]).optional(),
  organisationName: z.string().optional(),
});

export const Route = createFileRoute("/verify")({
  validateSearch: searchSchema,
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
  component: VerifyPage,
});

function VerifyPage() {
  const { email, role, organisationName } = Route.useSearch();
  const { user, confirmEmail, resendCode, refetchUser } = useAuth();
  const navigate = useNavigate();

  const [emailCode, setEmailCode] = useState("");
  // Two-step sign-in can be set up later from Settings; this records that choice.
  const [setUpLater, setSetUpLater] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const targetEmail = user?.email ?? email;
  const emailVerified = Boolean(user?.email_verified_at);
  const mfaEnabled = Boolean(user?.mfa_enabled);
  const readyToContinue = emailVerified && (mfaEnabled || setUpLater);

  if (!targetEmail) {
    return (
      <AuthLayout title="No account in progress" subtitle="Start by creating your miner account.">
        <Button asChild className="w-full">
          <Link to="/signup">Create account</Link>
        </Button>
      </AuthLayout>
    );
  }

  async function submitEmailCode() {
    if (emailCode.length !== 6) return setNote("Enter the 6-digit email code.");
    setBusy(true);
    setError("");
    try {
      await confirmEmail({ email: targetEmail!, code: emailCode });
      setNote("Email verified.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not verify the code.");
    } finally {
      setBusy(false);
    }
  }

  async function continueAfterVerification() {
    setBusy(true);
    setError("");
    try {
      if (role === "org_admin" && organisationName) {
        // Registration number/tax ID/address are required by the backend but
        // are collected in step 1 of the application wizard, not here - the
        // wizard creates the real organisation record on that step's submit.
        navigate({ to: "/application", search: { organisationName } });
        return;
      }
      if (role === "org_staff") {
        // Joining works on the code the administrator shared (kept from
        // signup), and the person picks their role and adds a note there.
        navigate({ to: user ? "/join" : "/auth" });
        return;
      }
      navigate({ to: user ? "/portal" : "/auth" });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Verify your identity"
      subtitle="Confirm your email, then protect your account with an authenticator app."
      footer={
        <span>
          Wrong details?{" "}
          <Link
            to="/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Go back to signup
          </Link>
        </span>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-accent" />
              <div>
                <div className="text-sm font-medium text-card-foreground">Email address</div>
                <div className="text-xs text-muted-foreground">{targetEmail}</div>
              </div>
            </div>
            {emailVerified ? (
              <StatusChip tone="success">Verified</StatusChip>
            ) : (
              <StatusChip tone="warning">Pending</StatusChip>
            )}
          </div>
          {!emailVerified ? (
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="emailCode">Email code</Label>
                <Input
                  id="emailCode"
                  value={emailCode}
                  inputMode="numeric"
                  maxLength={6}
                  className="w-36 tracking-[0.35em]"
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                />
              </div>
              <Button disabled={busy} onClick={submitEmailCode}>
                Confirm email
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={async () => {
                  await resendCode(targetEmail!);
                  setNote("A new email code was sent.");
                }}
              >
                Resend code
              </Button>
            </div>
          ) : null}
        </div>

        <div
          className={
            emailVerified
              ? "rounded-md border border-border bg-card p-5"
              : "rounded-md border border-border bg-muted/40 p-5 opacity-60"
          }
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <KeyRound className="h-4 w-4 text-accent" />
              <div>
                <div className="text-sm font-medium text-card-foreground">Authenticator app</div>
                <div className="text-xs text-muted-foreground">
                  Two-step sign-in with Google Authenticator, Microsoft Authenticator or Authy
                </div>
              </div>
            </div>
            {mfaEnabled ? (
              <StatusChip tone="success">On</StatusChip>
            ) : setUpLater ? (
              <StatusChip tone="neutral">Later</StatusChip>
            ) : (
              <StatusChip tone="warning">Pending</StatusChip>
            )}
          </div>
          {!emailVerified ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Confirm your email first. Setting up the app needs a signed-in account.
            </p>
          ) : !mfaEnabled && !setUpLater ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                After your password, sign-in will ask for a 6-digit code from the app on your phone,
                so a stolen password alone cannot get into your account.
              </p>
              <AuthenticatorSetup
                email={targetEmail}
                onDone={() => {
                  void refetchUser();
                  setNote("Two-step sign-in is on.");
                }}
              />
              <button
                type="button"
                className="block text-xs text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setSetUpLater(true)}
              >
                Set it up later from Settings
              </button>
            </div>
          ) : null}
        </div>

        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {readyToContinue ? (
          <div className="rounded-md border border-success/30 bg-success/10 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" />{" "}
              {mfaEnabled ? "Email verified and two-step sign-in on" : "Email verified"}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {role === "org_admin"
                ? "Your organisation application is now unlocked."
                : role === "org_staff"
                  ? "Next, send your request to join your organisation."
                  : "You can continue to your workspace."}
            </p>
            <Button className="mt-4 w-full" disabled={busy} onClick={continueAfterVerification}>
              {role === "org_admin"
                ? "Create organisation & start application"
                : role === "org_staff"
                  ? "Continue to join request"
                  : "Continue"}
            </Button>
          </div>
        ) : null}
      </div>
    </AuthLayout>
  );
}
