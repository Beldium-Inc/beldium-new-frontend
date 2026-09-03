import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Shell } from "@/verticals/mining/components/Shell";
import { PrototypeStoreProvider } from "@/verticals/mining/store";
import type { Role } from "@/verticals/mining/types";
import { useSession } from "@/lib/session";
import { roleIn } from "@/lib/verticals";

export const Route = createFileRoute("/mining")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Beldium Mining Compliance" },
      {
        name: "description",
        content:
          "Site licensing, production, sampling and environmental oversight for Nigerian mining operations.",
      },
    ],
  }),
  component: MiningLayout,
});

function MiningLayout() {
  const { session, hydrated, signOut } = useSession();
  const navigate = useNavigate();

  const role = session?.vertical === "mining" ? session.role : null;
  const valid = role !== null && roleIn("mining", role) !== undefined;

  useEffect(() => {
    if (hydrated && !valid) navigate({ to: "/" });
  }, [hydrated, valid, navigate]);

  if (!hydrated || !valid) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">
          {hydrated ? "Redirecting to sign in…" : "Loading workspace…"}
        </p>
      </div>
    );
  }

  return (
    // data-vertical scopes this dashboard's theme tokens (see src/styles.css).
    <div data-vertical="mining">
      <PrototypeStoreProvider role={role as Role} onSignOut={signOut}>
        <Shell>
          <Outlet />
        </Shell>
      </PrototypeStoreProvider>
    </div>
  );
}
