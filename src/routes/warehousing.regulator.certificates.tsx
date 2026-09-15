import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/warehousing/regulator/certificates")({
  head: () => ({
    meta: [
      { title: "Certificates | Beldium Regulatory Portal" },
      { name: "description", content: "Warehousing certificates issued to registered facilities and their current standing." },
    ],
  }),
  component: RegulatorCertificates,
});

function RegulatorCertificates() {
  const { state } = useDemo();
  return (
    <AppShell role="regulator" title="Certificates" subtitle="Issued and maintained by Beldium Warehouse Compliance Partner">
      <Panel title="Certificate register" description="A suspended or expired certificate blocks new stock intake at the facility.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Warehouse</TableHead>
              <TableHead>Facility</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.certificates.map((c) => {
              const w = state.warehouses.find((x) => x.id === c.warehouse);
              const f = state.facilities.find((x) => x.id === c.facility);
              return (
                <TableRow key={c.id}>
                  <TableCell className="text-sm font-medium text-primary">{w?.name ?? "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{f?.name ?? "-"}</TableCell>
                  <TableCell className="text-sm">{c.scope || "-"}</TableCell>
                  <TableCell className="text-sm">{c.issued_on}</TableCell>
                  <TableCell className="text-sm">{c.expires_on}</TableCell>
                  <TableCell><StatusPill tone={c.is_expiring ? "warning" : toneForStatus(c.status)}>{c.status}</StatusPill></TableCell>
                </TableRow>
              );
            })}
            {state.certificates.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No certificates issued yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
