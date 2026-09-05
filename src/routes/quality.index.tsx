import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/quality/")({
  beforeLoad: () => {
    throw redirect({ to: "/quality/dashboard" });
  },
});
