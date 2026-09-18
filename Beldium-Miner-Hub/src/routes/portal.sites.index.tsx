import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { useMineSites } from "@/lib/api/mining-queries";

const title = "Mining sites - Beldium Miner Hub";
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
  const sitesQuery = useMineSites();
  const sites = Array.isArray(sitesQuery.data) ? sitesQuery.data : (sitesQuery.data?.results ?? []);
  const workforce = sites.reduce((s, x) => s + (x.workforce ?? 0), 0);
  const hectares = sites.reduce((s, x) => s + (x.area_ha ?? 0), 0);

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
              <StatusChip tone={s.status === "operational" ? "success" : "warning"}>
                {(s.status ?? "").replace("_", " ")}
              </StatusChip>
            </div>
            <dl className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <div className="flex justify-between gap-4">
                <dt>Code</dt>
                <dd className="text-card-foreground">{s.code}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Mineral</dt>
                <dd className="text-card-foreground">{s.mineral}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>State</dt>
                <dd className="text-card-foreground">{s.state || "-"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Workforce</dt>
                <dd className="text-card-foreground">{s.workforce ?? "-"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Compliance</dt>
                <dd className="text-card-foreground">{s.compliance_percent}%</dd>
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
        {sites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sites declared yet.</p>
        ) : null}
      </div>
    </>
  );
}
