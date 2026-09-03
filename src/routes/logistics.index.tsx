import { createFileRoute } from "@tanstack/react-router";

import { VerticalHome } from "@/lib/vertical-home";

export const Route = createFileRoute("/logistics/")({
  component: () => <VerticalHome slug="logistics" />,
});
