import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/warehousing/regulator/inspections")({
  head: () => ({
    meta: [
      { title: "Inspections | Beldium Regulatory Portal" },
      { name: "description", content: "Inspection programme across registered mineral warehouses with type, inspector, date, status and finding counts." },
      { property: "og:title", content: "Inspections | Beldium Regulatory Portal" },
      { property: "og:description", content: "Oversight of the partner's inspection programme." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegulatorInspections,
});

function RegulatorInspections() {
  const { inspections } = useDemo();
  return (
    <AppShell role="regulator" title="Inspection programme" subtitle="Read-only schedule and outcomes">
      <Panel title="Inspections" description="Overdue inspections are escalated to the partner automatically.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref</TableHead>
              <TableHead>Facility</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Inspector</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Findings</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inspections.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="text-sm font-medium text-primary">{i.id}</TableCell>
                <TableCell className="text-sm">{i.facility}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{i.type}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{i.inspector}</TableCell>
                <TableCell className="text-sm">{i.date}</TableCell>
                <TableCell className="text-sm">{i.findings}</TableCell>
                <TableCell><StatusPill tone={toneForStatus(i.status)}>{i.status}</StatusPill></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
