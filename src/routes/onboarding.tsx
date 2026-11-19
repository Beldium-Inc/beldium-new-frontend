import { createFileRoute, Outlet } from "@tanstack/react-router";

import { OnboardingProvider } from "@/lib/onboarding/store";
import { siteTitle } from "@/lib/site-title";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({
    meta: [
      { title: siteTitle("Create your account | Beldium Compliance") },
      {
        name: "description",
        content:
          "Register your organisation, inspection body, practice or oversight account across any of the seven Beldium compliance sectors.",
      },
      { property: "og:title", content: siteTitle("Create your account | Beldium Compliance") },
      {
        property: "og:description",
        content: "Sector-based onboarding for the Beldium compliance platform.",
      },
    ],
  }),
  component: OnboardingLayout,
});

function OnboardingLayout() {
  // Onboarding state is only needed inside this flow, so the provider is
  // mounted here rather than at the root alongside the session.
  return (
    <OnboardingProvider>
      <Outlet />
    </OnboardingProvider>
  );
}
