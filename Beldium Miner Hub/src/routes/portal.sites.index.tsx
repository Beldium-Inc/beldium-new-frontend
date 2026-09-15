import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { useMiner } from "@/lib/miner-store";

const title = "Mining sites — Beldium Miner Hub";
const description = "All declared mining sites with mineral, method, workforce and operating status.";

export const Route = createFileRoute("/portal/sites/")({
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
  component: SitesPage,
});

function SitesPage() {
  const { state } = useMiner();
  const sites = state.application.sites;
  const workforce = sites.reduce((s, x) => s + (Number(x.workforce) || 0), 0);
  const hectares = sites.reduce((s, x) => s + (Number(x.hectares) || 0), 0);

  return (
    <>
      <PageHeader title="Mining sites" description="Open a site to see production, equipment, compliance and actions." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Sites" value={String(sites.length)} />
        <StatCard label="Total workforce" value={workforce.toLocaleString()} />
        <StatCard label="Licensed area" value={`${hectares.toLocaleString()} ha`} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sites.map((s) => (
          <article key={s.id} className="rounded-md border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-medium text-card-foreground">{s.name}</h2>
              <StatusChip tone={s.status === "Operating" ? "success" : "warning"}>{s.status}</StatusChip>
            </div>
            <dl className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <div className="flex justify-between gap-4">
                <dt>Licence</dt>
                <dd className="text-card-foreground">{s.licenceNo}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Mineral</dt>
                <dd className="text-card-foreground">{s.mineral}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Method</dt>
                <dd className="text-card-foreground">{s.method}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Region</dt>
                <dd className="text-card-foreground">{s.region}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Workforce</dt>
                <dd className="text-card-foreground">{s.workforce}</dd>
              </div>
            </dl>
            <Link
              to="/portal/sites/$siteId"
              params={{ siteId: s.id }}
              className="mt-4 inline-flex items-center text-sm font-medium text-accent hover:underline"
            >
              Open site dashboard <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
