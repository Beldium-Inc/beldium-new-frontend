import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/logistics/AppShell";
import { MovementDetail } from "@/verticals/logistics/transport";

export const Route = createFileRoute("/logistics/regulator/transport/$movementId")({
  head: () => ({ meta: [{ title: "Movement | Beldium Logistics Compliance" }] }),
  component: MovementPage,
});

function MovementPage() {
  const { movementId } = Route.useParams();
  return (
    <AppShell
      role="regulator"
      breadcrumbs={[
        { label: "Regulatory Oversight", to: "/logistics/regulator" },
        { label: "Transport", to: "/logistics/regulator/transport" },
        { label: "Movement" },
      ]}
    >
      <MovementDetail movementId={movementId} readOnly={true} />
    </AppShell>
  );
}
