import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/miner/")({
  beforeLoad: () => {
    throw redirect({ to: "/miner/dashboard" });
  },
});
