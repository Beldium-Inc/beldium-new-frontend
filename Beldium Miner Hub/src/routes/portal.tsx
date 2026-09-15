import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { MinerShell } from "@/components/miner-shell";
import { Button } from "@/components/ui/button";
import { useMiner } from "@/lib/miner-store";

export const Route = createFileRoute("/portal")({
  component: PortalLayout,
});

function PortalLayout() {
  const { state, hydrated } = useMiner();

  if (!hydrated) {
    return <div className="p-10 text-sm text-muted-foreground">Loading your workspace…</div>;
  }

  if (!state.signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-foreground">Sign in required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The miner workspace is only available to signed-in miners and organisation members.
          </p>
          <Button asChild className="mt-5 w-full">
            <Link to="/auth">Go to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <MinerShell>
      <Outlet />
    </MinerShell>
  );
}
