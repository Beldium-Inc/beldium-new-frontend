import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatCard, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { labelStatus } from "@/verticals/warehousing/data";
import { useDemo } from "@/verticals/warehousing/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BadgeCheck, Building2, ClipboardCheck, Siren, TriangleAlert } from "lucide-react";

export const Route = createFileRoute("/warehousing/regulator/")({
  head: () => ({
    meta: [
      { title: "Oversight dashboard | Beldium Regulatory Portal" },
      {
        name: "description",
        content: "Read-only regulatory oversight of registered mineral warehouses.",
      },
    ],
  }),
  component: RegulatorDashboard,
});

function RegulatorDashboard() {
  const { state, expiringDocuments } = useDemo();
  const approved = state.applications.filter((a) => a.status === "approved" || a.status === "conditionally_approved").length;
  const overdueInspections = state.inspections.filter((i) => i.next_due_on && i.next_due_on < new Date().toISOString().slice(0, 10)).length;
  const openAlerts = state.monitoringAlerts.filter((a) => !a.resolved_at);
  const criticalAlerts = openAlerts.filter((a) => a.severity === "critical");

  return (
    <AppShell role="regulator" title="National oversight" subtitle="Read-only view provided by Beldium Warehouse Compliance Partner">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Registered facilities" value={state.facilities.length} icon={<Building2 className="size-5" />} />
          <StatCard label="Approved warehouses" value={approved} tone="success" icon={<BadgeCheck className="size-5" />} />
          <StatCard label="Inspections tracked" value={state.inspections.length} tone="info" hint={`${overdueInspections} overdue`} icon={<ClipboardCheck className="size-5" />} />
          <StatCard label="Documents expiring" value={expiringDocuments.length} tone="warning" icon={<TriangleAlert className="size-5" />} />
        </div>

        <Panel
          title="Monitoring alerts"
          description="Live alerts raised across supervised warehouses."
          actions={<Link to="/warehousing/regulator/incidents" className="text-sm font-medium text-link hover:underline">View incidents</Link>}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Open alerts" value={openAlerts.length} tone="warning" icon={<Siren className="size-5" />} />
            <StatCard label="Critical" value={criticalAlerts.length} tone="danger" icon={<TriangleAlert className="size-5" />} />
          </div>
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openAlerts.slice(0, 6).map((a) => {
                const w = state.warehouses.find((x) => x.id === a.warehouse);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm font-medium text-primary">{w?.name ?? "-"}</TableCell>
                    <TableCell className="max-w-96 text-sm">{a.message}</TableCell>
                    <TableCell><StatusPill tone={toneForStatus(a.severity)}>{a.severity}</StatusPill></TableCell>
                    <TableCell><StatusPill tone="warning">Open</StatusPill></TableCell>
                  </TableRow>
                );
              })}
              {openAlerts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    No open monitoring alerts.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Panel>

        <Panel
          title="Registered facilities"
          description="Status is maintained by the compliance partner."
          actions={<Link to="/warehousing/regulator/facilities" className="text-sm font-medium text-link hover:underline">View register</Link>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.facilities.slice(0, 8).map((f) => {
                const w = state.warehouses.find((x) => x.id === f.warehouse);
                const application = state.applications.find((a) => a.warehouse === f.warehouse);
                return (
                  <TableRow key={f.id}>
                    <TableCell className="text-sm font-medium text-primary">{f.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{w?.name}</TableCell>
                    <TableCell className="text-sm">{f.state}</TableCell>
                    <TableCell><StatusPill tone={toneForStatus(application?.status ?? "not_started")}>{labelStatus(application?.status ?? "not_started")}</StatusPill></TableCell>
                  </TableRow>
                );
              })}
              {state.facilities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    No facilities registered.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Panel>
      </div>
    </AppShell>
  );
}
