import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/processing/")({
  beforeLoad: () => {
    throw redirect({ to: "/processing/dashboard" });
  },
});
