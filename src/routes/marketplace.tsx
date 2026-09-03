import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { DemoProvider } from "@/verticals/marketplace/store";
import type { Role } from "@/verticals/marketplace/demo-data";
import { useSession } from "@/lib/session";
import { roleIn } from "@/lib/verticals";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Beldium Marketplace Compliance" },
      {
        name: "description",
        content:
          "Verified offtake for Nigerian minerals: RFQs, offers, orders and settlement against compliance records.",
      },
    ],
  }),
  component: MarketplaceLayout,
});

function MarketplaceLayout() {
  const { session, hydrated, signOut } = useSession();
  const navigate = useNavigate();

  const role = session?.vertical === "marketplace" ? session.role : null;
  const valid = role !== null && roleIn("marketplace", role) !== undefined;

  useEffect(() => {
    if (hydrated && !valid) navigate({ to: "/" });
  }, [hydrated, valid, navigate]);

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
    <div data-vertical="marketplace">
      <DemoProvider role={role as Role} onSignOut={signOut}>
        <Outlet />
      </DemoProvider>
    </div>
  );
}
