import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/warehousing/regulator/inspections")({
  head: () => ({
    meta: [
      { title: "Inspections | Beldium Regulatory Portal" },
      { name: "description", content: "Inspection programme across registered mineral warehouses." },
    ],
  }),
  component: RegulatorInspections,
});

function RegulatorInspections() {
  const { state } = useDemo();
  return (
    <AppShell role="regulator" title="Inspection programme" subtitle="Read-only schedule and outcomes">
      <Panel title="Inspections" description="Overdue inspections are escalated to the partner automatically.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facility</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Inspector</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Next due</TableHead>
              <TableHead>Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.inspections.map((i) => {
              const f = state.facilities.find((x) => x.id === i.facility);
              return (
                <TableRow key={i.id}>
                  <TableCell className="text-sm font-medium text-primary">{f?.name ?? "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{i.inspection_type}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{i.inspector_name}</TableCell>
                  <TableCell className="text-sm">{i.inspected_on}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{i.next_due_on ?? "-"}</TableCell>
                  <TableCell><StatusPill tone={toneForStatus(i.outcome)}>{i.outcome}</StatusPill></TableCell>
                </TableRow>
              );
            })}
            {state.inspections.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No inspections recorded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
