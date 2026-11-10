import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/logistics/AppShell";
import { MovementList } from "@/verticals/logistics/transport";

export const Route = createFileRoute("/logistics/operator/transport/")({
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
      role="operator"
      breadcrumbs={[
        { label: "Compliance Operations", to: "/logistics/operator" },
        { label: "Transport" },
      ]}
    >
      <MovementList basePath="/logistics/operator/transport" />
    </AppShell>
  );
}
