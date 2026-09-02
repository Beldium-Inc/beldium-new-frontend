import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Panel, StatusPill, toneForStatus } from "@/components/compliance-ui";
import { useDemo } from "@/lib/demo/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/regulator/incidents")({
  head: () => ({
    meta: [
      { title: "Incidents & non-conformities | Beldium Regulatory Portal" },
      { name: "description", content: "Operator-reported incidents and open non-conformities across registered mineral warehouses." },
      { property: "og:title", content: "Incidents & non-conformities | Beldium Regulatory Portal" },
      { property: "og:description", content: "Oversight of safety, environmental and security events." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegulatorIncidents,
});

function RegulatorIncidents() {
  const { incidents, nonConformities } = useDemo();
  return (
    <AppShell role="regulator" title="Incidents & non-conformities" subtitle="Read-only oversight feed">
      <div className="space-y-6">
        <Panel title="Reported incidents" description="Submitted by warehouse operators.">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Incident</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="text-sm font-medium text-primary">{i.id}</TableCell>
                  <TableCell className="max-w-96 text-sm">{i.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{i.category}</TableCell>
                  <TableCell><StatusPill tone={toneForStatus(i.severity)}>{i.severity}</StatusPill></TableCell>
                  <TableCell className="text-sm">{i.date}</TableCell>
                  <TableCell><StatusPill tone={toneForStatus(i.status)}>{i.status}</StatusPill></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>

        <Panel title="Non-conformities" description="Raised by the compliance partner during review or inspection.">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Finding</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nonConformities.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="text-sm font-medium text-primary">{n.id}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{n.facility}</TableCell>
                  <TableCell className="max-w-96 text-sm">{n.title}</TableCell>
                  <TableCell><StatusPill tone={toneForStatus(n.severity)}>{n.severity}</StatusPill></TableCell>
                  <TableCell className="text-sm">{n.due}</TableCell>
                  <TableCell><StatusPill tone={toneForStatus(n.status)}>{n.status}</StatusPill></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      </div>
    </AppShell>
  );
}
