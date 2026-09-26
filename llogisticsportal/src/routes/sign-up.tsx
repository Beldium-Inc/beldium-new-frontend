import { createFileRoute, redirect } from "@tanstack/react-router";

// Old path, kept so existing links land on the Miner Hub-style route.
export const Route = createFileRoute("/sign-up")({
  beforeLoad: () => {
    throw redirect({ to: "/signup" });
  },
});
