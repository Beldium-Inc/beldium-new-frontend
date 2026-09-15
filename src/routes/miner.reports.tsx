import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMineSites } from "@/lib/api/mining-queries";
import { useEcosystemDashboard } from "@/lib/api/ecosystem-queries";
import { tonnes, usd } from "@/verticals/miner-hub/store";

export const Route = createFileRoute("/miner/reports")({ component: ReportsPage });

function ReportsPage() {
  const sitesQuery = useMineSites();
  const dashboardQuery = useEcosystemDashboard();
  const site = sitesQuery.data?.results?.[0];
  const d = dashboardQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Summary of site, marketplace and finance activity to date.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Site summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border text-sm">
              {[
                ["Site", site?.name ?? "N/A"],
                ["Compliance score", site ? `${site.compliance_score}%` : "N/A"],
                ["Open non-conformities", site ? String(site.open_non_conformities) : "N/A"],
                ["Risk rating", site?.risk ?? "N/A"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Marketplace & finance summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border text-sm">
              {[
                ["Aggregated to date", d ? tonnes(d.aggregated_to_date) : "N/A"],
                ["Active transactions", d ? String(d.active_transactions) : "N/A"],
                ["Export ready", d ? tonnes(d.export_ready) : "N/A"],
                ["Outstanding payments", d ? usd(d.outstanding_payments) : "N/A"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
