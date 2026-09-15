import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatCard, StatusPill } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, FileWarning, ShieldAlert } from "lucide-react";
import { WAREHOUSING_DOMAIN_LABELS } from "@/lib/api/warehousing";

export const Route = createFileRoute("/warehousing/regulator/conditions")({
  head: () => ({
    meta: [
      { title: "Conditions | Beldium Regulatory Portal" },
      { name: "description", content: "Read-only oversight of admission conditions attached to warehouse compliance decisions." },
    ],
  }),
  component: RegulatorConditions,
});

function RegulatorConditions() {
  const { state } = useDemo();
  const rows = state.applications.flatMap((a) => a.conditions.map((c) => ({ condition: c, application: a })));
  const outstanding = rows.filter((r) => !r.condition.cleared_at);
  const overdue = outstanding.filter((r) => r.condition.is_overdue);

  return (
    <AppShell role="regulator" title="Conditions" subtitle="Read-only view of corrective conditions attached to admission decisions">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Outstanding" value={outstanding.length} tone="warning" icon={<FileWarning className="size-5" />} />
          <StatCard label="Overdue" value={overdue.length} tone="danger" icon={<ShieldAlert className="size-5" />} />
          <StatCard label="Cleared" value={rows.length - outstanding.length} tone="success" icon={<CheckCircle2 className="size-5" />} />
        </div>

        <Panel title="Condition register" description="Maintained by the compliance partner; clearance happens on their side.">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ condition: c, application: a }) => {
                const w = state.warehouses.find((x) => x.id === a.warehouse);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm font-medium text-primary">{w?.name ?? "-"}</TableCell>
                    <TableCell className="max-w-72 text-sm">{c.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.domain ? WAREHOUSING_DOMAIN_LABELS[c.domain] : "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.due_date}</TableCell>
                    <TableCell>
                      <StatusPill tone={c.cleared_at ? "success" : c.is_overdue ? "danger" : "warning"}>
                        {c.cleared_at ? "Cleared" : c.is_overdue ? "Overdue" : "Outstanding"}
                      </StatusPill>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No conditions raised.
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
