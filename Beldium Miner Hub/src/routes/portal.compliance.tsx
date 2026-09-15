import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { StatusChip, complianceTone, prettify } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { useMiner } from "@/lib/miner-store";

const title = "Compliance status — Beldium Miner Hub";
const description = "Regulatory obligations, due dates and compliance standing for your mining organisation.";

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
  const { state } = useMiner();
  const rows = state.compliance;
  const siteName = (id?: string) =>
    id ? (state.application.sites.find((s) => s.id === id)?.name ?? "—") : "Organisation-wide";
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const score = rows.length ? Math.round((count("compliant") / rows.length) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Compliance status"
        description="Obligations tracked for your licences, environment plan and reporting duties."
        actions={
          <Button asChild variant="outline">
            <Link to="/portal/corrective-actions">Corrective actions</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Compliance score" value={`${score}%`} hint={`${count("compliant")} of ${rows.length} met`} />
        <StatCard label="Due soon" value={String(count("due_soon"))} />
        <StatCard label="Overdue" value={String(count("overdue"))} />
        <StatCard label="Under review" value={String(count("in_review"))} />
      </div>

      <div className="mt-6 space-y-4">
        {rows.map((c) => (
          <article key={c.id} className="rounded-md border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-medium text-card-foreground">{c.obligation}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.authority} · {c.frequency} · {siteName(c.siteId)}
                </p>
              </div>
              <StatusChip tone={complianceTone(c.status)}>{prettify(c.status)}</StatusChip>
            </div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <div className="text-xs text-muted-foreground">Due</div>
                <div className="text-card-foreground">{c.dueAt}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Last submitted</div>
                <div className="text-card-foreground">{c.lastSubmitted || "Not yet submitted"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Evidence</div>
                <div className="text-card-foreground">{c.evidence || "—"}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
