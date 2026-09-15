import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/warehousing/regulator/incidents")({
  head: () => ({
    meta: [
      { title: "Incidents | Beldium Regulatory Portal" },
      { name: "description", content: "Safety, environmental, security and stock-integrity incidents across registered warehouses." },
    ],
  }),
  component: RegulatorIncidents,
});

function RegulatorIncidents() {
  const { state } = useDemo();
  return (
    <AppShell role="regulator" title="Incidents" subtitle="Read-only oversight feed">
      <Panel title="Incident register" description="Reported by warehouse operators against their registered facilities.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Warehouse</TableHead>
              <TableHead>Incident</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Occurred</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.incidents.map((i) => {
              const w = state.warehouses.find((x) => x.id === i.warehouse);
              return (
                <TableRow key={i.id}>
                  <TableCell className="text-sm font-medium text-primary">{w?.name ?? "-"}</TableCell>
                  <TableCell className="max-w-96 text-sm">{i.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{i.category.replace("_", " ")}</TableCell>
                  <TableCell><StatusPill tone={toneForStatus(i.severity)}>{i.severity}</StatusPill></TableCell>
                  <TableCell className="text-sm">{i.occurred_on}</TableCell>
                  <TableCell><StatusPill tone={toneForStatus(i.status)}>{i.status.replace("_", " ")}</StatusPill></TableCell>
                </TableRow>
              );
            })}
            {state.incidents.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No incidents reported.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
