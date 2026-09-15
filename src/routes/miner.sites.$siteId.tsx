import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMineSite, useSiteActivity } from "@/lib/api/mining-queries";

export const Route = createFileRoute("/miner/sites/$siteId")({ component: SiteDetailPage });

function SiteDetailPage() {
  const { siteId } = Route.useParams();
  const { data: site, isLoading } = useMineSite(siteId);
  const { data: activity } = useSiteActivity(siteId);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!site) return <p className="text-sm text-muted-foreground">Site not found.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{site.name}</h1>
        <p className="text-sm text-muted-foreground">
          {site.code} · {site.mineral} · {site.lga}, {site.state} State
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Status", site.status.replace(/_/g, " ")],
          ["Risk", site.risk],
          ["Compliance", `${site.compliance_score}%`],
          ["Open non-conformities", String(site.open_non_conformities)],
          ["Capacity (tpa)", site.capacity_tpa ?? "N/A"],
          ["Current (tpa)", site.current_tpa ?? "N/A"],
          ["Workforce", site.workforce ?? "N/A"],
          ["Last inspection", site.last_inspection_on ?? "N/A"],
        ].map(([k, v]) => (
          <Card key={k}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="mt-1 font-display text-lg font-semibold">{String(v)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evidence sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {site.sections.length === 0 && <p className="text-sm text-muted-foreground">No sections yet.</p>}
          {site.sections.map((sec) => (
            <div key={sec.key} className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0">
              <span>{sec.label}</span>
              <Badge variant="outline">{sec.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(!activity || activity.results.length === 0) && (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          )}
          {activity?.results.map((ev) => (
            <div key={ev.id} className="border-b border-border pb-2 text-sm last:border-0 last:pb-0">
              <p>{ev.action}: {ev.detail}</p>
              <p className="text-xs text-muted-foreground">{ev.actor} · {new Date(ev.created_at).toLocaleString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
