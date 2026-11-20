import { createFileRoute } from "@tanstack/react-router";

import { Notifications } from "@/components/independent/workspace";

export const Route = createFileRoute("/independent/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications - Beldium Logistics Hub" },
      { name: "description", content: "Application, information request and trip updates." },
    ],
  }),
  component: Notifications,
});
