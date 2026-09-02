import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Boxes, FlaskConical, Info, PackageCheck, Truck } from "lucide-react";
import { Panel, PanelHeader, PageHeader, Pill, statusTone } from "@/components/bpc";
import { TRACE_RUNS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/traceability")({
  head: () => ({
    meta: [
      { title: "Operational traceability · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Input batch to production run to output batch to post-process quality, anchored to Beldium Batch IDs.",
      },
      { property: "og:title", content: "Operational traceability · Beldium Processing Compliance" },
      {
        property: "og:description",
        content: "Beldium Batch ID traceability across production runs and post-process quality.",
      },
    ],
  }),
  component: TraceabilityPage,
});

function TraceabilityPage() {
  const [selected, setSelected] = React.useState(TRACE_RUNS[0]!.runId);
  const run = TRACE_RUNS.find((r) => r.runId === selected)!;

  const stages = [
    { icon: Truck, label: "Input batch", id: run.inputBatch, lines: [run.inputSource, run.inputMass] },
    { icon: Boxes, label: "Production run", id: run.runId, lines: [run.process, `${run.started} → ${run.completed}`] },
    { icon: PackageCheck, label: "Output batch", id: run.outputBatch, lines: [run.outputMass, `Yield ${run.yield}`] },
    { icon: FlaskConical, label: "Post-process quality", id: run.qc.verdict, lines: [run.qc.assay, run.qc.lab] },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Operational context"
        title="Beldium Batch traceability"
        description="Production traceability is shown here as operational context. It is not part of the compliance assessment itself — the compliance layer draws on it only to confirm that batch records and reconciliation controls are being maintained."
      />

      <div className="flex items-start gap-3 rounded-2xl border border-secondary bg-secondary/40 px-4 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-xs text-secondary-foreground">
          <span className="font-semibold">Context, not control.</span> Compliance decisions are made
          against the ten evidence sections. Batch records are referenced during Operational Controls
          review and during physical inspection reconciliation.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TRACE_RUNS.map((r) => (
          <button
            key={r.runId}
            onClick={() => setSelected(r.runId)}
            className={cn(
              "rounded-2xl border px-4 py-2.5 text-left text-xs",
              selected === r.runId
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-accent",
            )}
          >
            <p className="font-semibold">{r.runId}</p>
            <p className={cn("text-[11px]", selected === r.runId ? "opacity-75" : "text-muted-foreground")}>
              {r.facility}
            </p>
          </button>
        ))}
      </div>

      <Panel>
        <PanelHeader
          title={`${run.runId} — chain of custody`}
          subtitle={run.facility}
          icon={<Boxes className="size-4" />}
          action={<Pill tone={statusTone(run.qc.verdict)}>QC {run.qc.verdict}</Pill>}
        />
        <div className="grid gap-4 p-5 lg:grid-cols-4">
          {stages.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="relative rounded-2xl border border-border p-4">
                <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-primary">
                  <Icon className="size-4" />
                </span>
                <p className="mt-3 text-[10px] tracking-wide text-muted-foreground uppercase">
                  {s.label}
                </p>
                <p className="mt-0.5 text-sm font-semibold break-all">{s.id}</p>
                {s.lines.map((l) => (
                  <p key={l} className="mt-1 text-[11px] text-muted-foreground">
                    {l}
                  </p>
                ))}
                {i < stages.length - 1 ? (
                  <ArrowRight className="absolute top-1/2 -right-3 hidden size-4 -translate-y-1/2 text-muted-foreground lg:block" />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 border-t border-border p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Cell k="Mass balance" v={`${run.inputMass} in → ${run.outputMass} out`} />
          <Cell k="Recovery / yield" v={run.yield} />
          <Cell k="Moisture" v={run.qc.moisture} />
          <Cell k="Retention sample" v="Held, 90 days" />
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="All production runs" subtitle="Last 30 days across monitored facilities" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3 font-medium">Run</th>
                <th className="px-5 py-3 font-medium">Input batch</th>
                <th className="px-5 py-3 font-medium">Output batch</th>
                <th className="px-5 py-3 font-medium">Facility</th>
                <th className="px-5 py-3 font-medium">Yield</th>
                <th className="px-5 py-3 font-medium">QC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {TRACE_RUNS.map((r) => (
                <tr key={r.runId} className="hover:bg-accent/50">
                  <td className="px-5 py-3 text-xs font-medium">{r.runId}</td>
                  <td className="px-5 py-3 text-xs">{r.inputBatch}</td>
                  <td className="px-5 py-3 text-xs">{r.outputBatch}</td>
                  <td className="px-5 py-3 text-xs">{r.facility}</td>
                  <td className="px-5 py-3 text-xs">{r.yield}</td>
                  <td className="px-5 py-3">
                    <Pill tone={statusTone(r.qc.verdict)}>{r.qc.verdict}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2.5">
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">{k}</p>
      <p className="mt-0.5 text-xs font-medium">{v}</p>
    </div>
  );
}
