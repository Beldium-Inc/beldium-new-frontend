import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { MEMBERSHIP_ROLE_LABELS, useCancelJoinRequest, useMyJoinRequests } from "@/lib/api";
import { useSignOut } from "@/lib/sign-out";

export const Route = createFileRoute("/onboarding/pending")({
  head: () => ({ meta: [{ title: "Waiting for approval | Beldium Compliance" }] }),
  component: PendingPage,
});

/**
 * The one screen a pending member sees (backend plan section 2): their
 * request to join a company is waiting for the company administrator. No
 * company data is shown until it is approved.
 */
function PendingPage() {
  const navigate = useNavigate();
  const requests = useMyJoinRequests();
  const cancel = useCancelJoinRequest();
  const signOut = useSignOut();
  const pending = (requests.data?.results ?? []).find((r) => r.status === "pending");

  if (requests.isPending) {
    return (
      <AuthShell title="Checking your request…" width="sm">
        <p className="text-sm text-muted-foreground">One moment.</p>
      </AuthShell>
    );
  }

  if (!pending) {
    return (
      <AuthShell title="No request is waiting" width="sm">
        <p className="text-sm text-muted-foreground">
          You have no pending request to join a company. If it was approved, sign in again to open
          the workspace. If it was declined or you were removed, you can ask to join again or
          register your own company.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button size="lg" onClick={() => navigate({ to: "/signin" })}>
            Sign in
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate({ to: "/onboarding/join" })}>
            Use a join code
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Join an existing company"
      title={`Your request to join ${pending.organisation_name} is waiting for approval`}
      width="sm"
    >
      <div className="flex items-start gap-3 rounded-lg border border-warning/60 bg-warning/15 px-4 py-3 text-sm">
        <Clock className="mt-0.5 size-5 shrink-0" />
        <span>
          You asked on {new Date(pending.created_at).toLocaleDateString("en-GB")} to join as{" "}
          {MEMBERSHIP_ROLE_LABELS[pending.requested_role]}. The company's administrator approves or
          declines it. You will get an email either way, and you will see nothing of the company
          until it is approved.
        </span>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          size="lg"
          variant="outline"
          disabled={cancel.isPending}
          onClick={() => {
            if (!window.confirm(`Withdraw your request to join ${pending.organisation_name}?`))
              return;
            cancel
              .mutateAsync(pending.id)
              .then(() => toast.success("Request withdrawn"))
              .catch((err: unknown) =>
                toast.error("The request could not be withdrawn", {
                  description: err instanceof Error ? err.message : "Please try again.",
                }),
              );
          }}
        >
          Withdraw request
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onClick={() => {
            signOut();
            navigate({ to: "/signin" });
          }}
        >
          Sign out
        </Button>
      </div>
    </AuthShell>
  );
}
