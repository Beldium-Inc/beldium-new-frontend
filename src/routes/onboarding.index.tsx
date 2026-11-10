import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/onboarding/")({
  validateSearch: (search: Record<string, unknown>): { invitation?: string } =>
    typeof search["invitation"] === "string" ? { invitation: search["invitation"] } : {},
  beforeLoad: ({ search }) => {
    // The invitation email links here with ?invitation=<token>.
    if (search.invitation) {
      throw redirect({ to: "/onboarding/invite", search: { token: search.invitation } });
    }
    throw redirect({ to: "/onboarding/sector" });
  },
});
