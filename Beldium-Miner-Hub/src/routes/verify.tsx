import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Mail, Smartphone } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { AuthLayout } from "@/components/auth-layout";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/errors";
import { confirmPhoneVerification, requestPhoneVerification } from "@/lib/api/auth";
import { organisationDirectory } from "@/lib/api/organisations";
import { useCreateJoinRequest } from "@/lib/api/queries";

const title = "Verify your account - Beldium Miner Hub";
const description = "Confirm your email address and mobile number before starting your mining organisation application.";

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
  const createJoinRequest = useCreateJoinRequest();
  const navigate = useNavigate();

  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneRequested, setPhoneRequested] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const targetEmail = user?.email ?? email;
  const emailVerified = Boolean(user?.email_verified_at);
  const phoneVerified = Boolean(user?.phone_verified_at);
  const bothVerified = emailVerified && phoneVerified;

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

  async function requestPhoneCode() {
    if (!user?.phone_number) return setError("Add a phone number to your account first.");
    setBusy(true);
    setError("");
    try {
      await requestPhoneVerification(user.phone_number);
      setPhoneRequested(true);
      setNote("A verification code was sent by SMS.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not send the SMS code.");
    } finally {
      setBusy(false);
    }
  }

  async function submitPhoneCode() {
    if (!user?.phone_number) return;
    if (phoneCode.length !== 6) return setNote("Enter the 6-digit SMS code.");
    setBusy(true);
    setError("");
    try {
      await confirmPhoneVerification({ phone_number: user.phone_number, code: phoneCode });
      await refetchUser();
      setNote("Phone verified.");
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
      if (role === "org_staff" && organisationName) {
        const matches = await organisationDirectory({ search: organisationName, page_size: 5 });
        const match = matches.results.find(
          (org) => org.name.trim().toLowerCase() === organisationName.trim().toLowerCase(),
        );
        if (!match) {
          setError(
            `No verified organisation named "${organisationName}" was found. Check the exact name with your admin.`,
          );
          return;
        }
        await createJoinRequest.mutateAsync({ organisation: match.id });
        navigate({ to: "/auth" });
        return;
      }
      navigate({ to: "/auth" });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Verify your identity"
      subtitle="Enter the codes sent to your email and phone to activate your account."
      footer={
        <span>
          Wrong details?{" "}
          <Link to="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
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
            {emailVerified ? <StatusChip tone="success">Verified</StatusChip> : <StatusChip tone="warning">Pending</StatusChip>}
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

        {emailVerified ? (
          <div className="rounded-md border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-accent" />
                <div>
                  <div className="text-sm font-medium text-card-foreground">Mobile number</div>
                  <div className="text-xs text-muted-foreground">{user?.phone_number}</div>
                </div>
              </div>
              {phoneVerified ? <StatusChip tone="success">Verified</StatusChip> : <StatusChip tone="warning">Pending</StatusChip>}
            </div>
            {!phoneVerified ? (
              <div className="mt-4 flex flex-wrap items-end gap-3">
                {!phoneRequested ? (
                  <Button disabled={busy} onClick={requestPhoneCode}>
                    Send SMS code
                  </Button>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="phoneCode">SMS code</Label>
                      <Input
                        id="phoneCode"
                        value={phoneCode}
                        inputMode="numeric"
                        maxLength={6}
                        className="w-36 tracking-[0.35em]"
                        onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                      />
                    </div>
                    <Button disabled={busy} onClick={submitPhoneCode}>
                      Confirm number
                    </Button>
                    <Button variant="ghost" disabled={busy} onClick={requestPhoneCode}>
                      Resend code
                    </Button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {bothVerified ? (
          <div className="rounded-md border border-success/30 bg-success/10 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" /> Both channels verified
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {role === "org_admin"
                ? "Your organisation application is now unlocked."
                : "You can continue to your workspace."}
            </p>
            <Button className="mt-4 w-full" disabled={busy} onClick={continueAfterVerification}>
              {role === "org_admin" ? "Create organisation & start application" : "Continue"}
            </Button>
          </div>
        ) : null}
      </div>
    </AuthLayout>
  );
}
