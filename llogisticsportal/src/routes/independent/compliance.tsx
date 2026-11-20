import { createFileRoute } from "@tanstack/react-router";

import { Compliance } from "@/components/independent/workspace";

export const Route = createFileRoute("/independent/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance centre - Beldium Logistics Hub" },
      {
        name: "description",
        content:
          "Requirements, officer verification records and information requests for your operator record.",
      },
    ],
  }),
  component: Compliance,
});
