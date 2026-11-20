import { createFileRoute } from "@tanstack/react-router";

import { IndependentOnboarding } from "@/components/independent/onboarding";

export const Route = createFileRoute("/independent/onboarding")({
  head: () => ({
    meta: [
      { title: "Independent operator onboarding - Beldium Logistics Hub" },
      {
        name: "description",
        content:
          "Eight-step onboarding for independent transport operators: identity, profile, vehicles, credentials, scope, authorizations, evidence and review.",
      },
    ],
  }),
  component: IndependentOnboarding,
});
