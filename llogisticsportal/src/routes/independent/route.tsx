import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { IndependentShell } from "@/components/beldium/independent-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { IndependentProvider } from "@/lib/independent/store";

export const Route = createFileRoute("/independent")({
  ssr: false,
  component: IndependentLayout,
});

function IndependentLayout() {
  const { status, user } = useAuth();

  if (status === "loading") {
    return <div className="p-10 text-sm text-muted-foreground">Loading your workspace…</div>;
  }

  if (status === "unauthenticated" || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-foreground">Sign in required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The independent operator workspace is only available to signed-in operators.
          </p>
          <Button asChild className="mt-5 w-full">
            <Link to="/auth">Go to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!user.email_verified_at) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-foreground">Verify your email first</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Account activation is separate from compliance. Confirm your email to open the
            workspace.
          </p>
          <Button asChild className="mt-5 w-full">
            <Link to="/verify" search={{ email: user.email, role: "independent" }}>
              Verify email
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <IndependentProvider>
      <IndependentShell>
        <Outlet />
      </IndependentShell>
    </IndependentProvider>
  );
}
