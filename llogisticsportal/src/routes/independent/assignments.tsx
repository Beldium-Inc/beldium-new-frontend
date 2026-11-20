import { createFileRoute } from "@tanstack/react-router";

import { Assignments } from "@/components/independent/workspace";

export const Route = createFileRoute("/independent/assignments")({
  head: () => ({
    meta: [
      { title: "Available assignments - Beldium Logistics Hub" },
      {
        name: "description",
        content: "Transport openings with the eligibility checks that apply to you.",
      },
    ],
  }),
  component: Assignments,
});
