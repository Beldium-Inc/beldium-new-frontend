import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DemoDataBanner, Panel, StatCard, StatusPill, toneForStatus } from "@/components/compliance-ui";
import { CERTIFICATES, FACILITIES } from "@/lib/demo/data";
import { useDemo } from "@/lib/demo/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BadgeCheck, Building2, ClipboardCheck, TriangleAlert } from "lucide-react";

export const Route = createFileRoute("/regulator/")({
  head: () => ({
    meta: [
      { title: "Oversight dashboard | Beldium Regulatory Portal" },
      { name: "description", content: "Read-only regulatory oversight of registered mineral warehouses: statuses, certificates, inspections, incidents and alerts." },
      { property: "og:title", content: "Oversight dashboard | Beldium Regulatory Portal" },
      { property: "og:description", content: "National view of warehouse compliance across Nigeria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegulatorDashboard,
});

function RegulatorDashboard() {
  const { alerts, inspections, incidents } = useDemo();
  const approved = FACILITIES.filter((f) => f.status === "Approved").length;
  const suspended = FACILITIES.filter((f) => f.status === "Suspended").length;

  return (
    <AppShell role="regulator" title="National oversight" subtitle="Read-only view provided by Beldium Warehouse Compliance Partner">
      <div className="space-y-6">
        <DemoDataBanner />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Registered facilities" value={FACILITIES.length} hint="Across 6 states" icon={<Building2 className="size-5" />} />
          <StatCard label="Approved" value={approved} tone="success" hint={`${suspended} suspended`} icon={<BadgeCheck className="size-5" />} />
          <StatCard label="Inspections this quarter" value={inspections.length} tone="info" hint={`${inspections.filter((i) => i.status === "Overdue").length} overdue`} icon={<ClipboardCheck className="size-5" />} />
          <StatCard label="Open alerts" value={alerts.filter((a) => a.severity !== "info").length} tone="warning" hint="Critical and warning severity" icon={<TriangleAlert className="size-5" />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel className="xl:col-span-2" title="Registered facilities" description="Status is maintained by the compliance partner." actions={
            <Link to="/regulator/facilities" className="text-sm font-medium text-link hover:underline">View register</Link>
          }>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Facility</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Certificate expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FACILITIES.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="text-sm font-medium text-primary">{f.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.company}</TableCell>
                    <TableCell className="text-sm">{f.state}</TableCell>
                    <TableCell><StatusPill tone={toneForStatus(f.status)}>{f.status}</StatusPill></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.certExpiry}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>

          <Panel title="Alerts" description="Continuous monitoring signals shared with the regulator.">
            <ul className="space-y-3">
              {alerts.slice(0, 6).map((a) => (
                <li key={a.id} className="rounded-xl bg-muted/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{a.raised}</span>
                    <StatusPill tone={a.severity === "critical" ? "danger" : a.severity === "warning" ? "warning" : "info"}>
                      {a.severity}
                    </StatusPill>
                  </div>
                  <p className="mt-1.5 text-sm text-foreground">{a.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{a.facility}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Certificates" description="Issued registration certificates and scope." actions={
            <Link to="/regulator/certificates" className="text-sm font-medium text-link hover:underline">All certificates</Link>
          }>
            <ul className="space-y-3">
              {CERTIFICATES.slice(0, 4).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.facility}</p>
                    <p className="text-xs text-muted-foreground">{c.id} · expires {c.expires}</p>
                  </div>
                  <StatusPill tone={toneForStatus(c.status)}>{c.status}</StatusPill>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Recent incidents" description="Operator-reported events across the register." actions={
            <Link to="/regulator/incidents" className="text-sm font-medium text-link hover:underline">All incidents</Link>
          }>
            <ul className="space-y-3">
              {incidents.slice(0, 4).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{i.title}</p>
                    <p className="text-xs text-muted-foreground">{i.id} · {i.date} · {i.category}</p>
                  </div>
                  <StatusPill tone={toneForStatus(i.severity)}>{i.severity}</StatusPill>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
