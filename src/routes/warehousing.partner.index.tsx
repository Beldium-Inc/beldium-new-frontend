import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ClipboardCheck, FileText, FileWarning, Gauge, ShieldCheck, Warehouse } from "lucide-react";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatCard, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { labelStatus } from "@/verticals/warehousing/data";
import { useDemo } from "@/verticals/warehousing/store";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/warehousing/partner/")({
  head: () => ({
    meta: [
      { title: "Reviewer dashboard | Beldium Compliance Partner" },
      {
        name: "description",
        content: "Compliance partner dashboard: applications, pending reviews, facilities, expiring documents and risk.",
      },
    ],
  }),
  component: PartnerDashboard,
});

const DECIDED = new Set(["approved", "conditionally_approved", "rejected"]);

function PartnerDashboard() {
  const { state, expiringDocuments, audit } = useDemo();
  const pending = state.applications.filter((a) => !DECIDED.has(a.status));
  const approved = state.applications.filter((a) => a.status === "approved" || a.status === "conditionally_approved").length;
  const highRisk = state.applications.filter((a) => a.risk.risk_band === "high").length;

  return (
    <AppShell
      role="partner"
      title="Reviewer dashboard"
      subtitle="Beldium Compliance Partners · warehousing portfolio"
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Applications in portfolio" value={state.applications.length} icon={<FileText className="size-5" />} tone="info" />
          <StatCard label="Pending my review" value={pending.length} icon={<ClipboardCheck className="size-5" />} tone="warning" />
          <StatCard label="Approved warehouses" value={approved} icon={<ShieldCheck className="size-5" />} tone="success" />
          <StatCard label="High risk" value={highRisk} icon={<FileWarning className="size-5" />} tone="danger" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Registered warehouses" value={state.warehouses.length} icon={<Warehouse className="size-5" />} />
          <StatCard label="Facilities" value={state.facilities.length} icon={<Warehouse className="size-5" />} />
          <StatCard label="Documents expiring soon" value={expiringDocuments.length} icon={<AlertTriangle className="size-5" />} tone="warning" />
          <StatCard label="Inspections tracked" value={state.inspections.length} icon={<Gauge className="size-5" />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel
            className="xl:col-span-2"
            title="Applications awaiting decision"
            description="Ordered as returned by the register."
            actions={
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/warehousing/partner/applications">View all</Link>
              </Button>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.slice(0, 5).map((a) => {
                  const w = state.warehouses.find((x) => x.id === a.warehouse);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium text-primary">{w?.name ?? a.warehouse}</TableCell>
                      <TableCell className="font-heading font-semibold">{a.risk.compliance_score}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.progress.complete}/{a.progress.total}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={toneForStatus(a.status)}>{labelStatus(a.status)}</StatusPill>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to="/warehousing/partner/applications/$id"
                          params={{ id: a.warehouse }}
                          className="text-sm font-medium text-link hover:underline"
                        >
                          Review
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {pending.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      Nothing pending.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Panel>

          <Panel title="Expiring documents" description="Evidence approaching expiry across the register.">
            <ul className="space-y-3">
              {expiringDocuments.slice(0, 6).map((d) => (
                <li key={d.id} className="flex items-start justify-between gap-3 rounded-xl bg-muted/40 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{d.issuer || "-"}</p>
                  </div>
                  <StatusPill tone={d.validity === "expired" ? "danger" : "warning"}>{d.expires_on}</StatusPill>
                </li>
              ))}
              {expiringDocuments.length === 0 && <li className="text-sm text-muted-foreground">Nothing expiring.</li>}
            </ul>
          </Panel>
        </div>

        <Panel title="Recent audit history" description="Every reviewer action is written to the trail.">
          <ol className="space-y-3">
            {(audit?.events ?? []).slice(0, 8).map((a) => (
              <li key={a.id} className="border-l-2 border-secondary pl-3">
                <p className="text-sm text-foreground">{a.event_type}</p>
                <p className="text-xs text-muted-foreground">{a.created_at}</p>
              </li>
            ))}
            {(audit?.events?.length ?? 0) === 0 && <li className="text-sm text-muted-foreground">No activity yet.</li>}
          </ol>
        </Panel>
      </div>
    </AppShell>
  );
}
