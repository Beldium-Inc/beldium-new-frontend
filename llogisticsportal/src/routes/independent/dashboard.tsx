import { createFileRoute } from "@tanstack/react-router";

import { Dashboard } from "@/components/independent/workspace";

export const Route = createFileRoute("/independent/dashboard")({
  head: () => ({
    meta: [
      { title: "Independent operator dashboard - Beldium Logistics Hub" },
      {
        name: "description",
        content:
          "Your account, compliance status, readiness and active trips as an independent transport operator.",
      },
    ],
  }),
  component: Dashboard,
});
