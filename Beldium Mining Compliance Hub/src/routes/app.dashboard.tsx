import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/prototype/store";
import { PartnerDashboard } from "@/components/app/dashboards/PartnerDashboard";
import { MinerDashboard } from "@/components/app/dashboards/MinerDashboard";
import { RegulatorDashboard } from "@/components/app/dashboards/RegulatorDashboard";

export const Route = createFileRoute("/app/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { role } = useStore();
  if (role === "miner") return <MinerDashboard />;
  if (role === "regulator") return <RegulatorDashboard />;
  return <PartnerDashboard />;
}
