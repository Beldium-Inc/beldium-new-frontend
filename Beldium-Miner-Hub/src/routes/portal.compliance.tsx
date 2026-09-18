import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { useLicences, useMineSites, useNonConformities } from "@/lib/api/mining-queries";

const title = "Compliance status - Beldium Miner Hub";
const description = "Licence standing and open non-conformities for your mining organisation.";

export const Route = createFileRoute("/portal/compliance")({
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
  component: CompliancePage,
});

function CompliancePage() {
  const licencesQuery = useLicences();
  const nonConformitiesQuery = useNonConformities();
  const sitesQuery = useMineSites();
  const licences = Array.isArray(licencesQuery.data) ? licencesQuery.data : (licencesQuery.data?.results ?? []);
  const nonConformities = Array.isArray(nonConformitiesQuery.data)
    ? nonConformitiesQuery.data
    : (nonConformitiesQuery.data?.results ?? []);
  const sites = Array.isArray(sitesQuery.data) ? sitesQuery.data : (sitesQuery.data?.results ?? []);
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "-";

  const active = licences.filter((l) => l.status === "active").length;
  const open = nonConformities.filter((n) => n.status !== "closed").length;
  const overdue = nonConformities.filter((n) => n.is_overdue).length;
  const score = licences.length ? Math.round((active / licences.length) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Compliance status"
        description="Licence standing and open non-conformities across your organisation."
        actions={
          <Button asChild variant="outline">
            <Link to="/portal/corrective-actions">Corrective actions</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Licences in good standing" value={`${score}%`} hint={`${active} of ${licences.length}`} />
        <StatCard label="Open non-conformities" value={String(open)} />
        <StatCard label="Overdue" value={String(overdue)} />
        <StatCard label="Total licences" value={String(licences.length)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">Licences</h2>
          <ul className="mt-4 space-y-3">
            {licences.map((l) => (
              <li key={l.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <div className="font-medium text-card-foreground">{l.number} · {l.type}</div>
                  <div className="text-xs text-muted-foreground">{l.authority} · {l.site_name} · expires {l.expires_on || "-"}</div>
                </div>
                <StatusChip tone={l.status === "active" ? "success" : l.status === "expired" ? "danger" : "warning"}>
                  {l.status}
                </StatusChip>
              </li>
            ))}
            {licences.length === 0 ? <li className="text-sm text-muted-foreground">No licences recorded.</li> : null}
          </ul>
        </section>

        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">Non-conformities</h2>
          <ul className="mt-4 space-y-3">
            {nonConformities.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <div className="font-medium text-card-foreground">{c.reference} · {c.title}</div>
                  <div className="text-xs text-muted-foreground">{siteName(c.site)} · {c.severity} · due {c.deadline}</div>
                </div>
                <StatusChip tone={c.status === "closed" ? "success" : c.is_overdue ? "danger" : "warning"}>
                  {c.status.replace("_", " ")}
                </StatusChip>
              </li>
            ))}
            {nonConformities.length === 0 ? (
              <li className="text-sm text-muted-foreground">No non-conformities recorded.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </>
  );
}
