import { createFileRoute } from "@tanstack/react-router";

import { Profile } from "@/components/independent/workspace";

export const Route = createFileRoute("/independent/profile")({
  head: () => ({
    meta: [
      { title: "My profile - Beldium Logistics Hub" },
      {
        name: "description",
        content: "Your declared identity, operator profile and operating scope.",
      },
    ],
  }),
  component: Profile,
});
