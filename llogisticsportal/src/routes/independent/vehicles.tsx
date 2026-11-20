import { createFileRoute } from "@tanstack/react-router";

import { Vehicles } from "@/components/independent/workspace";

export const Route = createFileRoute("/independent/vehicles")({
  head: () => ({
    meta: [
      { title: "My vehicles - Beldium Logistics Hub" },
      { name: "description", content: "Declared vehicles and their review readiness." },
    ],
  }),
  component: Vehicles,
});
