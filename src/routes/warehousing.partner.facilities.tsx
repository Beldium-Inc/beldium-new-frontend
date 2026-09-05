import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatCard, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { FACILITIES } from "@/verticals/warehousing/data";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, ShieldX, Warehouse } from "lucide-react";

export const Route = createFileRoute("/warehousing/partner/facilities")({
  head: () => ({
    meta: [
      { title: "Warehouse register | Beldium Compliance Partner" },
      { name: "description", content: "Register of supervised mineral warehouses with status, risk score, certificate expiry and utilisation." },
      { property: "og:title", content: "Warehouse register | Beldium Compliance Partner" },
      { property: "og:description", content: "Approved, conditional and suspended warehouses under supervision." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FacilitiesPage,
});

function FacilitiesPage() {
  const approved = FACILITIES.filter((f) => f.status === "Approved").length;
  const suspended = FACILITIES.filter((f) => f.status === "Suspended").length;
  const review = FACILITIES.filter((f) => f.status === "Under review").length;

  return (
    <AppShell role="partner" title="Warehouse register" subtitle="All facilities supervised by Beldium Compliance Partners">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total facilities" value={FACILITIES.length} icon={<Warehouse className="size-5" />} />
          <StatCard label="Approved" value={approved} tone="success" icon={<ShieldCheck className="size-5" />} />
          <StatCard label="Suspended" value={suspended} tone="danger" icon={<ShieldX className="size-5" />} />
          <StatCard label="Under review" value={review} tone="warning" icon={<Warehouse className="size-5" />} />
        </div>

        <Panel title="Facility register" description="Certificate status, last inspection and current utilisation.">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Certificate expiry</TableHead>
                <TableHead>Last inspection</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead className="w-48">Utilisation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FACILITIES.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.id} · {f.capacity.toLocaleString()} t</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{f.company}</TableCell>
                  <TableCell className="text-sm">{f.state}</TableCell>
                  <TableCell>
                    <StatusPill tone={toneForStatus(f.status)}>{f.status}</StatusPill>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{f.certExpiry}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{f.lastInspection}</TableCell>
                  <TableCell className="font-heading font-semibold">{f.risk}</TableCell>
                  <TableCell>
                    <Progress value={f.utilisation} className="h-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">{f.utilisation}% of capacity</p>
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
