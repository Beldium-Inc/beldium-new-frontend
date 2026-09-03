import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/verticals/mining/store";
import { PartnerDashboard } from "@/verticals/mining/components/dashboards/PartnerDashboard";
import { MinerDashboard } from "@/verticals/mining/components/dashboards/MinerDashboard";
import { RegulatorDashboard } from "@/verticals/mining/components/dashboards/RegulatorDashboard";

export const Route = createFileRoute("/mining/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { role } = useStore();
  if (role === "miner") return <MinerDashboard />;
  if (role === "regulator") return <RegulatorDashboard />;
  return <PartnerDashboard />;
}
