import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { AlertTriangle, Clock, Filter, Ship } from "lucide-react";
import { AppShell } from "@/verticals/export/AppShell";
import { useStore } from "@/verticals/export/store";
import { ApplicationStatusPill, DisclaimerNote, Panel, Pill, Stat } from "@/verticals/export/ui-kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/export/queue")({
  head: () => ({
    meta: [
      { title: "Review Queue | Beldium Export Compliance" },
      {
        name: "description",
        content: "Compliance operator work queue: triage exporter admission applications by risk and status.",
      },
    ],
  }),
  component: QueuePage,
});

const FILTERS = [
  { id: "all", label: "All open" },
  { id: "submitted", label: "Submitted" },
  { id: "under_review", label: "Under review" },
  { id: "awaiting_information", label: "Awaiting information" },
  { id: "decided", label: "Decided" },
] as const;

const DECIDED = new Set(["approved", "conditionally_approved", "rejected"]);

function ExporterRow({ id, exporters }: { id: string; exporters: ReturnType<typeof useStore>["state"]["exporters"] }) {
  return <>{exporters.find((e) => e.id === id)?.name ?? "-"}</>;
}

function QueuePage() {
  const { state } = useStore();
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]["id"]>("all");

  const open = state.applications.filter((a) => !DECIDED.has(a.status));
  const highRisk = state.applications.filter((a) => a.risk.risk_band === "high");
  const pendingDocs = state.documents.filter((d) => d.status === "pending");

  const rows = state.applications.filter((a) => {
    if (filter === "decided") return DECIDED.has(a.status);
    if (DECIDED.has(a.status)) return false;
    if (filter === "all") return true;
    return a.status === filter;
  });

  return (
    <AppShell
      title="Review queue"
      subtitle="Exporter admission applications awaiting compliance verification"
      actions={<Pill tone="info">{open.length} open</Pill>}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open reviews" value={open.length} icon={<Ship className="size-4" />} />
        <Stat label="High risk" value={highRisk.length} tone="danger" icon={<AlertTriangle className="size-4" />} />
        <Stat label="Documents pending" value={pendingDocs.length} hint="Awaiting operator action" icon={<Clock className="size-4" />} />
        <Stat label="Exporters" value={state.exporters.length} />
      </div>

      <Panel
        title="Work queue"
        description="Every exporter admission application."
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
          {rows.map((a) => {
            const verified = state.documents.filter((d) => d.application === a.id && d.status === "verified").length;
            const total = state.documents.filter((d) => d.application === a.id).length;
            return (
              <Link
                key={a.id}
                to="/export/exporters/$id"
                params={{ id: a.exporter }}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-secondary/60 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold">
                      <ExporterRow id={a.exporter} exporters={state.exporters} />
                    </span>
                    <ApplicationStatusPill status={a.status} />
                    <Pill tone={a.risk.risk_band === "high" ? "danger" : a.risk.risk_band === "medium" ? "warning" : "success"}>
                      Risk {a.risk.compliance_score} · {a.risk.risk_band}
                    </Pill>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.progress.complete}/{a.progress.total} domains complete · submitted {a.submitted_at ?? "-"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Documents</p>
                    <p className="text-sm font-semibold">{verified}/{total} verified</p>
                  </div>
                </div>
              </Link>
            );
          })}
          {rows.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No applications match this filter.
            </p>
          )}
        </div>
      </Panel>

      <DisclaimerNote />
    </AppShell>
  );
}
