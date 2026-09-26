import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Mail, Smartphone } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { AuthLayout } from "@/components/auth-layout";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import { organisationDirectory } from "@/lib/api/organisations";
import { useCreateJoinRequest } from "@/lib/api/queries";
import { useAuth } from "@/lib/auth";
import { isDemoMode } from "@/lib/data-mode";
import { DEMO_CODE, existingOrganisations, requestToJoin } from "@/lib/onboarding-store";

const title = "Verify your account - Beldium Logistics Hub";
const description =
  "Confirm your email address before starting your logistics organisation application.";

// SMS sending is disabled on the backend (no approved Termii sender ID yet),
// same as Miner Hub: the phone step is shown but not required.
const PHONE_VERIFICATION_ENABLED = false;

const searchSchema = z.object({
  email: z.string().optional(),
  role: z.enum(["org_admin", "org_staff", "independent"]).optional(),
  operatorType: z.string().optional(),
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
  const { email, role, operatorType, organisationName } = Route.useSearch();
  const { user, confirmEmail, resendCode } = useAuth();
  const createJoinRequest = useCreateJoinRequest();
  const navigate = useNavigate();

  const [emailCode, setEmailCode] = useState("");
  const [note, setNote] = useState(isDemoMode ? `Demo mode: use code ${DEMO_CODE}.` : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const targetEmail = user?.email ?? email;
  const emailVerified = Boolean(user?.email_verified_at);

  if (!targetEmail) {
    return (
      <AuthLayout
        title="No account in progress"
        subtitle="Start by creating your operator account."
      >
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

  async function joinOrganisation(name: string) {
    if (isDemoMode) {
      if (!requestToJoin(name)) {
        setError(
          `No organisation named "${name}" was found. Demo organisations: ${existingOrganisations.map((o) => o.name).join(", ")}.`,
        );
        return false;
      }
      return true;
    }
    const matches = await organisationDirectory({ search: name, page_size: 5 });
    const match = matches.results.find(
      (org) => org.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    if (!match) {
      setError(
        `No verified organisation named "${name}" was found. Check the exact name with your admin.`,
      );
      return false;
    }
    await createJoinRequest.mutateAsync({ organisation: match.id });
    return true;
  }

  async function continueAfterVerification() {
    setBusy(true);
    setError("");
    try {
      if (role === "org_staff" && organisationName) {
        if (await joinOrganisation(organisationName)) navigate({ to: user ? "/portal" : "/auth" });
        return;
      }
      // Registering or independent: the wizard creates the organisation record.
      navigate({ to: "/application", search: { organisationName, operatorType } });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Verify your identity"
      subtitle="Enter the code sent to your email to activate your account."
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
                  try {
                    const res = await resendCode(targetEmail!);
                    setNote(isDemoMode ? res.message : "A new email code was sent.");
                  } catch (cause) {
                    setError(
                      cause instanceof ApiError ? cause.message : "Could not resend the code.",
                    );
                  }
                }}
              >
                Resend code
              </Button>
            </div>
          ) : null}
        </div>

        {emailVerified ? (
          <div className="rounded-md border border-border bg-muted/40 p-5 opacity-60">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-accent" />
                <div>
                  <div className="text-sm font-medium text-card-foreground">Mobile number</div>
                  <div className="text-xs text-muted-foreground">{user?.phone_number}</div>
                </div>
              </div>
              <StatusChip tone="neutral">
                {PHONE_VERIFICATION_ENABLED ? "Pending" : "Unavailable"}
              </StatusChip>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Phone verification is temporarily unavailable. You can continue without it; we'll ask
              you to verify later.
            </p>
          </div>
        ) : null}

        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {emailVerified ? (
          <div className="rounded-md border border-success/30 bg-success/10 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" /> Account verified
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {role === "org_staff"
                ? "Send your join request to continue."
                : "Your operator application is now unlocked."}
            </p>
            <Button className="mt-4 w-full" disabled={busy} onClick={continueAfterVerification}>
              {role === "org_staff" ? "Send join request" : "Start operator application"}
            </Button>
          </div>
        ) : null}
      </div>
    </AuthLayout>
  );
}
