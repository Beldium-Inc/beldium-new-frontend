import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/prototype/store";
import { useOnboarding } from "@/lib/onboarding/store";
import { PartnerDashboard } from "@/components/app/dashboards/PartnerDashboard";
import { MinerDashboard } from "@/components/app/dashboards/MinerDashboard";
import { RegulatorDashboard } from "@/components/app/dashboards/RegulatorDashboard";
import { ApplicationReviewDashboard } from "@/components/app/dashboards/ApplicationReviewDashboard";

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Compliance Dashboard · Beldium Mining Compliance" },
      { name: "description", content: "Track application status, review activity and mining compliance operations in Beldium." },
      { property: "og:title", content: "Compliance Dashboard · Beldium Mining Compliance" },
      { property: "og:description", content: "Application status, review activity and compliance operations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function DashboardPage() {
  const { role } = useStore();
  const onboarding = useOnboarding();
  const applicantRole =
    onboarding.role === "compliance-org" ||
    onboarding.role === "independent" ||
    onboarding.role === "regulator-org" ||
    onboarding.role === "regulator-officer";
  const inReviewMode = applicantRole && onboarding.submittedAt !== null && onboarding.verification !== "Verified";

  if (inReviewMode) return <ApplicationReviewDashboard />;
  if (role === "regulator") return <RegulatorDashboard />;
  if (role === "miner") return <MinerDashboard />;
  return <PartnerDashboard />;
}
