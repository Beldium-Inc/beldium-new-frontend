import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { Shell } from "@/components/beldium/shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/portal")({
  ssr: false,
  component: PortalLayout,
});

function PortalLayout() {
  const { status } = useAuth();

  if (status === "loading") {
    return <div className="p-10 text-sm text-muted-foreground">Loading your workspace…</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-foreground">Sign in required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The logistics workspace is only available to signed-in operators and organisation
            members.
          </p>
          <Button asChild className="mt-5 w-full">
            <Link to="/auth">Go to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}
