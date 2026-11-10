import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/logistics/AppShell";
import { MovementDetail } from "@/verticals/logistics/transport";

export const Route = createFileRoute("/logistics/operator/transport/$movementId")({
  head: () => ({ meta: [{ title: "Movement | Beldium Logistics Compliance" }] }),
  component: MovementPage,
});

function MovementPage() {
  const { movementId } = Route.useParams();
  return (
    <AppShell
      role="operator"
      breadcrumbs={[
        { label: "Compliance Operations", to: "/logistics/operator" },
        { label: "Transport", to: "/logistics/operator/transport" },
        { label: "Movement" },
      ]}
    >
      <MovementDetail movementId={movementId} readOnly={false} />
    </AppShell>
  );
}
