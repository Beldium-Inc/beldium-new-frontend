import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/warehousing/partner/audit")({
  head: () => ({
    meta: [
      { title: "Audit history | Beldium Compliance Partner" },
      { name: "description", content: "Audit trail of reviewer decisions across the warehousing register." },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const { audit } = useDemo();
  const events = audit?.events ?? [];
  return (
    <AppShell role="partner" title="Audit history" subtitle="Every action taken in this workspace is recorded">
      <Panel title={`${events.length} recorded events`} description="Newest first.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Event</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{a.created_at}</TableCell>
                <TableCell className="text-sm font-medium">{a.actor_id ?? "System"}</TableCell>
                <TableCell className="text-sm">{a.event_type}</TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                  No activity yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
