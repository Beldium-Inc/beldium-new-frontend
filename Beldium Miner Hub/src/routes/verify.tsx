import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Mail, Smartphone } from "lucide-react";
import { useState } from "react";

import { AuthLayout } from "@/components/auth-layout";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMiner } from "@/lib/miner-store";

const title = "Verify your account — Beldium Miner Hub";
const description = "Confirm your email address and mobile number before starting your mining organisation application.";

export const Route = createFileRoute("/verify")({
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
  const { state, verifyEmail, verifyPhone, hydrated } = useMiner();
  const navigate = useNavigate();
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [note, setNote] = useState("");

  const account = state.account;
  const bothVerified = Boolean(account?.emailVerified && account?.phoneVerified);

  if (hydrated && !account) {
    return (
      <AuthLayout title="No account in progress" subtitle="Start by creating your miner account.">
        <Button asChild className="w-full">
          <Link to="/signup">Create account</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify your identity"
      subtitle="We sent a 6-digit code to each channel. In this prototype any 6 digits are accepted."
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
                <div className="text-xs text-muted-foreground">{account?.email}</div>
              </div>
            </div>
            {account?.emailVerified ? (
              <StatusChip tone="success">Verified</StatusChip>
            ) : (
              <StatusChip tone="warning">Pending</StatusChip>
            )}
          </div>
          {!account?.emailVerified ? (
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
              <Button
                onClick={() => (emailCode.length === 6 ? verifyEmail() : setNote("Enter the 6-digit email code."))}
              >
                Confirm email
              </Button>
              <Button variant="ghost" onClick={() => setNote("A new email code was sent.")}>
                Resend code
              </Button>
            </div>
          ) : null}
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-accent" />
              <div>
                <div className="text-sm font-medium text-card-foreground">Mobile number</div>
                <div className="text-xs text-muted-foreground">{account?.phone}</div>
              </div>
            </div>
            {account?.phoneVerified ? (
              <StatusChip tone="success">Verified</StatusChip>
            ) : (
              <StatusChip tone="warning">Pending</StatusChip>
            )}
          </div>
          {!account?.phoneVerified ? (
            <div className="mt-4 flex flex-wrap items-end gap-3">
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
              <Button onClick={() => (phoneCode.length === 6 ? verifyPhone() : setNote("Enter the 6-digit SMS code."))}>
                Confirm number
              </Button>
              <Button variant="ghost" onClick={() => setNote("A new SMS code was sent.")}>
                Resend code
              </Button>
            </div>
          ) : null}
        </div>

        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}

        {state.joinRequest ? (
          <div className="rounded-md border border-primary/25 bg-primary/5 p-5 text-sm">
            <div className="font-medium text-foreground">Join request {state.joinRequest.reference}</div>
            <p className="mt-1 text-muted-foreground">
              Sent to the admin of {state.joinRequest.organisationName} on {state.joinRequest.submittedAt}. You will be
              notified once it is approved.
            </p>
          </div>
        ) : null}

        {bothVerified ? (
          <div className="rounded-md border border-success/30 bg-success/10 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" /> Both channels verified
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {account?.role === "org_admin"
                ? "Your organisation application is now unlocked."
                : "You can continue to your workspace."}
            </p>
            <Button
              className="mt-4 w-full"
              onClick={() =>
                account?.role === "org_admin"
                  ? navigate({ to: "/application" })
                  : navigate({ to: "/auth" })
              }
            >
              {account?.role === "org_admin" ? "Start organisation application" : "Continue to sign in"}
            </Button>
          </div>
        ) : null}
      </div>
    </AuthLayout>
  );
}
