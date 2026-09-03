import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Gauge, TrendingDown, TrendingUp } from "lucide-react";
import { Panel, PanelHeader, PageHeader, Pill, ScoreBar, StatCard, statusTone } from "@/components/bpc";
import { PROCESSORS, REGIONAL_COMPLIANCE, KPI_TREND, processingTypeLabel } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/monitoring")({
  head: () => ({
    meta: [
      { title: "Compliance monitoring · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Continuous compliance monitoring by region, processing type and score band across registered processors.",
      },
      { property: "og:title", content: "Compliance monitoring · Beldium Processing Compliance" },
      {
        property: "og:description",
        content: "Continuous compliance monitoring across regions and processing types.",
      },
    ],
  }),
  component: MonitoringPage,
});

const BANDS = [
  { label: "Compliant (80–100)", min: 80, tone: "success" as const },
  { label: "Watch (60–79)", min: 60, tone: "warning" as const },
  { label: "At risk (< 60)", min: 0, tone: "danger" as const },
];

function MonitoringPage() {
  const [region, setRegion] = React.useState<string>("All regions");
  const regions = ["All regions", ...REGIONAL_COMPLIANCE.map((r) => r.region)];

  const banded = BANDS.map((b, i) => ({
    ...b,
    items: PROCESSORS.filter(
      (p) =>
        p.complianceScore >= b.min &&
        (i === 0 || p.complianceScore < BANDS[i - 1]!.min),
    ),
  }));

  return (
    <>
      <PageHeader
        eyebrow="Regulatory oversight"
        title="Compliance monitoring"
        description="Continuous view of processor standing. Scores blend documentary currency, inspection outcomes, environmental performance and open non-conformities."
        actions={
          <div className="flex flex-wrap gap-1.5">
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium",
                  region === r
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-accent",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mean national score" value="76" hint="+3 vs previous quarter" tone="success" icon={<TrendingUp className="size-4" />} />
        <StatCard label="Facilities on watch" value={12} hint="Score 60–79" tone="warning" icon={<Gauge className="size-4" />} />
        <StatCard label="At-risk processors" value={4} hint="Score below 60" tone="danger" icon={<TrendingDown className="size-4" />} />
        <StatCard label="Monitoring coverage" value="94%" hint="Facilities reporting on schedule" icon={<Gauge className="size-4" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {banded.map((b) => (
          <Panel key={b.label}>
            <PanelHeader title={b.label} subtitle={`${b.items.length} processors`} />
            <div className="divide-y divide-border">
              {b.items.map((p) => (
                <Link
                  key={p.id}
                  to="/app/processors/$id"
                  params={{ id: p.id }}
                  className="block px-5 py-3 hover:bg-accent/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium">{p.name}</p>
                    <Pill tone={b.tone}>{p.complianceScore}</Pill>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {p.state} State · {processingTypeLabel(p.processingType)}
                  </p>
                  <div className="mt-2">
                    <ScoreBar value={p.complianceScore} tone={b.tone} />
                  </div>
                </Link>
              ))}
              {b.items.length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-muted-foreground">None in band.</p>
              ) : null}
            </div>
          </Panel>
        ))}
      </div>

      <Panel>
        <PanelHeader
          title="Regional detail"
          subtitle="Standing distribution and monitoring load"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3 font-medium">Region</th>
                <th className="px-5 py-3 font-medium">Processors</th>
                <th className="px-5 py-3 font-medium">Compliant</th>
                <th className="px-5 py-3 font-medium">Conditional</th>
                <th className="px-5 py-3 font-medium">Suspended</th>
                <th className="px-5 py-3 font-medium">Average score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {REGIONAL_COMPLIANCE.filter((r) => region === "All regions" || r.region === region).map((r) => (
                <tr key={r.region} className="hover:bg-accent/50">
                  <td className="px-5 py-3 text-xs font-medium">{r.region}</td>
                  <td className="px-5 py-3 text-xs">{r.processors}</td>
                  <td className="px-5 py-3 text-xs">{r.compliant}</td>
                  <td className="px-5 py-3 text-xs">{r.conditional}</td>
                  <td className="px-5 py-3 text-xs">{r.suspended}</td>
                  <td className="px-5 py-3">
                    <Pill tone={statusTone(r.avgScore >= 78 ? "Approved" : r.avgScore >= 70 ? "Conditional" : "Suspended")}>
                      {r.avgScore}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Monitoring workload" subtitle="Inspections completed per month" />
        <div className="flex items-end gap-4 px-5 py-6">
          {KPI_TREND.map((k) => (
            <div key={k.month} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end justify-center">
                <div
                  className="w-8 rounded-t-lg bg-primary"
                  style={{ height: `${(k.inspections / 22) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground">{k.month}</span>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
