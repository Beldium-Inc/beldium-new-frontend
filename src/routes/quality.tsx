import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { BeldiumProvider } from "@/verticals/quality/store";
import type { Role } from "@/verticals/quality/types";
import { useSession } from "@/lib/session";
import { roleIn } from "@/lib/verticals";

export const Route = createFileRoute("/quality")({
  head: () => ({
    meta: [
      { title: "Beldium Quality & Control" },
      {
        name: "description",
        content:
          "Sample custody, laboratory testing and material certificates for Nigerian mineral supply chains.",
      },
    ],
  }),
  component: QualityLayout,
});

function QualityLayout() {
  const { session, hydrated, signOut } = useSession();
  const navigate = useNavigate();

  const role = session?.vertical === "quality" ? session.role : null;
  const valid = role !== null && roleIn("quality", role) !== undefined;

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
    <div data-vertical="quality">
      <BeldiumProvider role={role as Role} onSignOut={signOut}>
        <Outlet />
      </BeldiumProvider>
    </div>
  );
}
