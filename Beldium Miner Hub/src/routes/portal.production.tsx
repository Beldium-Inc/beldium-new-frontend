import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { BatchChainPanel } from "@/components/ecosystem-ui";
import { useMiner } from "@/lib/miner-store";

const title = "Production reporting — Beldium Miner Hub";
const description = "Tonnes mined and processed, grade, recovery and downtime across all mining sites.";

export const Route = createFileRoute("/portal/production")({
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
  component: ProductionPage,
});

function ProductionPage() {
  const { state } = useMiner();
  const rows = [...state.production].sort((a, b) => b.period.localeCompare(a.period));
  const mined = rows.reduce((s, p) => s + p.tonnesMined, 0);
  const processed = rows.reduce((s, p) => s + p.tonnesProcessed, 0);
  const downtime = rows.reduce((s, p) => s + p.downtimeHours, 0);
  const siteName = (id: string) => state.application.sites.find((s) => s.id === id)?.name ?? "—";
  const max = Math.max(1, ...rows.map((r) => r.tonnesMined));

  return (
    <>
      <PageHeader title="Production" description="Monthly declared production per site, as reported to Beldium." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tonnes mined" value={mined.toLocaleString()} />
        <StatCard label="Tonnes processed" value={processed.toLocaleString()} />
        <StatCard label="Recovery ratio" value={mined ? `${Math.round((processed / mined) * 100)}%` : "—"} />
        <StatCard label="Downtime" value={`${downtime} h`} />
      </div>

      <section className="mt-6 rounded-md border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground">Tonnes mined by report</h2>
        <ul className="mt-4 space-y-2.5">
          {rows.map((r) => (
            <li key={r.id} className="text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-card-foreground">
                  {r.period} · {siteName(r.siteId)}
                </span>
                <span className="text-muted-foreground">{r.tonnesMined.toLocaleString()} t</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-accent"
                  style={{ width: `${(r.tonnesMined / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {["Period", "Site", "Mineral", "Mined (t)", "Processed (t)", "Grade", "Recovery %", "Downtime (h)"].map(
                (h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5 text-card-foreground">{r.period}</td>
                <td className="px-4 py-2.5 text-card-foreground">{siteName(r.siteId)}</td>
                <td className="px-4 py-2.5 text-card-foreground">{r.mineral}</td>
                <td className="px-4 py-2.5 text-card-foreground">{r.tonnesMined.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-card-foreground">{r.tonnesProcessed.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-card-foreground">{r.grade}</td>
                <td className="px-4 py-2.5 text-card-foreground">{r.recovery}</td>
                <td className="px-4 py-2.5 text-card-foreground">{r.downtimeHours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <BatchChainPanel
          batches={state.batches}
          transactions={state.transactions}
          siteName={siteName}
          title="Where declared output went"
          description="Production feeds these batches, which are aggregated against buyer commitments."
        />
      </div>
    </>
  );
}
