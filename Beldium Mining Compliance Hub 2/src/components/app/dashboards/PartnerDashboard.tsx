import { Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, ClipboardList, FileWarning, ShieldAlert, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/prototype/store";
import { useOnboarding } from "@/lib/onboarding/store";

import { complianceTrend, licences, organisations } from "@/lib/prototype/data";
import { KpiCard, Panel, PageHeader } from "../primitives";
import { Chip, RiskChip, ScorePill, StatusChip } from "../chips";

export function PartnerDashboard() {
  const { sites, reviews, nonConformities, applications, activity, startReview } = useStore();
  const { partnerId, approvedCapabilities, verification } = useOnboarding();


  const openReviews = reviews.filter((r) => r.status !== "Completed");
  const openNc = nonConformities.filter((n) => n.status !== "Closed");
  const awaiting = nonConformities.filter((n) => n.status === "Awaiting Review");
  const avgScore = Math.round(sites.reduce((a, s) => a + s.complianceScore, 0) / sites.length);
  const riskSplit = (["Low", "Medium", "High"] as const).map((level) => ({
    name: level,
    value: sites.filter((s) => s.risk === level).length,
    fill: level === "Low" ? "var(--color-success)" : level === "Medium" ? "var(--color-warning)" : "var(--color-danger)",
  }));
  const expiring = licences
    .filter((l) => l.status === "Expiring" || l.status === "Expired")
    .map((l) => ({ ...l, site: sites.find((s) => s.id === l.siteId) }));

  return (
    <>
      {partnerId && verification === "Verified" && (
        <div className="mb-5 rounded-lg border border-success bg-success/25 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-sm font-semibold">Verified Beldium Compliance Partner</p>
            <Chip tone="success">{partnerId}</Chip>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {approvedCapabilities.length > 0
              ? `Active approved capabilities: ${approvedCapabilities.join(", ")}.`
              : "All standard compliance capabilities are active."}
          </p>
        </div>
      )}

      <PageHeader
        eyebrow="Mining Compliance Partner"
        title="Compliance dashboard"
        description="Portfolio position across assigned mining organisations and sites. Prototype data seeded for the Nigerian lithium corridor."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/app/reviews">
                <ClipboardList className="size-4" /> Review queue
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/sites/$siteId" params={{ siteId: "NL-024" }}>
                Open NL-024 review
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Sites under management" value={sites.length} hint={`${sites.filter((s) => s.status === "Under Review").length} currently under review`} icon={<TrendingUp className="size-4" />} />
        <KpiCard label="Average compliance score" value={`${avgScore}/100`} hint="Weighted across all ten factors" tone={avgScore >= 80 ? "success" : "warning"} />
        <KpiCard label="Pending reviews" value={openReviews.length} hint={`${openReviews.filter((r) => r.priority === "High").length} high priority`} tone="warning" icon={<ClipboardList className="size-4" />} />
        <KpiCard label="Open non-conformities" value={openNc.length} hint={`${awaiting.length} awaiting your decision`} tone="danger" icon={<AlertTriangle className="size-4" />} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel title="Portfolio compliance trend" description="Average score against inspections completed and non-conformities open." bodyClassName="p-4">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={complianceTrend} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" />
              <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="score" name="Avg score" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="nonConformities" name="Open NCRs" stroke="var(--color-chart-4)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="inspections" name="Inspections" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Risk distribution" description="Sites by current risk band." bodyClassName="p-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={riskSplit} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3}>
                {riskSplit.map((r) => (
                  <Cell key={r.name} fill={r.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 space-y-2">
            {riskSplit.map((r) => (
              <li key={r.name} className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: r.fill }} /> {r.name} risk
                </span>
                <span className="font-semibold tabular-nums">{r.value}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel
          title="Pending review queue"
          description="Ordered by due date. Opening a review takes you into the mine review workflow."
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/reviews">View all</Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openReviews.slice(0, 6).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.subject}
                    <p className="text-xs text-muted-foreground">{r.type}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.siteId}</TableCell>
                  <TableCell>
                    <StatusChip value={r.priority} />
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{r.due}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline" onClick={() => startReview(r.id)}>
                      <Link to="/app/sites/$siteId" params={{ siteId: r.siteId }}>
                        Open
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>

        <div className="space-y-5">
          <Panel title="Expiring & expired licences" description="Renewal watchlist." bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {expiring.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{l.number}</p>
                    <p className="truncate text-xs text-muted-foreground">{l.site?.name}</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <CalendarClock className="size-3" /> Expires {l.expiry}
                    </p>
                  </div>
                  <StatusChip value={l.status} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Awaiting your decision" description="Corrective actions submitted by operators." bodyClassName="p-0">
            {awaiting.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">Nothing awaiting a decision.</p>
            ) : (
              <ul className="divide-y divide-border">
                {awaiting.map((n) => (
                  <li key={n.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{n.ref}</span>
                      <StatusChip value={n.severity} />
                    </div>
                    <p className="mt-1 text-sm font-medium">{n.title}</p>
                    <Button asChild size="sm" variant="outline" className="mt-2">
                      <Link to="/app/nonconformities">Review submission</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel title="Organisation compliance" description="Scores and risk bands by mining organisation." bodyClassName="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={organisations.map((o) => ({ name: o.name.split(" ")[0], score: o.complianceScore }))} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" />
              <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
              <Bar dataKey="score" name="Compliance score" radius={[4, 4, 0, 0]} fill="var(--color-chart-1)" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {organisations.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                <span className="text-sm font-medium">{o.name}</span>
                <span className="flex items-center gap-2">
                  <ScorePill score={o.complianceScore} />
                  <RiskChip value={o.risk} />
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recent activity" description="Every reviewer action is written to the audit trail." bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {activity.slice(0, 8).map((a) => (
              <li key={a.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{a.action}</p>
                  <Chip tone={a.tone === "positive" ? "success" : a.tone === "negative" ? "danger" : a.tone === "warning" ? "warning" : "neutral"}>
                    {a.target ?? "—"}
                  </Chip>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                  {a.actor} · {a.at}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Applications in flight" description="Intake pipeline with SLA position." bodyClassName="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">SLA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.slice(0, 5).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.ref}</TableCell>
                  <TableCell className="text-sm">{a.type}</TableCell>
                  <TableCell>
                    <StatusChip value={a.status} />
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{a.slaDays ? `${a.slaDays} d left` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>

        <Panel title="Escalation watchlist" description="Sites with a High risk band or critical findings." bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {sites
              .filter((s) => s.risk === "High" || s.complianceScore < 70)
              .map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.state} State · {s.mineral}
                    </p>
                  </div>
                  <span className="flex items-center gap-2">
                    <ScorePill score={s.complianceScore} />
                    <RiskChip value={s.risk} />
                    <Button asChild size="sm" variant="outline">
                      <Link to="/app/sites/$siteId" params={{ siteId: s.id }}>
                        Review
                      </Link>
                    </Button>
                  </span>
                </li>
              ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Environmental breaches open" value={2} hint="Doka Stream turbidity, Oke-Ogun dust" tone="danger" icon={<ShieldAlert className="size-4" />} />
        <KpiCard label="Documents pending verification" value={5} hint="Across 3 organisations" tone="warning" icon={<FileWarning className="size-4" />} />
        <KpiCard label="Inspections next 30 days" value={2} hint="1 overdue verification visit" tone="warning" icon={<CalendarClock className="size-4" />} />
      </div>
    </>
  );
}
