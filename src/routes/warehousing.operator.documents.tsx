import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { OPERATOR_DOCUMENTS } from "@/verticals/warehousing/data";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Upload } from "lucide-react";

export const Route = createFileRoute("/warehousing/operator/documents")({
  head: () => ({
    meta: [
      { title: "Document library | Beldium Warehouse Operator" },
      { name: "description", content: "Compliance document library with permits, certificates, insurance schedules and renewal status for the warehouse." },
      { property: "og:title", content: "Document library | Beldium Warehouse Operator" },
      { property: "og:description", content: "Keep permits and certificates current for Beldium supervision." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  return (
    <AppShell
      role="operator"
      title="Document library"
      subtitle="Everything Beldium can request during review or surveillance"
      actions={
        <Button
          className="rounded-xl bg-link text-link-foreground hover:bg-link/90"
          onClick={() => toast.success("Upload queued", { description: "Demo only: no file is stored in this prototype." })}
        >
          <Upload className="mr-2 size-4" /> Upload document
        </Button>
      }
    >
      <Panel title="Registered documents" description="Renewal reminders are sent 120, 60 and 30 days before expiry.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {OPERATOR_DOCUMENTS.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium text-primary">{d.id}</TableCell>
                <TableCell className="text-sm">
                  <span className="inline-flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    {d.name}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.category}</TableCell>
                <TableCell className="text-sm">{d.expires}</TableCell>
                <TableCell>
                  <StatusPill tone={toneForStatus(d.status)}>{d.status}</StatusPill>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    className="h-8 rounded-lg text-xs"
                    onClick={() => toast.info(`${d.name}`, { description: "Sample document preview is not included in this prototype." })}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
