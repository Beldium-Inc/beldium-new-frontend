import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/logistics/AppShell";
import { MovementList } from "@/verticals/logistics/transport";

export const Route = createFileRoute("/logistics/regulator/transport/")({
  head: () => ({
    meta: [
      { title: "Transport oversight | Beldium Logistics Compliance" },
      { name: "description", content: "Mineral movements across logistics companies." },
    ],
  }),
  component: TransportPage,
});

function TransportPage() {
  return (
    <AppShell
      role="regulator"
      breadcrumbs={[
        { label: "Regulatory Oversight", to: "/logistics/regulator" },
        { label: "Transport" },
      ]}
    >
      <MovementList basePath="/logistics/regulator/transport" />
    </AppShell>
  );
}
