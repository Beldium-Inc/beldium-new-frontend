import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Panel, StatCard, StatusPill, toneForStatus } from "@/components/compliance-ui";
import { useDemo } from "@/lib/demo/store";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarClock, ClipboardCheck, TriangleAlert } from "lucide-react";

export const Route = createFileRoute("/partner/inspections")({
  head: () => ({
    meta: [
      { title: "Inspections | Beldium Compliance Partner" },
      { name: "description", content: "Scheduled, completed and overdue warehouse inspections with assigned Beldium inspectors and findings counts." },
      { property: "og:title", content: "Inspections | Beldium Compliance Partner" },
      { property: "og:description", content: "Inspection programme across supervised mineral warehouses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InspectionsPage,
});

function InspectionsPage() {
  const { inspections } = useDemo();

  return (
    <AppShell role="partner" title="Inspections" subtitle="Site visit programme and inspector assignments">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Scheduled" value={inspections.filter((i) => i.status === "Scheduled").length} tone="info" icon={<CalendarClock className="size-5" />} />
          <StatCard label="Completed (2026)" value={inspections.filter((i) => i.status === "Completed").length} tone="success" icon={<ClipboardCheck className="size-5" />} />
          <StatCard label="Overdue" value={inspections.filter((i) => i.status === "Overdue").length} tone="danger" icon={<TriangleAlert className="size-5" />} />
        </div>

        <Panel title="Inspection register" description="Ordered from the review workspace or by the surveillance schedule.">
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
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium text-primary">{i.id}</TableCell>
                  <TableCell className="text-sm">{i.facility}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{i.type}</TableCell>
                  <TableCell className="text-sm">{i.inspector}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{i.date}</TableCell>
                  <TableCell className="font-heading font-semibold">{i.findings}</TableCell>
                  <TableCell>
                    <StatusPill tone={toneForStatus(i.status)}>{i.status}</StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      className="h-8 rounded-lg text-xs"
                      onClick={() =>
                        toast.info(`Inspection ${i.id}`, {
                          description: `${i.type} at ${i.facility} — ${i.inspector}, ${i.findings} finding(s). Sample report, not a live document.`,
                        })
                      }
                    >
                      View report
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      </div>
    </AppShell>
  );
}
