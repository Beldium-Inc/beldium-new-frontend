import { createFileRoute } from "@tanstack/react-router";

import { VerticalHome } from "@/lib/vertical-home";

export const Route = createFileRoute("/export/")({
  component: () => <VerticalHome slug="export" />,
});
