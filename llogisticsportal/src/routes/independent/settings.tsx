import { createFileRoute } from "@tanstack/react-router";

import { Settings } from "@/components/independent/workspace";

export const Route = createFileRoute("/independent/settings")({
  head: () => ({
    meta: [
      { title: "Settings - Beldium Logistics Hub" },
      {
        name: "description",
        content: "Account details and workspace records for independent operators.",
      },
    ],
  }),
  component: Settings,
});
