import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { DemoProvider } from "@/verticals/warehousing/store";
import type { RoleId } from "@/verticals/warehousing/data";
import { useSession } from "@/lib/session";
import { useSignOut } from "@/lib/sign-out";
import { roleIn } from "@/lib/verticals";

export const Route = createFileRoute("/warehousing")({
  head: () => ({
    meta: [
      { title: "Beldium Warehousing Compliance" },
      {
        name: "description",
        content:
          "Facility accreditation, inventory custody and release control for Nigerian mineral warehousing.",
      },
    ],
  }),
  component: WarehousingLayout,
});

function WarehousingLayout() {
  const { session, hydrated } = useSession();
  const signOut = useSignOut();
  const navigate = useNavigate();

  const role = session?.vertical === "warehousing" ? session.role : null;
  const valid = role !== null && roleIn("warehousing", role) !== undefined;

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
    <div data-vertical="warehousing">
      <DemoProvider role={role as RoleId} onSignOut={signOut}>
        <Outlet />
      </DemoProvider>
    </div>
  );
}
