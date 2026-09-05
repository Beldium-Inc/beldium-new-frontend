import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Loader2, X } from "lucide-react";
import { Panel, PanelHeader, PageHeader, Pill } from "@/verticals/processing/bpc";
import { REGIONAL_COMPLIANCE, REPORTS, KPI_TREND } from "@/verticals/processing/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/processing/reports")({
  head: () => ({
    meta: [
      { title: "Reports · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Generate and browse national, regional and thematic processing-compliance reports for oversight review.",
      },
      { property: "og:title", content: "Reports · Beldium Processing Compliance" },
      {
        property: "og:description",
        content: "Compliance report library and generation for oversight users.",
      },
    ],
  }),
  component: ReportsPage,
});

const SCOPES = ["All regions", ...REGIONAL_COMPLIANCE.map((r) => r.region)];
const KINDS = ["National compliance summary", "Environmental exceedances", "Inspection programme", "Non-conformity register"];

function ReportsPage() {
  const [scope, setScope] = React.useState(SCOPES[0]);
  const [kind, setKind] = React.useState(KINDS[0]);
  const [period, setPeriod] = React.useState("Q3 2026");
  const [state, setState] = React.useState<"idle" | "running" | "done">("idle");
  const [preview, setPreview] = React.useState<(typeof REPORTS)[number] | null>(null);

  function generate() {
    setState("running");
    window.setTimeout(() => setState("done"), 1400);
  }

  return (
    <>
      <PageHeader
        eyebrow="Regulatory oversight"
        title="Reports & analytics"
        description="Assemble oversight reporting packs from the compliance record. Reports are read-only extracts; they do not alter processor standing."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Panel>
          <PanelHeader title="Generate report" subtitle="Composed from current compliance data" />
          <div className="space-y-4 px-5 py-5">
            <Field label="Report type">
              <select
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  setState("idle");
                }}
                className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-ring"
              >
                {KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </Field>
            <Field label="Scope">
              <div className="flex flex-wrap gap-1.5">
                {SCOPES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setScope(s);
                      setState("idle");
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium",
                      scope === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Period">
              <div className="flex flex-wrap gap-1.5">
                {["Q1 2026", "Q2 2026", "Q3 2026", "YTD 2026"].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p);
                      setState("idle");
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium",
                      period === p
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>

            <button
              onClick={generate}
              disabled={state === "running"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-70"
            >
              {state === "running" ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
              {state === "running" ? "Compiling…" : "Generate report"}
            </button>

            {state === "done" ? (
              <div className="rounded-2xl border border-border bg-success/25 px-4 py-3">
                <p className="text-xs font-medium">Report ready</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {kind} · {scope} · {period}, 14 pages, 6 annexes. Demo build: download is
                  simulated.
                </p>
                <button className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                  <Download className="size-3.5" /> Download PDF
                </button>
              </div>
            ) : null}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Report library" subtitle="Previously published packs" />
            <div className="divide-y divide-border">
              {REPORTS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setPreview(r)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-accent/60"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.id} · {r.period} · generated {r.generated} · {r.pages} pages
                    </p>
                  </div>
                  <Pill tone="neutral">{r.scope}</Pill>
                </button>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Trend snapshot" subtitle="Approvals vs non-conformities by month" />
            <div className="flex items-end gap-4 px-5 py-6">
              {KPI_TREND.map((k) => (
                <div key={k.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-28 w-full items-end justify-center gap-1">
                    <div className="w-4 rounded-t-md bg-primary" style={{ height: `${(k.approvals / 20) * 100}%` }} />
                    <div className="w-4 rounded-t-md bg-warning" style={{ height: `${(k.nonconformities / 20) * 100}%` }} />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{k.month}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" /> Approvals
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-warning" /> Non-conformities
              </span>
            </div>
          </Panel>
        </div>
      </div>

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/45 backdrop-blur-sm" onClick={() => setPreview(null)} />
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-[0_30px_80px_-30px_rgba(16,30,61,0.7)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">{preview.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {preview.id} · {preview.scope}
                </p>
              </div>
              <button onClick={() => setPreview(null)} className="rounded-lg p-1 hover:bg-accent">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/50 text-center">
              <div>
                <FileText className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-2 text-xs font-medium">Document preview</p>
                <p className="text-[11px] text-muted-foreground">
                  {preview.pages} pages · {preview.period} · rendering disabled in demo build
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setPreview(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-medium"
              >
                Close
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
                <Download className="size-3.5" /> Download
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] tracking-wide text-muted-foreground uppercase">{label}</p>
      {children}
    </div>
  );
}
