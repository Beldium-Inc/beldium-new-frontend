import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Shell } from "@/components/beldium/shell";

export const Route = createFileRoute("/_ops")({
  ssr: false,
  component: OpsLayout,
});

function OpsLayout() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}
