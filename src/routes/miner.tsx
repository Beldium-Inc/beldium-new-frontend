import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Shell } from "@/verticals/miner/components/Shell";
import { MinerStoreProvider } from "@/verticals/miner/store";
import { useSession } from "@/lib/session";
import { useSignOut } from "@/lib/sign-out";
import { roleIn } from "@/lib/verticals";

export const Route = createFileRoute("/miner")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Beldium Miner Portal" },
      {
        name: "description",
        content:
          "Manage your organisation, mine sites, production, inventory and compliance in one place.",
      },
    ],
  }),
  component: MinerLayout,
});

function MinerLayout() {
  const { session, hydrated } = useSession();
  const signOut = useSignOut();
  const navigate = useNavigate();

  const role = session?.vertical === "miner" ? session.role : null;
  const valid = role !== null && roleIn("miner", role) !== undefined;

  useEffect(() => {
    if (hydrated && !valid) navigate({ to: "/miner-portal" });
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
    <div data-vertical="miner">
      <MinerStoreProvider onSignOut={signOut}>
        <Shell>
          <Outlet />
        </Shell>
      </MinerStoreProvider>
    </div>
  );
}
