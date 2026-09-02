import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Shell } from "@/components/app/Shell";
import { useStore } from "@/lib/prototype/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const { role, hydrated } = useStore();

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Loading workspace…</p>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-sm rounded-lg border border-border bg-surface p-8 text-center shadow-card">
          <h1 className="font-display text-lg font-semibold">You are signed out</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose a demo role on the sign-in screen to enter the prototype.</p>
          <Button asChild className="mt-5 w-full">
            <Link to="/">Go to sign in</Link>
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
