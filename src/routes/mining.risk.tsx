import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/verticals/mining/store";
import type { MineSite, RiskLevel } from "@/verticals/mining/types";
import { KpiCard, PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { RiskChip, ScorePill, StatusChip } from "@/verticals/mining/components/chips";
import {
  ListState,
  ListToolbar,
  matchesFilters,
  useListFilters,
} from "@/verticals/mining/components/listkit";

export const Route = createFileRoute("/mining/risk")({ component: RiskPage });

const RISK_ORDER: Record<RiskLevel, number> = { High: 0, Medium: 1, Low: 2 };

/** The three weakest scoring factors, worst first. */
function weakest(site: MineSite) {
  return [...site.scoreFactors].sort((a, b) => a.score - b.score).slice(0, 3);
}

function RiskPage() {
  const { sites, isLoading, error } = useStore();
  const [filters, setFilters] = useListFilters();
  const [sort, setSort] = useState<"risk" | "score">("risk");

  const rows = sites
    .filter((s) =>
      matchesFilters(filters, { status: `${s.risk}` }, [
        s.name,
        s.code,
        s.mineral,
        s.state,
        ...s.riskReasons,
      ]),
    )
    .sort((a, b) =>
      sort === "risk"
        ? RISK_ORDER[a.risk] - RISK_ORDER[b.risk] || a.complianceScore - b.complianceScore
        : a.complianceScore - b.complianceScore,
    );
  const band = (r: RiskLevel) => sites.filter((s) => s.risk === r).length;
  const average = sites.length
    ? Math.round(sites.reduce((sum, s) => sum + s.complianceScore, 0) / sites.length)
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Assurance"
        title="Risk"
        description="Every site ranked by risk band and compliance score, with the reasons and weakest factors behind each score."
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="High risk" value={band("High")} tone="danger" />
        <KpiCard label="Medium risk" value={band("Medium")} tone="warning" />
        <KpiCard label="Low risk" value={band("Low")} tone="success" />
        <KpiCard label="Average score" value={sites.length ? `${average}/100` : "—"} />
      </div>
      <ListToolbar
        filters={filters}
        onChange={setFilters}
        statuses={["High", "Medium", "Low"]}
        showSite={false}
        placeholder="Search site, mineral, state or reason"
      >
        <Button
          size="sm"
          variant={sort === "risk" ? "default" : "outline"}
          onClick={() => setSort("risk")}
        >
          Sort by risk
        </Button>
        <Button
          size="sm"
          variant={sort === "score" ? "default" : "outline"}
          onClick={() => setSort("score")}
        >
          Sort by score
        </Button>
      </ListToolbar>
      <ListState
        loading={isLoading}
        error={error}
        empty={rows.length === 0}
        emptyTitle="No sites to rank"
      >
        <Panel bodyClassName="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Why</TableHead>
                  <TableHead>Weakest factors</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.name}
                      <p className="text-xs text-muted-foreground">
                        {s.mineral} · {s.state}
                      </p>
                    </TableCell>
                    <TableCell>
                      <RiskChip value={s.risk} />
                    </TableCell>
                    <TableCell>
                      <ScorePill score={s.complianceScore} />
                    </TableCell>
                    <TableCell className="max-w-xs text-xs text-muted-foreground">
                      {s.riskReasons.length ? (
                        <ul className="list-disc space-y-0.5 pl-4">
                          {s.riskReasons.slice(0, 3).map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {weakest(s).length ? (
                        <ul className="space-y-0.5">
                          {weakest(s).map((f) => (
                            <li key={f.id}>
                              {f.label}{" "}
                              <span className="tabular-nums text-muted-foreground">
                                ({f.score})
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground">From review sections</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusChip value={s.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/mining/sites/$siteId" params={{ siteId: s.id }}>
                          Score breakdown
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>
      </ListState>
    </>
  );
}
