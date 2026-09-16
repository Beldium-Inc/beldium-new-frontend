import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { useMineSites, useProduction } from "@/lib/api/mining-queries";

const title = "Production reporting — Beldium Miner Hub";
const description = "Tonnes produced and grade across all mining sites.";

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
  const productionQuery = useProduction();
  const sitesQuery = useMineSites();
  const rawRows = Array.isArray(productionQuery.data) ? productionQuery.data : (productionQuery.data?.results ?? []);
  const rows = [...rawRows].sort((a, b) => b.period_start.localeCompare(a.period_start));
  const sites = Array.isArray(sitesQuery.data) ? sitesQuery.data : (sitesQuery.data?.results ?? []);
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "—";

  const tonnage = rows.reduce((s, p) => s + p.tonnage, 0);
  const max = Math.max(1, ...rows.map((r) => r.tonnage));

  return (
    <>
      <PageHeader title="Production" description="Declared production per site, as reported to Beldium." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total tonnage" value={tonnage.toLocaleString()} />
        <StatCard label="Reports" value={String(rows.length)} />
        <StatCard label="Sites reporting" value={String(new Set(rows.map((r) => r.site)).size)} />
      </div>

      <section className="mt-6 rounded-md border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground">Tonnage by report</h2>
        <ul className="mt-4 space-y-2.5">
          {rows.map((r) => (
            <li key={r.id} className="text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-card-foreground">
                  {r.period_start} · {siteName(r.site)}
                </span>
                <span className="text-muted-foreground">{r.tonnage.toLocaleString()} t</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div className="h-1.5 rounded-full bg-accent" style={{ width: `${(r.tonnage / max) * 100}%` }} />
              </div>
            </li>
          ))}
          {rows.length === 0 ? <li className="text-sm text-muted-foreground">No production reported yet.</li> : null}
        </ul>
      </section>

      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {["Period", "Site", "Commodity", "Tonnage", "Grade"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5 text-card-foreground">{r.period_start} – {r.period_end}</td>
                <td className="px-4 py-2.5 text-card-foreground">{siteName(r.site)}</td>
                <td className="px-4 py-2.5 text-card-foreground">{r.commodity}</td>
                <td className="px-4 py-2.5 text-card-foreground">{r.tonnage.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-card-foreground">{r.grade ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
