import { createFileRoute } from "@tanstack/react-router";
import { MinerDashboard } from "@/verticals/miner/components/dashboards/MinerDashboard";

export const Route = createFileRoute("/miner/dashboard")({ component: MinerDashboard });
