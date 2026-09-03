import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/mining/")({
  beforeLoad: () => {
    throw redirect({ to: "/mining/dashboard" });
  },
});
