import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/compliance-ui";
import { useDemo } from "@/lib/demo/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/partner/audit")({
  head: () => ({
    meta: [
      { title: "Audit history | Beldium Compliance Partner" },
      { name: "description", content: "Immutable audit trail of reviewer decisions, inspections ordered, non-conformities raised and alerts acknowledged." },
      { property: "og:title", content: "Audit history | Beldium Compliance Partner" },
      { property: "og:description", content: "Every compliance action recorded with actor and timestamp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const { audit } = useDemo();
  return (
    <AppShell role="partner" title="Audit history" subtitle="Every action taken in this workspace is recorded">
      <Panel title={`${audit.length} recorded events`} description="Newest first. Actions you take in this demo are appended live.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audit.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{a.timestamp}</TableCell>
                <TableCell className="text-sm font-medium">{a.actor}</TableCell>
                <TableCell className="text-sm">{a.action}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{a.entity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
