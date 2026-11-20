import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/independent/")({
  beforeLoad: () => {
    throw redirect({ to: "/independent/dashboard" });
  },
});
