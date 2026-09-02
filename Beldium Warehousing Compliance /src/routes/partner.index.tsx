import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  ClipboardCheck,
  FileText,
  FileWarning,
  Gauge,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DemoDataBanner, Panel, StatCard, StatusPill, toneForStatus } from "@/components/compliance-ui";
import { EXPIRING_DOCS, FACILITIES, RISK_SCORE, labelStatus } from "@/lib/demo/data";
import { useDemo } from "@/lib/demo/store";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/partner/")({
  head: () => ({
    meta: [
      { title: "Reviewer dashboard | Beldium Compliance Partner" },
      {
        name: "description",
        content:
          "Compliance partner dashboard: applications, pending reviews, facilities, inspections, expiring documents, risk and non-conformities.",
      },
      { property: "og:title", content: "Reviewer dashboard | Beldium Compliance Partner" },
      { property: "og:description", content: "Warehouse compliance review control room." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PartnerDashboard,
});

function PartnerDashboard() {
  const { applications, nonConformities, inspections, alerts, acknowledged, audit } = useDemo();
  const pending = applications.filter((a) => a.status === "pending" || a.status === "info-requested");
  const openNCs = nonConformities.filter((n) => n.status !== "Closed");
  const approved = FACILITIES.filter((f) => f.status === "Approved").length;
  const suspended = FACILITIES.filter((f) => f.status === "Suspended").length;
  const liveAlerts = alerts.filter((a) => !acknowledged.includes(a.id));

  return (
    <AppShell
      role="partner"
      title="Reviewer dashboard"
      subtitle="Beldium Compliance Partners · Nigeria mineral warehousing portfolio"
      actions={
        <Button asChild className="rounded-xl bg-link text-link-foreground hover:bg-link/90">
          <Link to="/partner/applications/$id" params={{ id: "APP-2026-0147" }}>
            Open priority review
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <DemoDataBanner />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Applications in portfolio" value={applications.length} hint="6 companies, 5 states" icon={<FileText className="size-5" />} tone="info" />
          <StatCard label="Pending my review" value={pending.length} hint="SLA 28 days from submission" icon={<ClipboardCheck className="size-5" />} tone="warning" />
          <StatCard label="Approved warehouses" value={approved} hint={`${suspended} suspended`} icon={<ShieldCheck className="size-5" />} tone="success" />
          <StatCard label="Open non-conformities" value={openNCs.length} hint={`${openNCs.filter((n) => n.severity === "Critical").length} critical`} icon={<FileWarning className="size-5" />} tone="danger" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Registered facilities" value={FACILITIES.length} hint="Under Beldium supervision" icon={<Warehouse className="size-5" />} />
          <StatCard label="Inspections tracked" value={inspections.length} hint={`${inspections.filter((i) => i.status === "Scheduled").length} scheduled · ${inspections.filter((i) => i.status === "Overdue").length} overdue`} icon={<ClipboardCheck className="size-5" />} />
          <StatCard label="Documents expiring ≤120 days" value={EXPIRING_DOCS.length} hint="Across 5 facilities" icon={<AlertTriangle className="size-5" />} tone="warning" />
          <StatCard label="Priority risk score" value={`${RISK_SCORE}/100`} hint="APP-2026-0147 · Sahel Minerals" icon={<Gauge className="size-5" />} tone="success" />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel
            className="xl:col-span-2"
            title="Applications awaiting decision"
            description="Ordered by SLA due date. Open a file to work through the review sections."
            actions={
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/partner/applications">View all</Link>
              </Button>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Company / facility</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>SLA due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.slice(0, 5).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-primary">{a.id}</TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{a.company}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.facility} · {a.state}
                      </p>
                    </TableCell>
                    <TableCell className="font-heading font-semibold">{a.riskScore}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.slaDue}</TableCell>
                    <TableCell>
                      <StatusPill tone={toneForStatus(a.status)}>{labelStatus(a.status)}</StatusPill>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        to="/partner/applications/$id"
                        params={{ id: a.id }}
                        className="text-sm font-medium text-link hover:underline"
                      >
                        Review
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>

          <Panel
            title="Continuous monitoring alerts"
            description="Signals raised after approval across supervised facilities."
            actions={
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/partner/alerts">Manage</Link>
              </Button>
            }
          >
            <ul className="space-y-3">
              {liveAlerts.slice(0, 5).map((alert) => (
                <li key={alert.id} className="rounded-xl border border-border/70 bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <StatusPill tone={alert.severity === "critical" ? "danger" : alert.severity === "warning" ? "warning" : "info"}>
                      <Bell className="size-3" />
                      {alert.severity}
                    </StatusPill>
                    <span className="text-xs text-muted-foreground">{alert.raised}</span>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{alert.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{alert.facility}</p>
                </li>
              ))}
              {liveAlerts.length === 0 ? (
                <li className="text-sm text-muted-foreground">All alerts acknowledged.</li>
              ) : null}
            </ul>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel title="Expiring documents" description="Certificates and policies inside the 120-day window.">
            <ul className="space-y-3">
              {EXPIRING_DOCS.map((d) => (
                <li key={d.id} className="flex items-start justify-between gap-3 rounded-xl bg-muted/40 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.document}</p>
                    <p className="text-xs text-muted-foreground">{d.facility}</p>
                  </div>
                  <StatusPill tone={d.daysLeft <= 30 ? "danger" : "warning"}>{d.daysLeft} days</StatusPill>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Open non-conformities" description="Corrective actions tracked to closure.">
            <ul className="space-y-3">
              {openNCs.slice(0, 5).map((n) => (
                <li key={n.id} className="rounded-xl bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{n.id}</span>
                    <StatusPill tone={toneForStatus(n.severity)}>{n.severity}</StatusPill>
                  </div>
                  <p className="mt-1.5 text-sm text-foreground">{n.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.facility} · due {n.due}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Recent audit history" description="Every reviewer action is written to the trail.">
            <ol className="space-y-3">
              {audit.slice(0, 6).map((a) => (
                <li key={a.id} className="border-l-2 border-secondary pl-3">
                  <p className="text-sm text-foreground">{a.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.timestamp} · {a.actor}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
