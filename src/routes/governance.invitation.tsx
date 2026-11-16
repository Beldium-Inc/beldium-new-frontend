import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import { BeldiumLogo } from "@/components/beldium-logo";
import { Button } from "@/components/ui/button";
import { useAcceptGovernanceInvitation, useGovernanceInvitationPreview } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { useSignOut } from "@/lib/sign-out";
import { AccountGate } from "@/verticals/governance/account-gate";
import {
  clearGovernanceInvitation,
  governanceSeat,
  rememberGovernanceInvitation,
} from "@/verticals/governance/access";
import { LoadError, errorMessage, formatDate } from "@/verticals/governance/ui";

export const Route = createFileRoute("/governance/invitation")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { token?: string } =>
    typeof search["token"] === "string" ? { token: search["token"] } : {},
  head: () => ({ meta: [{ title: "Accept invitation | Beldium Governance" }] }),
  component: InvitationPage,
});

function InvitationPage() {
  const { token = "" } = Route.useSearch();
  const preview = useGovernanceInvitationPreview(token);
  const { user } = useAuth();
  const accept = useAcceptGovernanceInvitation();
  const { signIn: startSession } = useSession();
  const signOut = useSignOut();
  const navigate = useNavigate();

  // Keep the token while the person signs in or verifies a new account.
  useEffect(() => {
    if (token) rememberGovernanceInvitation(token);
  }, [token]);

  const invitation = preview.data;
  const wrongAccount =
    invitation && user && user.email.toLowerCase() !== invitation.email.toLowerCase();

  const acceptNow = () =>
    accept.mutate(token, {
      onSuccess: (member) => {
        clearGovernanceInvitation();
        startSession("governance", governanceSeat(member.role));
        toast.success(`Welcome. You joined as ${member.role_label}.`);
        navigate({ to: "/governance/dashboard" });
      },
      onError: (e) => toast.error(errorMessage(e)),
    });

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5">
        <div className="flex items-center gap-3">
          <BeldiumLogo className="h-12 w-12" />
          <div>
            <div className="font-display text-xl font-semibold">Beldium</div>
            <div className="text-sm text-muted-foreground">Governance &amp; Risk</div>
          </div>
        </div>
        {!token ? (
          <Unavailable message="This page needs the link from your invitation email." />
        ) : preview.isPending ? (
          <p className="text-sm text-muted-foreground">Checking your invitation…</p>
        ) : preview.error || !invitation ? (
          <Unavailable
            message={
              preview.error ? errorMessage(preview.error) : "This invitation link is not valid."
            }
          />
        ) : invitation.status !== "pending" ? (
          <Unavailable
            message={`This invitation is ${invitation.status}. Ask your administrator for a new one if you still need access.`}
            clear
          />
        ) : (
          <>
            <h1 className="font-display text-2xl font-semibold">You’re invited</h1>
            <div className="space-y-1 border-y py-4 text-sm">
              <p>{invitation.email}</p>
              <p className="font-medium">{invitation.role_label}</p>
              <p className="text-muted-foreground">{invitation.organisation}</p>
              <p className="text-xs text-muted-foreground">
                Expires {formatDate(invitation.expires_at)}
              </p>
            </div>
            <AccountGate
              email={invitation.email}
              onSignInClick={() => rememberGovernanceInvitation(token)}
            >
              {wrongAccount ? (
                <div className="space-y-3">
                  <LoadError
                    error={
                      new Error(
                        `You are signed in as ${user.email}. This invitation is for ${invitation.email}.`,
                      )
                    }
                  />
                  <Button variant="outline" onClick={signOut}>
                    Sign out and switch account
                  </Button>
                </div>
              ) : (
                <Button className="w-full" disabled={accept.isPending} onClick={acceptNow}>
                  {accept.isPending ? "Accepting…" : "Accept invitation"}
                </Button>
              )}
            </AccountGate>
          </>
        )}
      </div>
    </div>
  );
}

function Unavailable({ message, clear }: { message: string; clear?: boolean }) {
  useEffect(() => {
    if (clear) clearGovernanceInvitation();
  }, [clear]);
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Invitation unavailable</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild variant="outline">
        <Link to="/signin">Back to sign in</Link>
      </Button>
    </>
  );
}
