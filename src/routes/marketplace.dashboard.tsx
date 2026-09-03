import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Plus } from "lucide-react";
import { AppShell, Button, Metric, SectionCard } from "@/verticals/marketplace/AppShell";
import { StatusBadge } from "@/verticals/marketplace/StatusBadge";
import { ROLE_LABEL, fmtDate, fmtTonnes, fmtUsd, useDemo } from "@/verticals/marketplace/store";

export const Route = createFileRoute("/marketplace/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Beldium Marketplace Compliance" },
      {
        name: "description",
        content: "Role-aware operating picture for compliance, offtake, purchasing and OEM demand.",
      },
      { property: "og:title", content: "Dashboard | Beldium Marketplace Compliance" },
      {
        property: "og:description",
        content: "Queues, contracted cover, RFQ progress and financing status at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state } = useDemo();
  const role = state.role!;

  return (
    <AppShell
      title={`${ROLE_LABEL[role]} dashboard`}
      subtitle={
        role === "operator"
          ? "Partner onboarding, screening and non-conformity oversight"
          : "Demand, supply coverage and transaction readiness"
      }
      actions={
        role === "operator" ? (
          <Button asChild>
            <Link to="/marketplace/compliance">Open application queue</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/marketplace/rfqs">
              <Plus className="size-4" /> New RFQ
            </Link>
          </Button>
        )
      }
    >
      {role === "operator" ? <OperatorDashboard /> : <PartnerDashboard />}
    </AppShell>
  );
}

function OperatorDashboard() {
  const { state } = useDemo();
  const apps = state.applications;
  const count = (s: string) => apps.filter((a) => a.status === s).length;
  const openNc = apps.flatMap((a) =>
    a.nonConformities.filter((n) => n.status !== "closed").map((n) => ({ ...n, app: a })),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Awaiting triage" value={String(count("pending"))} hint="New applications" />
        <Metric
          label="Under review"
          value={String(count("under_review") + count("info_requested") + count("escalated"))}
          hint="In progress with the desk"
        />
        <Metric label="Verified partners" value={String(count("verified"))} tone="success" hint="Trading enabled" />
        <Metric
          label="Open non-conformities"
          value={String(openNc.length)}
          tone={openNc.some((n) => n.severity === "Critical") ? "danger" : "warning"}
          hint={openNc.some((n) => n.severity === "Critical") ? "Includes 1 critical" : "Remediation tracked"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Application queue"
          description="Newest first: highest risk band highlighted"
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link to="/marketplace/compliance">Full queue</Link>
            </Button>
          }
        >
          <ul className="divide-y divide-border">
            {apps.slice(0, 5).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    to="/marketplace/compliance/$id"
                    params={{ id: a.id }}
                    className="font-medium hover:underline"
                  >
                    {a.entityName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {a.id} · {a.type} · {a.country} · submitted {fmtDate(a.submittedAt)}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Risk {a.riskScore}/100 · {a.riskBand}
                </span>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Non-conformity workflow" description="Open and remediating items">
          <ul className="space-y-3">
            {openNc.length === 0 && (
              <li className="text-sm text-muted-foreground">No open non-conformities.</li>
            )}
            {openNc.map((n) => (
              <li key={n.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{n.title}</span>
                  <StatusBadge status={n.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {n.id} · {n.severity} · {n.app.entityName}
                </p>
                <Link
                  to="/marketplace/compliance/$id"
                  params={{ id: n.app.id }}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Open review <ArrowUpRight className="size-3" />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

function PartnerDashboard() {
  const { state } = useDemo();
  const role = state.role!;
  const rfqs = state.rfqs;
  const activeRfq = rfqs.find((r) => r.status !== "contracted") ?? rfqs[0];
  const contracted = state.orders.reduce((s, o) => s + o.tonnes, 0);
  const ownApp = state.applications.find((a) =>
    role === "offtaker" ? a.id === "APP-2041" : role === "buyer" ? a.id === "APP-2026" : a.id === "APP-2029",
  );

  const demandTarget = role === "oem" ? 900000 : role === "offtaker" ? 1200000 : 340000;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label={role === "oem" ? "Plant demand (annual)" : "Programme demand (annual)"}
          value={fmtTonnes(demandTarget)}
          hint={role === "oem" ? "18 GWh cell capacity" : "Manganese ore equivalent"}
        />
        <Metric
          label="Contracted cover"
          value={`${Math.round((contracted / demandTarget) * 100)}%`}
          hint={`${fmtTonnes(contracted)} secured`}
          tone="success"
        />
        <Metric
          label="Open RFQs"
          value={String(rfqs.filter((r) => r.status !== "contracted").length)}
          hint="Matching or awaiting acceptance"
        />
        <Metric
          label="Compliance standing"
          value={ownApp ? ownApp.status.replace(/_/g, " ") : "-"}
          hint={ownApp ? `${ownApp.id} · risk ${ownApp.riskScore}/100` : undefined}
          tone={ownApp?.status === "verified" ? "success" : "warning"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Active RFQ pipeline"
          description="Aggregation and acceptance status"
          actions={
            <Button size="sm" asChild>
              <Link to="/marketplace/rfqs">
                <Plus className="size-4" /> Create RFQ
              </Link>
            </Button>
          }
        >
          <ul className="divide-y divide-border">
            {rfqs.map((r) => {
              const filled = r.allocations.reduce((s, a) => s + a.tonnes, 0);
              return (
                <li key={r.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to="/marketplace/rfqs/$id"
                      params={{ id: r.id }}
                      className="font-medium hover:underline"
                    >
                      {r.reference}
                    </Link>
                    <StatusBadge status={r.status} />
                    <span className="ml-auto text-xs text-muted-foreground">
                      {fmtTonnes(filled)} of {fmtTonnes(r.volumeTonnes)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.commodity} {r.grade} · {r.incoterm} {r.destination} · target ${r.targetPriceUsd}/t
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (filled / r.volumeTonnes) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Finance readiness" description="Current programme funding gap">
            {activeRfq ? (
              <div className="space-y-3 text-sm">
                <Row label="Total offtake commitment" value={fmtUsd(activeRfq.finance?.totalCommitmentUsd ?? 600_000_000)} />
                <Row label="Buyer contribution" value={fmtUsd(activeRfq.finance?.buyerContributionUsd ?? 100_000_000)} />
                <Row
                  label="Financing required"
                  value={fmtUsd(activeRfq.finance?.requiredUsd ?? 500_000_000)}
                  strong
                />
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/marketplace/finance">Open finance workspace</Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active programme.</p>
            )}
          </SectionCard>

          <SectionCard title="Recent notifications">
            <ul className="space-y-3">
              {state.notifications
                .filter((n) => n.audience === role || n.audience === "all")
                .slice(0, 4)
                .map((n) => (
                  <li key={n.id} className="text-sm">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                  </li>
                ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-display text-base font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}
