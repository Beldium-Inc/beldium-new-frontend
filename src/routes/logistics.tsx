import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppStateProvider } from "@/verticals/logistics/store";
import type { Role } from "@/verticals/logistics/mock-data";
import { useSession } from "@/lib/session";
import { roleIn } from "@/lib/verticals";

export const Route = createFileRoute("/logistics")({
  head: () => ({
    meta: [
      { title: "Beldium Logistics Compliance" },
      {
        name: "description",
        content:
          "Carrier accreditation, fleet and driver compliance, and movement audit for Nigerian mineral logistics.",
      },
    ],
  }),
  component: LogisticsLayout,
});

function LogisticsLayout() {
  const { session, hydrated, signOut } = useSession();
  const navigate = useNavigate();

  const role = session?.vertical === "logistics" ? session.role : null;
  const valid = role !== null && roleIn("logistics", role) !== undefined;

  useEffect(() => {
    if (hydrated && !valid) navigate({ to: "/signin" });
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
    <div data-vertical="logistics">
      <AppStateProvider role={role as Role} onSignOut={signOut}>
        <Outlet />
      </AppStateProvider>
    </div>
  );
}
