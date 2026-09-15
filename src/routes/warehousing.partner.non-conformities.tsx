import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatCard, StatusPill } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, FileWarning, ShieldAlert } from "lucide-react";
import { WAREHOUSING_DOMAIN_LABELS } from "@/lib/api/warehousing";

export const Route = createFileRoute("/warehousing/partner/non-conformities")({
  head: () => ({
    meta: [
      { title: "Conditions | Beldium Compliance Partner" },
      { name: "description", content: "Outstanding admission conditions raised against warehouse applications." },
    ],
  }),
  component: ConditionsPage,
});

function ConditionsPage() {
  const { state, reviewCondition } = useDemo();
  const [note, setNote] = useState<Record<string, string>>({});

  const applicationsById = Object.fromEntries(state.applications.map((a) => [a.id, a]));
  const rows = state.applications.flatMap((a) =>
    a.conditions.map((c) => ({ condition: c, application: a })),
  );
  const outstanding = rows.filter((r) => !r.condition.cleared_at);
  const overdue = outstanding.filter((r) => r.condition.is_overdue);

  return (
    <AppShell role="partner" title="Conditions" subtitle="Corrective conditions attached to admission decisions">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Outstanding" value={outstanding.length} tone="warning" icon={<FileWarning className="size-5" />} />
          <StatCard label="Overdue" value={overdue.length} tone="danger" icon={<ShieldAlert className="size-5" />} />
          <StatCard label="Cleared" value={rows.length - outstanding.length} tone="success" icon={<CheckCircle2 className="size-5" />} />
        </div>

        <Panel title="Condition register">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ condition: c, application: a }) => {
                const w = state.warehouses.find((x) => x.id === applicationsById[a.id]?.warehouse);
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
                    <TableCell className="text-right">
                      {!c.cleared_at && (
                        <div className="flex justify-end gap-2">
                          <input
                            className="h-8 w-40 rounded-lg border border-input bg-background px-2 text-xs"
                            placeholder="Clearance note"
                            value={note[c.id] ?? ""}
                            onChange={(e) => setNote((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          />
                          <Button
                            variant="outline"
                            className="h-8 rounded-lg text-xs"
                            onClick={() => {
                              reviewCondition(c.id, note[c.id] || "Cleared with verified evidence.");
                              toast.success("Condition cleared");
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
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
