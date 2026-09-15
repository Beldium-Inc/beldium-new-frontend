import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { StatusChip, complianceTone, prettify } from "@/components/status-chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BatchChainPanel } from "@/components/ecosystem-ui";
import { useMiner } from "@/lib/miner-store";

const title = "Mining site dashboard — Beldium Miner Hub";
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
  const { state } = useMiner();
  const site = state.application.sites.find((s) => s.id === siteId);

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

  const production = state.production.filter((p) => p.siteId === site.id);
  const equipment = state.application.equipment.filter((e) => e.siteId === site.id);
  const compliance = state.compliance.filter((c) => c.siteId === site.id);
  const actions = state.correctiveActions.filter((a) => a.siteId === site.id);
  const inventory = state.inventory.filter((i) => i.siteId === site.id);
  const siteBatches = state.batches.filter((b) => b.siteId === site.id);
  const mined = production.reduce((s, p) => s + p.tonnesMined, 0);
  const processed = production.reduce((s, p) => s + p.tonnesProcessed, 0);

  return (
    <>
      <Link to="/portal/sites" className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> All sites
      </Link>
      <PageHeader
        title={site.name}
        description={`${site.licenceNo} · ${site.mineral} · ${site.method} · ${site.region}`}
        actions={<StatusChip tone={site.status === "Operating" ? "success" : "warning"}>{site.status}</StatusChip>}
      />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="actions">Corrective actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Tonnes mined" value={mined.toLocaleString()} hint="All reported periods" />
            <StatCard label="Tonnes processed" value={processed.toLocaleString()} />
            <StatCard label="Workforce" value={String(site.workforce)} />
            <StatCard label="Licensed area" value={`${site.hectares} ha`} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-md border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-card-foreground">Site details</h2>
              <dl className="mt-3 space-y-2 text-sm">
                {[
                  ["Licence", site.licenceNo],
                  ["Mineral", site.mineral],
                  ["Method", site.method],
                  ["Region", site.region],
                  ["Status", site.status],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-card-foreground">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="rounded-md border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-card-foreground">Compliance snapshot</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {compliance.length ? (
                  compliance.map((c) => (
                    <li key={c.id} className="flex justify-between gap-3">
                      <span className="text-card-foreground">{c.obligation}</span>
                      <StatusChip tone={complianceTone(c.status)}>{prettify(c.status)}</StatusChip>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">No site-specific obligations.</li>
                )}
              </ul>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="production" className="mt-5">
          <Table
            head={["Period", "Mineral", "Mined (t)", "Processed (t)", "Grade", "Recovery %", "Downtime (h)"]}
            rows={production.map((p) => [
              p.period,
              p.mineral,
              p.tonnesMined.toLocaleString(),
              p.tonnesProcessed.toLocaleString(),
              String(p.grade),
              String(p.recovery),
              String(p.downtimeHours),
            ])}
            empty="No production reported for this site."
          />
        </TabsContent>

        <TabsContent value="equipment" className="mt-5">
          <Table
            head={["Equipment", "Type", "Serial", "Year", "Condition"]}
            rows={equipment.map((e) => [e.name, e.type, e.serial, e.year || "—", e.condition])}
            empty="No equipment assigned to this site."
          />
        </TabsContent>

        <TabsContent value="inventory" className="mt-5">
          <Table
            head={["Item", "Category", "Quantity", "Unit", "Reorder level", "Updated"]}
            rows={inventory.map((i) => [
              i.name,
              i.category,
              i.quantity.toLocaleString(),
              i.unit,
              i.reorderLevel.toLocaleString(),
              i.updatedAt,
            ])}
            empty="No inventory recorded for this site."
          />
        </TabsContent>

        <TabsContent value="compliance" className="mt-5">
          <Table
            head={["Obligation", "Authority", "Frequency", "Due", "Status"]}
            rows={compliance.map((c) => [c.obligation, c.authority, c.frequency, c.dueAt, prettify(c.status)])}
            empty="No obligations for this site."
          />
        </TabsContent>

        <TabsContent value="actions" className="mt-5">
          <Table
            head={["Reference", "Finding", "Severity", "Owner", "Due", "Status"]}
            rows={actions.map((a) => [a.reference, a.finding, prettify(a.severity), a.owner, a.dueAt, prettify(a.status)])}
            empty="No corrective actions for this site."
          />
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <BatchChainPanel
          batches={siteBatches}
          transactions={state.transactions}
          title="Material from this site"
          description="Batches mined here and the buyer commitments they are aggregated against."
        />
      </div>
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
