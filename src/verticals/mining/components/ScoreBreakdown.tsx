import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { MineSite, ScoreFactor } from "@/verticals/mining/types";
import { Panel } from "./primitives";
import { RiskChip } from "./chips";

const trendIcon = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus };

/**
 * The backend scores a site from its ten review sections (weight × section
 * score) and only falls back to explicit score factors when no section carries
 * a weight, so the sections are the breakdown whenever no factors were added.
 */
function sectionFactors(site: MineSite): ScoreFactor[] {
  return site.sections
    .filter((s) => s.weight > 0)
    .map((s) => ({
      id: `section:${s.key}`,
      label: s.title,
      weight: s.weight,
      score: s.score,
      reason: s.decisionNote || `Section ${s.status.toLowerCase()}.`,
      trend: "flat" as const,
    }));
}

export function ScoreBreakdown({ site }: { site: MineSite }) {
  const fromSections = site.scoreFactors.length === 0;
  const factors = fromSections ? sectionFactors(site) : site.scoreFactors;
  const totalWeight = factors.reduce((a, f) => a + f.weight, 0);
  const weighted = totalWeight
    ? factors.reduce((a, f) => a + f.score * f.weight, 0) / totalWeight
    : 0;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Panel
        title="Compliance score breakdown"
        description={
          fromSections
            ? `Weighted across the ${factors.length} review sections. Each section contributes weight × section score, and moves as sections are verified, rejected or flagged.`
            : `Weighted across ${factors.length} explainable factors. Each factor contributes weight × score.`
        }
      >
        {factors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No review sections carry a weight for this site yet.
          </p>
        ) : (
          <div className="space-y-4">
            {factors.map((f) => {
              const Trend = trendIcon[f.trend];
              const tone =
                f.score >= 80 ? "bg-success" : f.score >= 60 ? "bg-warning" : "bg-danger";
              return (
                <div key={f.id} className="rounded-md border border-border p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{f.label}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>weight {f.weight}%</span>
                      <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-foreground">
                        {f.score}/100 <Trend className="size-3.5" />
                      </span>
                      <span className="tabular-nums">
                        +{totalWeight ? ((f.score * f.weight) / totalWeight).toFixed(1) : "0.0"} pts
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${tone}`}
                      style={{ width: `${f.score}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{f.reason}</p>
                </div>
              );
            })}
            <div className="flex items-center justify-between rounded-md bg-brand-soft/60 px-3.5 py-3">
              <p className="text-sm font-semibold text-brand">Weighted composite score</p>
              <p className="font-display text-lg font-semibold tabular-nums text-brand">
                {weighted.toFixed(0)}/100
              </p>
            </div>
          </div>
        )}
      </Panel>

      <Panel
        title={`Why this site is rated ${site.risk} risk`}
        description="Reasoning generated from the factors above."
      >
        <div className="mb-4">
          <RiskChip value={site.risk} />
        </div>
        <ul className="space-y-3">
          {site.riskReasons.map((r, i) => (
            <li key={i} className="flex gap-2.5 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
              <span className="text-muted-foreground">{r}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 space-y-1.5 rounded-md border border-border p-3.5 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Banding rules</p>
          <p>80 – 100 → Low risk · 60 – 79 → Medium risk · below 60 → High risk</p>
          <p>Any active Critical non-conformity escalates the band to High regardless of score.</p>
        </div>
      </Panel>
    </div>
  );
}
