import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { DemoProvider } from "@/verticals/warehousing/store";
import type { RoleId } from "@/verticals/warehousing/data";
import {
  goToComplianceHost,
  goToWarehouseHost,
  isOtherBeldiumHost,
  isWarehouseHost,
} from "@/lib/hosts";
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

  // Warehouse operators work on warehouse.beldium.com; the compliance partners
  // and regulators who review them work on the compliance site. A session on
  // the wrong site is sent across, keeping the path.
  useEffect(() => {
    if (!role) return;
    const { pathname, search, hash } = window.location;
    const path = `${pathname}${search}${hash}`;
    if (role === "operator" && isOtherBeldiumHost()) goToWarehouseHost(path);
    else if (role !== "operator" && isWarehouseHost()) goToComplianceHost(path);
  }, [role]);

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
