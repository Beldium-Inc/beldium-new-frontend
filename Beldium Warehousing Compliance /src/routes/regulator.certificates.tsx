import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Panel, StatusPill, toneForStatus } from "@/components/compliance-ui";
import { CERTIFICATES } from "@/lib/demo/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/regulator/certificates")({
  head: () => ({
    meta: [
      { title: "Certificates | Beldium Regulatory Portal" },
      { name: "description", content: "Registration certificates issued to mineral warehouses with scope, issue date, expiry and current standing." },
      { property: "og:title", content: "Certificates | Beldium Regulatory Portal" },
      { property: "og:description", content: "Issued warehouse registration certificates and their scope." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegulatorCertificates,
});

function RegulatorCertificates() {
  return (
    <AppShell role="regulator" title="Registration certificates" subtitle="Issued and maintained by Beldium Warehouse Compliance Partner">
      <Panel title="Certificate register" description="Suspended certificates block all stock releases at the facility.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Certificate</TableHead>
              <TableHead>Facility</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CERTIFICATES.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-sm font-medium text-primary">{c.id}</TableCell>
                <TableCell className="text-sm">{c.facility}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.company}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.scope}</TableCell>
                <TableCell className="text-sm">{c.issued}</TableCell>
                <TableCell className="text-sm">{c.expires}</TableCell>
                <TableCell><StatusPill tone={toneForStatus(c.status)}>{c.status}</StatusPill></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
