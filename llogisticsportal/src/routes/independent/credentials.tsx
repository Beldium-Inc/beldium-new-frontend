import { createFileRoute } from "@tanstack/react-router";

import { Credentials } from "@/components/independent/workspace";

export const Route = createFileRoute("/independent/credentials")({
  head: () => ({
    meta: [
      { title: "Driver credentials - Beldium Logistics Hub" },
      { name: "description", content: "Your driver's licence declaration and driver readiness." },
    ],
  }),
  component: Credentials,
});
