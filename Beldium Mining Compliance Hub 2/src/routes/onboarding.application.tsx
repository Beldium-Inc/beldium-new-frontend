import { createFileRoute } from "@tanstack/react-router";
import { OrgApplicationFlow } from "@/components/onboarding/OrgApplicationFlow";
import { RegulatorApplicationFlow } from "@/components/onboarding/RegulatorApplicationFlow";
import { ProfessionalApplicationFlow } from "@/components/onboarding/ProfessionalApplicationFlow";
import { useOnboarding } from "@/lib/onboarding/store";

export const Route = createFileRoute("/onboarding/application")({
  component: ApplicationPage,
  head: () => ({
    meta: [
      { title: "Compliance Application · Beldium Mining Compliance" },
      {
        name: "description",
        content: "Complete your Beldium mining compliance application — organisation details, services, credentials, personnel and declarations.",
      },
      { property: "og:title", content: "Compliance Application · Beldium Mining Compliance" },
      { property: "og:description", content: "Register as an approved Beldium mining compliance partner or professional." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ApplicationPage() {
  const { role } = useOnboarding();
  if (role === "independent") return <ProfessionalApplicationFlow />;
  if (role === "regulator-org" || role === "regulator-officer") return <RegulatorApplicationFlow />;
  return <OrgApplicationFlow />;
}
