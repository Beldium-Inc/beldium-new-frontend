import { createFileRoute } from "@tanstack/react-router";

import { VerticalHome } from "@/lib/vertical-home";

export const Route = createFileRoute("/warehousing/")({
  component: () => <VerticalHome slug="warehousing" />,
});
