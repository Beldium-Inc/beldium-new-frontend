import { createFileRoute } from "@tanstack/react-router";

import { TripList } from "@/components/independent/workspace";

export const Route = createFileRoute("/independent/trips")({
  head: () => ({
    meta: [
      { title: "My trips - Beldium Logistics Hub" },
      { name: "description", content: "Every trip you have accepted and its current stage." },
    ],
  }),
  component: () => <TripList view="trips" />,
});
