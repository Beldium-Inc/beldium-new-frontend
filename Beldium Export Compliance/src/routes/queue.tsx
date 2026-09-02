import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { AlertTriangle, CheckCircle2, Clock, FileWarning, Filter, Ship } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { DisclaimerNote, Panel, Pill, RiskPill, ShipmentStatusPill, Stat } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/queue")({
  head: () => ({
    meta: [
      { title: "Review Queue — Beldium Export Compliance" },
      {
        name: "description",
        content:
          "Compliance operator work queue: triage Nigerian mineral export consignments by risk, ageing and outstanding evidence.",
      },
      { property: "og:title", content: "Review Queue — Beldium Export Compliance" },
      {
        property: "og:description",
        content: "Triage mineral export consignments by risk, ageing and outstanding evidence.",
      },
    ],
  }),
  component: QueuePage,
});

const FILTERS = [
  { id: "all", label: "All open" },
  { id: "unassigned", label: "Unassigned" },
  { id: "high", label: "High risk" },
  { id: "blocked", label: "Blocked" },
  { id: "closed", label: "Decided" },
] as const;

function QueuePage() {
  const { state } = useStore();
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]["id"]>("all");

  const open = state.shipments.filter(
    (s) => !["cleared", "conditionally_cleared", "declined"].includes(s.status),
  );
  const highRisk = state.shipments.filter((s) => s.riskBand === "high");
  const openNCs = state.shipments.flatMap((s) =>
    s.nonConformities.filter((n) => n.status !== "closed"),
  );
  const pendingDocs = state.shipments.flatMap((s) =>
    s.documents.filter((d) => d.status === "pending"),
  );

  const rows = state.shipments.filter((s) => {
    const decided = ["cleared", "conditionally_cleared", "declined"].includes(s.status);
    if (filter === "closed") return decided;
    if (decided) return false;
    if (filter === "unassigned")
      return (s.sections.overview ?? []).some(
        (f) => f.label === "Assigned reviewer" && f.value === "Unassigned",
      );
    if (filter === "high") return s.riskBand === "high";
    if (filter === "blocked")
      return s.checklist.some((c) => c.state === "fail") || s.status === "info_requested";
    return true;
  });

  return (
    <AppShell
      title="Review queue"
      subtitle="Consignments awaiting compliance verification"
      actions={<Pill tone="info">{open.length} open</Pill>}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open reviews" value={open.length} hint="Across 4 exporters" icon={<Ship className="size-4" />} />
        <Stat
          label="High risk"
          value={highRisk.length}
          tone="danger"
          hint="Escalated for senior review"
          icon={<AlertTriangle className="size-4" />}
        />
        <Stat
          label="Open non-conformities"
          value={openNCs.length}
          tone="warning"
          hint={`${openNCs.filter((n) => n.severity === "critical").length} critical`}
          icon={<FileWarning className="size-4" />}
        />
        <Stat
          label="Documents pending"
          value={pendingDocs.length}
          hint="Awaiting operator action"
          icon={<Clock className="size-4" />}
        />
      </div>

      <Panel
        title="Work queue"
        description="Ordered by risk exposure and proximity to departure."
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="size-3.5 text-muted-foreground" />
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  filter === f.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
        bodyClassName="p-0"
      >
        <div className="divide-y divide-border">
          {rows.map((s) => {
            const exporter = state.exporters.find((e) => e.id === s.exporterId);
            const verified = s.documents.filter((d) => d.status === "verified").length;
            const blocking = s.checklist.filter((c) => c.state === "fail").length;
            const openNc = s.nonConformities.filter((n) => n.status !== "closed").length;
            return (
              <Link
                key={s.id}
                to="/shipments/$id"
                params={{ id: s.id }}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-secondary/60 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold">{s.reference}</span>
                    <ShipmentStatusPill status={s.status} />
                    <RiskPill score={s.riskScore} band={s.riskBand} />
                    {blocking > 0 && <Pill tone="danger">{blocking} blocking</Pill>}
                    {openNc > 0 && <Pill tone="warning">{openNc} non-conformity</Pill>}
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {s.mineral} · {s.quantity} · {exporter?.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.port} → {s.destination} · ETD {s.etd} · USD {s.valueUsd.toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Documents</p>
                    <p className="text-sm font-semibold">
                      {verified}/{s.documents.length} verified
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="text-sm font-semibold">{s.submitted}</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <span>Open review</span>
                  </Button>
                </div>
              </Link>
            );
          })}
          {rows.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No consignments match this filter.
            </p>
          )}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Exporter verification backlog" className="lg:col-span-2" bodyClassName="p-0">
          <div className="divide-y divide-border">
            {state.exporters.map((e) => (
              <Link
                key={e.id}
                to="/exporters/$id"
                params={{ id: e.id }}
                className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-secondary/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.rcNumber} · {e.state} State · onboarded {e.onboarded}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold">{e.complianceScore}</span>
                  {e.verification === "verified" ? (
                    <Pill tone="success">
                      <CheckCircle2 className="size-3" /> Verified
                    </Pill>
                  ) : e.verification === "in_review" ? (
                    <Pill tone="warning">In review</Pill>
                  ) : (
                    <Pill tone="danger">Action required</Pill>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </Panel>
        <Panel title="Reviewer notes">
          <ul className="space-y-3 text-xs leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Tolerance policy:</span> quantity
              variance beyond ±0.5% requires a non-conformity before any decision.
            </li>
            <li>
              <span className="font-medium text-foreground">Assay policy:</span> only ISO 17025
              accredited laboratory results are accepted as independent evidence.
            </li>
            <li>
              <span className="font-medium text-foreground">Title validity:</span> mining titles and
              export permits must remain valid through the declared ETD.
            </li>
          </ul>
          <DisclaimerNote className="mt-4" />
        </Panel>
      </div>
    </AppShell>
  );
}
