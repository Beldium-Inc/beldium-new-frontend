import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Loader2, X } from "lucide-react";
import { Panel, PanelHeader, PageHeader, Pill } from "@/verticals/processing/bpc";
import { useAppState } from "@/verticals/processing/store";
import { type ReportItem } from "@/verticals/processing/domain";
import type { ReportKind, ReportPeriod } from "@/lib/api/processing";
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

const KINDS: { value: ReportKind; label: string }[] = [
  { value: "national_compliance", label: "National compliance summary" },
  { value: "environmental_exceedances", label: "Environmental exceedance summary" },
  { value: "inspection_programme", label: "Inspection programme review" },
  { value: "non_conformity_register", label: "Non-conformity register" },
];

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "last_month", label: "Last month" },
  { value: "last_quarter", label: "Last quarter" },
  { value: "year_to_date", label: "Year to date" },
  { value: "all_time", label: "All time" },
];

function ReportsPage() {
  const { reports, regionalCompliance, kpiTrend, generateReport, capabilities } = useAppState();
  // The scope list is the regions actually on the register, so it grows with it.
  const scopes = React.useMemo(
    () => ["All regions", ...regionalCompliance.map((r) => r.region)],
    [regionalCompliance],
  );
  const [scope, setScope] = React.useState("All regions");
  const [kind, setKind] = React.useState<ReportKind>(KINDS[0]!.value);
  const [period, setPeriod] = React.useState<ReportPeriod>("last_quarter");
  const [preview, setPreview] = React.useState<ReportItem | null>(null);
  const [compiling, setCompiling] = React.useState(false);
  const [compiled, setCompiled] = React.useState<ReportItem | null>(null);
  const [failure, setFailure] = React.useState<string | null>(null);

  const compile = () => {
    setCompiling(true);
    setFailure(null);
    setCompiled(null);
    void generateReport({ kind, scope, period })
      .then(setCompiled)
      .catch((cause: Error) => setFailure(cause.message))
      .finally(() => setCompiling(false));
  };

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
                onChange={(e) => setKind(e.target.value as ReportKind)}
                className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-ring"
              >
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Scope">
              <div className="flex flex-wrap gap-1.5">
                {scopes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setScope(s)}
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
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium",
                      period === p.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Field>

            <button
              onClick={compile}
              disabled={compiling || !capabilities?.can_read_register}
              title={
                capabilities?.can_read_register
                  ? "Compile this report from the register"
                  : "Only the compliance desk and regulators can compile reports."
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              {compiling ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileText className="size-4" />
              )}
              {compiling ? "Compiling…" : "Generate report"}
            </button>

            {failure ? (
              <p className="rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-[11px] text-destructive-foreground">
                {failure}
              </p>
            ) : null}

            {compiled ? (
              <div className="rounded-2xl border border-border bg-success/25 px-4 py-3">
                <p className="text-xs font-medium">Report ready</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {compiled.id} · {compiled.title} · {compiled.period} · {compiled.pages}{" "}
                  {compiled.pages === 1 ? "page" : "pages"}
                </p>
                {compiled.fileUrl ? (
                  <a
                    href={compiled.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <Download className="size-3.5" /> Download PDF
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-[11px] text-muted-foreground">
                A report is a point-in-time extract: its figures are those held when it is compiled,
                and are not restated afterwards. Generating again produces a new document rather
                than updating this one.
              </p>
            )}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Report library" subtitle="Previously published packs" />
            <div className="divide-y divide-border">
              {reports.map((r) => (
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
              {kpiTrend.map((k) => (
                <div key={k.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-28 w-full items-end justify-center gap-1">
                    <div
                      className="w-4 rounded-t-md bg-primary"
                      style={{ height: `${(k.approvals / 20) * 100}%` }}
                    />
                    <div
                      className="w-4 rounded-t-md bg-warning"
                      style={{ height: `${(k.nonconformities / 20) * 100}%` }}
                    />
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
          <div
            className="absolute inset-0 bg-primary/45 backdrop-blur-sm"
            onClick={() => setPreview(null)}
          />
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
                  {preview.pages} {preview.pages === 1 ? "page" : "pages"} · {preview.period}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {preview.fileUrl ? "Download to open the document." : "No document was stored."}
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
              {preview.fileUrl ? (
                <a
                  href={preview.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
                >
                  <Download className="size-3.5" /> Download
                </a>
              ) : (
                <span
                  title="No document was stored for this report."
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground opacity-40"
                >
                  <Download className="size-3.5" /> No file stored
                </span>
              )}
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
