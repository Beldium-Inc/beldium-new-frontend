import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Siren, X } from "lucide-react";
import { Panel, PageHeader, Pill, StatCard, statusTone } from "@/verticals/processing/bpc";
import { INCIDENTS, type Incident } from "@/verticals/processing/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/processing/incidents")({
  head: () => ({
    meta: [
      { title: "Incidents · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Reported health, safety and environmental incidents at licensed processing facilities with investigation status.",
      },
      { property: "og:title", content: "Incidents · Beldium Processing Compliance" },
      {
        property: "og:description",
        content: "HSE incident register for licensed processing facilities.",
      },
    ],
  }),
  component: IncidentsPage,
});

const FILTERS = ["All", "Reported", "Under Investigation", "Closed"] as const;

function IncidentsPage() {
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("All");
  const [open, setOpen] = React.useState<Incident | null>(null);
  const rows = INCIDENTS.filter((i) => filter === "All" || i.status === filter);

  return (
    <>
      <PageHeader
        eyebrow="Regulatory oversight"
        title="Incident register"
        description="Health, safety and environmental incidents self-reported by operators or raised by inspectors. Oversight reviews investigation quality; corrective actions are tracked as non-conformities."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open investigations" value={INCIDENTS.filter((i) => i.status === "Under Investigation").length} tone="warning" icon={<Siren className="size-4" />} />
        <StatCard label="Severe incidents (YTD)" value={INCIDENTS.filter((i) => i.severity === "Severe").length} tone="danger" />
        <StatCard label="Closed with actions" value={INCIDENTS.filter((i) => i.status === "Closed").length} tone="success" />
      </div>

      <Panel>
        <div className="flex flex-wrap gap-1.5 border-b border-border px-5 py-4">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-accent",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="divide-y divide-border">
          {rows.map((i) => (
            <button
              key={i.id}
              onClick={() => setOpen(i)}
              className="block w-full px-5 py-4 text-left hover:bg-accent/60"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{i.type}</p>
                <Pill tone={statusTone(i.severity)}>{i.severity}</Pill>
                <Pill tone={statusTone(i.status)}>{i.status}</Pill>
                <span className="ml-auto text-[11px] text-muted-foreground">{i.reported}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{i.summary}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {i.id} · {i.facility} · {i.state} State
              </p>
            </button>
          ))}
        </div>
      </Panel>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/45 backdrop-blur-sm" onClick={() => setOpen(null)} />
          <div className="relative w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-[0_30px_80px_-30px_rgba(16,30,61,0.7)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">{open.type}</h3>
                <p className="text-xs text-muted-foreground">
                  {open.id} · {open.facility} · {open.state} State
                </p>
              </div>
              <button onClick={() => setOpen(null)} className="rounded-lg p-1 hover:bg-accent">
                <X className="size-4" />
              </button>
            </div>
            <p className="rounded-xl bg-muted/60 px-3 py-2 text-xs">{open.summary}</p>
            <div className="mt-4 space-y-3">
              <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                Investigation timeline
              </p>
              {[
                { at: open.reported, label: "Incident reported by operator" },
                { at: open.reported, label: "Notified to compliance partner and oversight" },
                {
                  at: open.status === "Closed" ? "Closed" : "In progress",
                  label:
                    open.status === "Closed"
                      ? "Root-cause report accepted, corrective actions verified"
                      : "Root-cause analysis under review",
                },
              ].map((s, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-xs font-medium">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground">{s.at}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-xl bg-secondary/50 px-3 py-2 text-[11px] text-secondary-foreground">
              Oversight may comment and request further information. Closing an incident is a
              compliance-partner action.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setOpen(null)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
