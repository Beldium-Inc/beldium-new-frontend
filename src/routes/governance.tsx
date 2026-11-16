import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { useSession } from "@/lib/session";
import { useSignOut } from "@/lib/sign-out";
import { roleIn } from "@/lib/verticals";
import { GovernanceShell } from "@/verticals/governance/shell";

// Pages reached from outside the workspace: an invitation link, and the access
// request for someone who has a Beldium account but no governance seat yet.
const OPEN_PATHS = ["/governance/invitation", "/governance/request-access"];

export const Route = createFileRoute("/governance")({
  head: () => ({
    meta: [
      { title: "Beldium Governance & Risk" },
      {
        name: "description",
        content:
          "Governance, risk and policy intelligence across Beldium's mineral supply chain: policy, enterprise risk, regulatory analysis and cross sector oversight.",
      },
    ],
  }),
  component: GovernanceLayout,
});

function GovernanceLayout() {
  const { session, hydrated } = useSession();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const open = OPEN_PATHS.some((p) => pathname.startsWith(p));

  const role = session?.vertical === "governance" ? session.role : null;
  const valid = role !== null && roleIn("governance", role) !== undefined;

  useEffect(() => {
    if (!open && hydrated && !valid) navigate({ to: "/signin" });
  }, [open, hydrated, valid, navigate]);

  if (open) {
    return (
      <div data-vertical="governance" className="min-h-screen bg-background text-foreground">
        <Outlet />
      </div>
    );
  }

  if (!hydrated || !valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          {hydrated ? "Redirecting to sign in…" : "Loading workspace…"}
        </p>
      </div>
    );
  }

  return (
    // data-vertical scopes this dashboard's theme tokens (see src/styles.css).
    <div data-vertical="governance">
      <GovernanceShell onSignOut={signOut}>
        <Outlet />
      </GovernanceShell>
    </div>
  );
}
