import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, MailOpen } from "lucide-react";
import { AuthShell } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import {
  MEMBERSHIP_ROLE_LABELS,
  getOrganisation,
  useAcceptInvitation,
  useCurrentUser,
  useHasTokens,
  type MembershipRole,
} from "@/lib/api";
import { clearInvitation, rememberInvitation } from "@/lib/onboarding/invite";
import { useSession } from "@/lib/session";
import { useOnboarding } from "@/lib/onboarding/store";
import { homeFor } from "@/lib/verticals";

export const Route = createFileRoute("/onboarding/invite")({
  validateSearch: (search: Record<string, unknown>): { token?: string } =>
    typeof search["token"] === "string" ? { token: search["token"] } : {},
  head: () => ({ meta: [{ title: "Accept invitation | Beldium Compliance" }] }),
  component: InvitePage,
});

/**
 * Where an email invitation lands. Accepting adds the person to the company
 * with the role the administrator chose, with no second approval (decision
 * D8). The invitation is tied to one email address, so the person must be
 * signed in as that address.
 */
function InvitePage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const hasTokens = useHasTokens();
  const me = useCurrentUser();
  const { session } = useSession();
  const { sector: onboardingSector } = useOnboarding();
  // The sector being signed up in, or signed in to. An invitation from
  // another sector's organisation is refused by the server.
  const sector = onboardingSector ?? session?.vertical ?? null;
  const accept = useAcceptInvitation();
  const [joined, setJoined] = useState<{ name: string; role: MembershipRole } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep the token across sign-in or sign-up, which leave this page.
  useEffect(() => {
    if (token) rememberInvitation(token);
  }, [token]);

  if (!token) {
    return (
      <AuthShell title="This invitation link is incomplete" width="sm">
        <p className="text-sm text-muted-foreground">
          Open the link from the invitation email again, or ask your company administrator to send a
          new invitation.
        </p>
      </AuthShell>
    );
  }

  const doAccept = async () => {
    setError(null);
    try {
      const result = await accept.mutateAsync({ token, sector });
      clearInvitation();
      const organisation = await getOrganisation(result.organisation_id).catch(() => null);
      setJoined({ name: organisation?.name ?? "the company", role: result.role });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        /email|match/i.test(message)
          ? `This invitation was sent to a different email address than ${me.data?.email ?? "the one you are signed in with"}. Sign out, then sign in or create an account with the invited address.`
          : /expired|no longer|invalid|revoked|not found/i.test(message)
            ? "This invitation has expired or was withdrawn. Ask your company administrator to send a new one."
            : message || "The invitation could not be accepted. Please try again.",
      );
    }
  };

  if (joined) {
    return (
      <AuthShell title={`You have joined ${joined.name}`} width="sm">
        <div className="flex items-start gap-3 rounded-lg border border-success/60 bg-success/20 px-4 py-3 text-sm">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <span>
            You are now a {MEMBERSHIP_ROLE_LABELS[joined.role]} of {joined.name}. You can open the
            company's workspace straight away.
          </span>
        </div>
        <div className="mt-6">
          <Button
            size="lg"
            onClick={() =>
              session
                ? navigate({ to: homeFor(session.vertical, session.role) })
                : navigate({ to: "/signin" })
            }
          >
            {session ? "Open my workspace" : "Sign in to your workspace"}
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Join an existing company"
      title="You have been invited to a company on Beldium"
      description="Accepting adds you to the company with the role your administrator chose. No further approval is needed."
      width="sm"
    >
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <MailOpen className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <span>
          {hasTokens
            ? `You are signed in as ${me.data?.email ?? "…"}. The invitation must have been sent to this address.`
            : "Sign in, or create an account with the email address the invitation was sent to. You will come back here to accept."}
        </span>
      </div>
      {error && (
        <p className="mt-4 rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-sm">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        {hasTokens ? (
          <Button size="lg" disabled={accept.isPending} onClick={doAccept}>
            {accept.isPending ? "Accepting…" : "Accept invitation"}
          </Button>
        ) : (
          <>
            <Button size="lg" onClick={() => navigate({ to: "/signin" })}>
              Sign in
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate({ to: "/onboarding/account" })}
            >
              Create an account
            </Button>
          </>
        )}
      </div>
    </AuthShell>
  );
}
