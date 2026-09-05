import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { StoreProvider } from "@/verticals/export/store";
import type { Role } from "@/verticals/export/mock-data";
import { useSession } from "@/lib/session";
import { roleIn } from "@/lib/verticals";

export const Route = createFileRoute("/export")({
  head: () => ({
    meta: [
      { title: "Beldium Export Compliance" },
      {
        name: "description",
        content:
          "Consignment verification, evidence review and export compliance records for Nigerian mineral exports.",
      },
    ],
  }),
  component: ExportLayout,
});

function ExportLayout() {
  const { session, hydrated, signOut } = useSession();
  const navigate = useNavigate();

  const role = session?.vertical === "export" ? session.role : null;
  const valid = role !== null && roleIn("export", role) !== undefined;

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
    <div data-vertical="export">
      <StoreProvider role={role as Role} onSignOut={signOut}>
        <Outlet />
      </StoreProvider>
    </div>
  );
}
