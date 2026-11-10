import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, CircleAlert, CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMiningChecklist } from "@/lib/api/mining-queries";
import { useSiteDetail, useStore } from "@/verticals/mining/store";
import type { MineSite, ReviewStatus } from "@/verticals/mining/types";
import { EmptyState, PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { RiskChip, ScorePill, StatusChip } from "@/verticals/mining/components/chips";
import { ListState } from "@/verticals/mining/components/listkit";

export const Route = createFileRoute("/mining/compliance")({ component: CompliancePage });

const NEEDS_YOU: ReviewStatus[] = ["Rejected", "Info Requested", "Flagged"];

function CompliancePage() {
  const { sites, isLoading, error } = useStore();
  const checklist = useMiningChecklist();
  const labels = new Map(
    (checklist.data?.sections ?? []).map((sec) => [sec.key as string, sec.label]),
  );

  return (
    <>
      <PageHeader
        eyebrow="Compliance"
        title="My compliance"
        description="Where each of your sites stands in review: section by section, what is verified and what still needs you."
      />
      <ListState
        loading={isLoading}
        error={error}
        empty={sites.length === 0}
        emptyTitle="No sites registered yet"
        emptyDescription="Register a site from the Miner Portal to start its compliance review."
      >
        <div className="space-y-5">
          {sites.map((s) => (
            <SiteCompliance key={s.id} site={s} labels={labels} />
          ))}
        </div>
      </ListState>
      <Panel
        title="What the review asks for"
        description="The evidence the compliance desk checks in each section."
        className="mt-5"
      >
        {checklist.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !checklist.data?.sections.length ? (
          <EmptyState title="The checklist is not available" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {checklist.data.sections.map((section) => (
              <div key={section.key} className="rounded-md border border-border p-4">
                <p className="font-display text-sm font-semibold">{section.label}</p>
                {(section.documents ?? []).length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs">
                    {(section.documents ?? []).map((d) => (
                      <li key={d.name} className="flex justify-between gap-2">
                        <span>{d.name}</span>
                        <span className="text-muted-foreground">
                          {d.issuer}
                          {d.expires ? " · expires" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.prompts.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs">
                    {section.prompts.map((p) => (
                      <li key={p.label} className="flex justify-between gap-2">
                        <span>{p.label}</span>
                        <span className="text-muted-foreground">
                          {p.required ? "Required" : "Optional"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

function SectionIcon({ status }: { status: ReviewStatus }) {
  if (status === "Verified") return <CheckCircle2 className="size-4 text-success-foreground" />;
  if (NEEDS_YOU.includes(status)) return <CircleAlert className="size-4 text-danger-foreground" />;
  return <CircleDashed className="size-4 text-muted-foreground" />;
}

function SiteCompliance({ site, labels }: { site: MineSite; labels: Map<string, string> }) {
  const { site: detail, isLoading } = useSiteDetail(site.id);
  const sections = detail?.sections ?? [];
  const verified = sections.filter((s) => s.status === "Verified").length;
  const needsYou = sections.filter((s) => NEEDS_YOU.includes(s.status));
  const checks = Object.entries(site.verification) as [keyof MineSite["verification"], boolean][];

  return (
    <Panel
      title={site.name}
      description={`${site.code} · ${site.mineral} · ${site.lga}, ${site.state}`}
      actions={
        <>
          <StatusChip value={site.status} />
          <ScorePill score={site.complianceScore} />
          <RiskChip value={site.risk} />
          <Button asChild size="sm" variant="outline">
            <Link to="/mining/sites/$siteId" params={{ siteId: site.id }}>
              Open site
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">Sections verified</span>
              <span className="font-semibold tabular-nums">
                {isLoading ? "…" : `${verified} of ${sections.length}`}
              </span>
            </div>
            <Progress value={sections.length ? (verified / sections.length) * 100 : 0} />
          </div>
          <ul className="space-y-1.5 text-sm">
            {checks.map(([key, ok]) => (
              <li key={key} className="flex items-center gap-2">
                {ok ? (
                  <CheckCircle2 className="size-4 text-success-foreground" />
                ) : (
                  <CircleDashed className="size-4 text-muted-foreground" />
                )}
                <span className="capitalize">{key === "gps" ? "GPS location" : key} verified</span>
              </li>
            ))}
          </ul>
          {needsYou.length > 0 && (
            <p className="rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-xs">
              {needsYou.length} section{needsYou.length === 1 ? " needs" : "s need"} your attention.
              See Action Required.
            </p>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading sections…</p>}
          {sections.map((sec) => (
            <div
              key={sec.key}
              className="flex items-start gap-2 rounded-md border border-border p-2.5"
            >
              <SectionIcon status={sec.status} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">
                    {sec.title && sec.title !== sec.key
                      ? sec.title
                      : (labels.get(sec.key) ?? sec.title)}
                  </p>
                  <span className="text-xs tabular-nums text-muted-foreground">{sec.score}</span>
                </div>
                <StatusChip value={sec.status} className="mt-1" />
                {sec.decisionNote && NEEDS_YOU.includes(sec.status) && (
                  <p className="mt-1 text-xs text-muted-foreground">{sec.decisionNote}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
