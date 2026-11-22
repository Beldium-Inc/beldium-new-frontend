import { createFileRoute } from "@tanstack/react-router";

import { TripList } from "@/components/independent/workspace";

export const Route = createFileRoute("/independent/pickup")({
  head: () => ({
    meta: [
      { title: "Pickup and loading - Beldium Logistics Hub" },
      {
        name: "description",
        content: "Trips awaiting pickup, with loaded quantity, weighbridge and seal records.",
      },
    ],
  }),
  component: () => <TripList view="pickup" />,
});
