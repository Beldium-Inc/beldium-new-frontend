import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { DemoDataBanner, Panel, StatCard, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { EXPIRING_DOCS, FACILITY_PROFILE, OPERATOR_DOCUMENTS, STORAGE_HIERARCHY } from "@/verticals/warehousing/data";
import { useDemo } from "@/verticals/warehousing/store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Boxes, PackagePlus, ShieldCheck, Siren, Truck, Warehouse } from "lucide-react";

export const Route = createFileRoute("/warehousing/operator/")({
  head: () => ({
    meta: [
      { title: "Operations dashboard | Beldium Warehouse Operator" },
      { name: "description", content: "Warehouse operator dashboard: capacity, incoming shipments, inventory, pending releases, compliance status, expiring documents and incidents." },
      { property: "og:title", content: "Operations dashboard | Beldium Warehouse Operator" },
      { property: "og:description", content: "Daily control room for the Apapa Mineral Terminal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OperatorDashboard,
});

function OperatorDashboard() {
  const { batches, incoming, releases, incidents, nonConformities } = useDemo();
  const stored = batches.reduce((n, b) => n + b.tonnes, 0);
  const utilisation = Math.round((stored / 42000) * 100);
  const pendingReleases = releases.filter((r) => r.status === "Pending authorisation");
  const openIncidents = incidents.filter((i) => i.status !== "Closed");
  const openNCs = nonConformities.filter((n) => n.facility.startsWith("Apapa") && n.status !== "Closed");

  return (
    <AppShell
      role="operator"
      title="Apapa Mineral Terminal, Warehouse Block B"
      subtitle="Sahel Minerals & Logistics Ltd · Lagos State"
      actions={
        <Button asChild className="rounded-xl bg-link text-link-foreground hover:bg-link/90">
          <Link to="/warehousing/operator/receive">Receive shipment</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <DemoDataBanner />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Stored tonnage" value={`${stored.toLocaleString()} t`} hint={`${utilisation}% of 42,000 t licensed capacity`} tone="info" icon={<Warehouse className="size-5" />} />
          <StatCard label="Incoming today & tomorrow" value={incoming.length} hint="Trucks booked at the weighbridge" tone="warning" icon={<PackagePlus className="size-5" />} />
          <StatCard label="Active batches" value={batches.length} hint={`${batches.filter((b) => b.status === "Quarantine").length} in quarantine`} icon={<Boxes className="size-5" />} />
          <StatCard label="Pending releases" value={pendingReleases.length} hint="Awaiting your authorisation" tone="warning" icon={<Truck className="size-5" />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel className="xl:col-span-2" title="Capacity by zone" description="Live occupancy against configured storage capacity.">
            <div className="space-y-4">
              {STORAGE_HIERARCHY.map((zone) => {
                const cap = zone.rows.reduce((n, r) => n + r.capacity, 0);
                const occ = zone.rows.reduce((n, r) => n + r.occupied, 0);
                const pct = cap ? Math.round((occ / cap) * 100) : 0;
                return (
                  <div key={zone.zone} className="rounded-xl border border-border/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{zone.zone}</p>
                        <p className="text-xs text-muted-foreground">{zone.description}</p>
                      </div>
                      <StatusPill tone={pct > 85 ? "danger" : pct > 65 ? "warning" : "success"}>{pct}% used</StatusPill>
                    </div>
                    <Progress value={pct} className="mt-3 h-1.5" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {occ.toLocaleString()} of {cap.toLocaleString()} units occupied
                    </p>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Compliance status" description="Beldium supervision state for this facility.">
            <div className="space-y-3">
              <div className="rounded-xl bg-secondary/60 p-4">
                <StatusPill tone="warning">Application under review</StatusPill>
                <p className="mt-2 text-sm text-foreground">
                  BWC/APP/2026/0147 with Beldium Compliance Partners, risk score 88/100.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Open non-conformities</span>
                <StatusPill tone="danger">{openNCs.length}</StatusPill>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Documents expiring ≤120 days</span>
                <StatusPill tone="warning">{OPERATOR_DOCUMENTS.filter((d) => d.status !== "Valid").length}</StatusPill>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Last Beldium inspection</span>
                <span className="font-medium">19 Mar 2026</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Site contact</span>
                <span className="font-medium">{FACILITY_PROFILE.contact.split(" · ")[0]}</span>
              </div>
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel className="xl:col-span-2" title="Incoming shipments" description="Booked deliveries pending weighbridge capture.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {incoming.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-primary">{s.id}</TableCell>
                    <TableCell className="text-sm">{s.supplier}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.commodity}</TableCell>
                    <TableCell className="text-sm">{s.expected}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.eta}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.truckPlate}</TableCell>
                    <TableCell className="text-right">
                      <Link to="/warehousing/operator/receive" className="text-sm font-medium text-link hover:underline">
                        Receive
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {incoming.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      All booked shipments have been received.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Panel>

          <Panel title="Open incidents" description="Reported events under investigation." actions={
            <Button asChild variant="outline" className="rounded-xl"><Link to="/warehousing/operator/incidents">Report</Link></Button>
          }>
            <ul className="space-y-3">
              {openIncidents.map((i) => (
                <li key={i.id} className="rounded-xl bg-muted/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{i.id} · {i.category}</span>
                    <StatusPill tone={toneForStatus(i.severity)}>{i.severity}</StatusPill>
                  </div>
                  <p className="mt-1.5 text-sm text-foreground">{i.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{i.date} · {i.location}</p>
                </li>
              ))}
              {openIncidents.length === 0 ? <li className="text-sm text-muted-foreground">No open incidents.</li> : null}
            </ul>
          </Panel>
        </div>

        <Panel title="Expiring documents" description="Renew before expiry to avoid a compliance suspension." actions={
          <Button asChild variant="outline" className="rounded-xl"><Link to="/warehousing/operator/documents">Document library</Link></Button>
        }>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {EXPIRING_DOCS.filter((d) => d.facility.startsWith("Apapa"))
              .concat(
                OPERATOR_DOCUMENTS.filter((d) => d.status !== "Valid").map((d) => ({
                  id: d.id,
                  document: d.name,
                  facility: "Apapa Mineral Terminal, Block B",
                  company: "Sahel Minerals & Logistics Ltd",
                  expires: d.expires,
                  daysLeft: Math.max(0, Math.round((new Date(d.expires).getTime() - new Date("2026-08-21").getTime()) / 86400000)),
                })),
              )
              .map((d) => (
                <div key={d.id} className="rounded-xl border border-border/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{d.document}</p>
                    <StatusPill tone={d.daysLeft <= 30 ? "danger" : "warning"}>{d.daysLeft} days</StatusPill>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Expires {d.expires}</p>
                </div>
              ))}
          </div>
        </Panel>

        <Panel title="Safety notice" description="Beldium continuous monitoring is active on this facility.">
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-warning/25 p-4">
            <Siren className="size-5 text-warning-foreground" />
            <p className="flex-1 text-sm text-foreground">
              Bay B4 bund wall remediation (NC-2026-209) is overdue. Concentrate intake to that bay should be
              suspended until repaired and certified.
            </p>
            <ShieldCheck className="size-5 text-muted-foreground" />
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
