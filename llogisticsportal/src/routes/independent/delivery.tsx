import { createFileRoute } from "@tanstack/react-router";

import { TripList } from "@/components/independent/workspace";

export const Route = createFileRoute("/independent/delivery")({
  head: () => ({
    meta: [
      { title: "Proof of delivery - Beldium Logistics Hub" },
      {
        name: "description",
        content: "Delivery evidence and receiving-party declarations for your trips.",
      },
    ],
  }),
  component: () => <TripList view="delivery" />,
});
