import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppShell } from "@/verticals/processing/AppShell";
import { AppStateProvider, type Role } from "@/verticals/processing/store";
import { useSession } from "@/lib/session";
import { roleIn } from "@/lib/verticals";

export const Route = createFileRoute("/processing")({
  head: () => ({
    meta: [
      { title: "Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Processor onboarding, traceability, incidents and environmental monitoring for Nigerian mineral processing facilities.",
      },
    ],
  }),
  component: ProcessingLayout,
});

function ProcessingLayout() {
  const { session, hydrated, signOut } = useSession();
  const navigate = useNavigate();

  const role = session?.vertical === "processing" ? session.role : null;
  const valid = role !== null && roleIn("processing", role) !== undefined;

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
    <div data-vertical="processing">
      <AppStateProvider role={role as Role} onSignOut={signOut}>
        <AppShell>
          <Outlet />
        </AppShell>
      </AppStateProvider>
    </div>
  );
}
