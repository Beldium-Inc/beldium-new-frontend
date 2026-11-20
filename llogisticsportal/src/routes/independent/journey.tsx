import { createFileRoute } from "@tanstack/react-router";

import { TripList } from "@/components/independent/workspace";

export const Route = createFileRoute("/independent/journey")({
  head: () => ({
    meta: [
      { title: "Journey milestones - Beldium Logistics Hub" },
      { name: "description", content: "Timestamped milestones for your active trips." },
    ],
  }),
  component: () => <TripList view="journey" />,
});
