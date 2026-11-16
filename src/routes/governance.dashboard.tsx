import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { GOVERNANCE_SECTORS, useGovernanceDashboard, type GovernanceSector } from "@/lib/api";
import {
  LoadError,
  Loading,
  PageHeader,
  Panel,
  Stat,
  StatusBadge,
  formatDateTime,
  humanise,
  riskTone,
  selectClass,
} from "@/verticals/governance/ui";

export const Route = createFileRoute("/governance/dashboard")({ component: Dashboard });

function Dashboard() {
  const [sector, setSector] = useState<GovernanceSector>("all");
  const { data, isPending, error } = useGovernanceDashboard(sector);

  return (
    <>
      <PageHeader
        title="Executive Governance Dashboard"
        desc={`${GOVERNANCE_SECTORS.find((s) => s.value === sector)?.label}. Live figures from the governance register and every sector desk.`}
        actions={
          <select
            aria-label="Sector"
            value={sector}
            onChange={(e) => setSector(e.target.value as GovernanceSector)}
            className={`${selectClass} w-48`}
          >
            {GOVERNANCE_SECTORS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        }
      />
      {isPending ? (
        <Loading />
      ) : error ? (
        <LoadError error={error} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            <Stat
              label="Active policies"
              value={data.counts.active_policies}
              hint="View policies"
              to="/governance/policies"
            />
            <Stat
              label="Awaiting review"
              value={data.counts.awaiting_review}
              hint="Review queue"
              to="/governance/policies"
            />
            <Stat
              label="Open enterprise risks"
              value={data.counts.open_risks}
              hint="Risk register"
              to="/governance/risks"
            />
            <Stat
              label="Open sector findings"
              value={data.counts.sector_open_findings}
              hint="Compliance"
              to="/governance/compliance"
            />
            <Stat
              label="Delayed milestones"
              value={data.counts.delayed_milestones}
              hint="Roadmap"
              to="/governance/roadmap"
            />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Panel title="Risk trend, last six months" className="lg:col-span-2">
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={data.risk_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      name="Open at month end"
                      dataKey="open"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                    />
                    <Line
                      name="Escalated in month"
                      dataKey="escalated"
                      stroke="var(--chart-4)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="Top residual risks">
              {data.top_risks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open risks.</p>
              ) : (
                <ul className="space-y-3">
                  {data.top_risks.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 text-sm">
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-md font-mono text-xs ${riskTone(r.residual_score)}`}
                      >
                        {r.residual_score}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{r.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.reference} · {humanise(r.sector)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Sector open findings and expiring records" className="lg:col-span-2">
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={data.sectors}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      name="Open findings"
                      dataKey="open_findings"
                      fill="var(--chart-1)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      name="Expiring in 30 days"
                      dataKey="expiring_30d"
                      fill="var(--chart-3)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="Pending executive decisions">
              {data.pending_policies.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing is waiting for a decision.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {data.pending_policies.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <Link
                        to="/governance/policies"
                        search={{ open: p.id }}
                        className="truncate hover:text-primary"
                      >
                        {p.title}
                      </Link>
                      <StatusBadge value={p.status} label={p.status_label} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            {data.recent_activity.length > 0 && (
              <Panel title="Recent audit trail" className="lg:col-span-3">
                <ul className="space-y-1.5 font-mono text-xs text-muted-foreground">
                  {data.recent_activity.map((a) => (
                    <li key={a.id}>
                      {formatDateTime(a.created_at)} · {a.actor} · {humanise(a.event)}
                      {a.metadata["reference"] ? ` · ${a.metadata["reference"]}` : ""}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>
        </>
      )}
    </>
  );
}
