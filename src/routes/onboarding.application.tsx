import { createFileRoute } from "@tanstack/react-router";
import { OrgApplicationFlow } from "@/components/onboarding/OrgApplicationFlow";
import { RegulatorApplicationFlow } from "@/components/onboarding/RegulatorApplicationFlow";
import { ProfessionalApplicationFlow } from "@/components/onboarding/ProfessionalApplicationFlow";
import { QualityOrgApplicationFlow } from "@/components/onboarding/QualityOrgApplicationFlow";
import { QualityProfessionalApplicationFlow } from "@/components/onboarding/QualityProfessionalApplicationFlow";
import { useOnboarding } from "@/lib/onboarding/store";

export const Route = createFileRoute("/onboarding/application")({
  component: ApplicationPage,
  head: () => ({
    meta: [
      { title: "Compliance Application | Beldium Compliance" },
      {
        name: "description",
        content: "Complete your Beldium compliance application: organisation details, services, credentials, personnel and declarations.",
      },
      { property: "og:title", content: "Compliance Application | Beldium Compliance" },
      { property: "og:description", content: "Register as an approved Beldium compliance partner or professional." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ApplicationPage() {
  const { role, sector } = useOnboarding();
  if (role === "independent") return <ProfessionalApplicationFlow />;
  if (role === "regulator-org" || role === "regulator-officer") return <RegulatorApplicationFlow />;
  if (sector === "quality") {
    if (role === "compliance-officer") return <QualityProfessionalApplicationFlow />;
    return <QualityOrgApplicationFlow />;
  }
  return <OrgApplicationFlow />;
}
