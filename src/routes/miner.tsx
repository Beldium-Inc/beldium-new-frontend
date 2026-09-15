import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useSession } from "@/lib/session";
import { MinerHubProvider } from "@/verticals/miner-hub/store";
import { MinerHubShell } from "@/verticals/miner-hub/shell";

// The Miner Hub: a richer, single miner-facing workspace spanning marketplace
// RFQs, supply commitments, transactions, logistics and finance, superseding
// what `/miner-portal` used to hand off into (the narrow `mining` vertical
// scoped to the miner role). It reuses the same session — signed in via
// `/miner-portal`, `vertical: "mining"`, `role: "miner"` — rather than
// introducing a new auth flow, since `/mining/*` (organisation, sites,
// production, inventory, compliance) is still real and still linked to from
// here.

export const Route = createFileRoute("/miner")({
  ssr: false,
  head: () => ({ meta: [{ title: "Beldium Miner Hub" }] }),
  component: MinerHubLayout,
});

function MinerHubLayout() {
  const { session, hydrated } = useSession();
  const navigate = useNavigate();

  const valid = session?.vertical === "mining" && session.role === "miner";

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
    <div data-vertical="miner-hub">
      <MinerHubProvider>
        <MinerHubShell>
          <Outlet />
        </MinerHubShell>
      </MinerHubProvider>
    </div>
  );
}
