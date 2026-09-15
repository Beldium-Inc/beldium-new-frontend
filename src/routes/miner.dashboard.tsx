import { createFileRoute, Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stageLabel } from "@/lib/api/ecosystem";
import { PageHeader, StatCard } from "@/verticals/miner-hub/components";
import { useMinerHub, usd, tonnes } from "@/verticals/miner-hub/store";

export const Route = createFileRoute("/miner/dashboard")({ component: DashboardPage });

const severityTone: Record<string, string> = {
  high: "bg-danger/10 text-danger",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
};

function DashboardPage() {
  const { dashboard, isLoading } = useMinerHub();

  if (isLoading && !dashboard) {
    return <p className="text-sm text-muted-foreground">Loading dashboard…</p>;
  }
  if (!dashboard) {
    return <p className="text-sm text-muted-foreground">No dashboard data available.</p>;
  }

  const tiles = [
    { label: "Active RFQs", value: String(dashboard.active_rfqs) },
    { label: "Active supply commitments", value: String(dashboard.active_supply_commitments) },
    { label: "Aggregated to date", value: tonnes(dashboard.aggregated_to_date) },
    { label: "Available inventory", value: tonnes(dashboard.available_inventory) },
    { label: "In transit", value: tonnes(dashboard.in_transit) },
    { label: "In processing", value: tonnes(dashboard.in_processing) },
    { label: "Export ready", value: tonnes(dashboard.export_ready) },
    { label: "Outstanding payments", value: usd(dashboard.outstanding_payments) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description={
          dashboard.compliance_status !== null
            ? `Your organisation's live position across marketplace, supply chain and finance. Compliance status: ${dashboard.compliance_status}%.`
            : "Your organisation's live position across marketplace, supply chain and finance."
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <StatCard key={tile.label} label={tile.label} value={tile.value} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Action centre</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.action_centre_items.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing needs your attention.</p>
            )}
            {dashboard.action_centre_items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <Badge className={severityTone[item.severity]}>{item.severity}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.live_ecosystem_activity.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            )}
            {dashboard.live_ecosystem_activity.map((event) => (
              <div key={event.id} className="border-b border-border pb-2 text-sm last:border-0 last:pb-0">
                <p>{event.message}</p>
                <p className="text-xs text-muted-foreground">
                  <Link to="/miner/transactions" className="underline">
                    {event.reference}
                  </Link>{" "}
                  · {stageLabel(event.stage)} · {new Date(event.at).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
