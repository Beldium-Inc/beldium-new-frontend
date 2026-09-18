import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEquipment, useInventory, useMineSites, useNonConformities, useProduction } from "@/lib/api/mining-queries";

const title = "Mining site dashboard - Beldium Miner Hub";
const description = "Site overview, production, equipment, workforce, compliance and corrective actions.";

export const Route = createFileRoute("/portal/sites/$siteId")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SiteDashboard,
});

function SiteDashboard() {
  const { siteId } = Route.useParams();
  const sitesQuery = useMineSites();
  const productionQuery = useProduction();
  const equipmentQuery = useEquipment();
  const inventoryQuery = useInventory();
  const nonConformitiesQuery = useNonConformities();

  const sites = Array.isArray(sitesQuery.data) ? sitesQuery.data : (sitesQuery.data?.results ?? []);
  const site = sites.find((s) => s.id === siteId);

  if (sitesQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading site…</p>;
  }

  if (!site) {
    return (
      <div className="rounded-md border border-dashed border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">That mining site is not in your declared sites.</p>
        <Link to="/portal/sites" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
          Back to sites
        </Link>
      </div>
    );
  }

  const production = (Array.isArray(productionQuery.data) ? productionQuery.data : (productionQuery.data?.results ?? [])).filter(
    (p) => p.site === site.id,
  );
  const equipment = (Array.isArray(equipmentQuery.data) ? equipmentQuery.data : (equipmentQuery.data?.results ?? [])).filter(
    (e) => e.site === site.id,
  );
  const inventory = (Array.isArray(inventoryQuery.data) ? inventoryQuery.data : (inventoryQuery.data?.results ?? [])).filter(
    (i) => i.site === site.id,
  );
  const nonConformities = (
    Array.isArray(nonConformitiesQuery.data) ? nonConformitiesQuery.data : (nonConformitiesQuery.data?.results ?? [])
  ).filter((n) => n.site === site.id);
  const mined = production.reduce((s, p) => s + p.tonnage, 0);

  return (
    <>
      <Link to="/portal/sites" className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> All sites
      </Link>
      <PageHeader
        title={site.name}
        description={`${site.code} · ${site.mineral} · ${site.state ?? "-"}`}
        actions={
          <StatusChip tone={site.status === "operational" ? "success" : "warning"}>
            {(site.status ?? "").replace("_", " ")}
          </StatusChip>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="compliance">Non-conformities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Tonnes recorded" value={mined.toLocaleString()} hint="All reported periods" />
            <StatCard label="Workforce" value={String(site.workforce ?? "-")} />
            <StatCard label="Licensed area" value={`${site.area_ha ?? "-"} ha`} />
            <StatCard label="Compliance score" value={`${site.compliance_percent}%`} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-md border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-card-foreground">Site details</h2>
              <dl className="mt-3 space-y-2 text-sm">
                {[
                  ["Code", site.code],
                  ["Mineral", site.mineral],
                  ["State", site.state],
                  ["Status", site.status],
                  ["Risk", site.risk],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-card-foreground">{v || "-"}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="rounded-md border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-card-foreground">Open non-conformities</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {nonConformities.length ? (
                  nonConformities.map((c) => (
                    <li key={c.id} className="flex justify-between gap-3">
                      <span className="text-card-foreground">{c.title}</span>
                      <StatusChip tone={c.status === "closed" ? "success" : "warning"}>{c.status.replace("_", " ")}</StatusChip>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">No non-conformities.</li>
                )}
              </ul>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="production" className="mt-5">
          <Table
            head={["Period", "Commodity", "Tonnage", "Grade"]}
            rows={production.map((p) => [`${p.period_start} – ${p.period_end}`, p.commodity, p.tonnage.toLocaleString(), String(p.grade ?? "-")])}
            empty="No production reported for this site."
          />
        </TabsContent>

        <TabsContent value="equipment" className="mt-5">
          <Table
            head={["Equipment", "Serial", "Certificate expiry", "Status"]}
            rows={equipment.map((e) => [e.name, e.serial, e.cert_expires_on || "-", e.status])}
            empty="No equipment assigned to this site."
          />
        </TabsContent>

        <TabsContent value="inventory" className="mt-5">
          <Table
            head={["Item", "Category", "Quantity", "Unit", "Threshold"]}
            rows={inventory.map((i) => [i.name, i.category, i.quantity.toLocaleString(), i.unit, String(i.threshold ?? "-")])}
            empty="No inventory recorded for this site."
          />
        </TabsContent>

        <TabsContent value="compliance" className="mt-5">
          <Table
            head={["Reference", "Title", "Severity", "Status", "Deadline"]}
            rows={nonConformities.map((c) => [c.reference, c.title, c.severity, c.status.replace("_", " "), c.deadline])}
            empty="No non-conformities for this site."
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: string[][]; empty: string }) {
  if (!rows.length) {
    return (
      <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {empty}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="px-4 py-2.5 text-card-foreground">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
