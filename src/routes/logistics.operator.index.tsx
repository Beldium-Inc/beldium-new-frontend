import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileClock,
  Inbox,
  MessageSquareWarning,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { AppShell, ComplianceBanner } from "@/verticals/logistics/AppShell";
import { KeyValue, PageHeader, Panel, Pill, RiskBadge, StatCard, StatusBadge } from "@/verticals/logistics/bits";
import { useApp } from "@/verticals/logistics/store";
import { complianceTrend, riskDistribution } from "@/verticals/logistics/mock-data";

export const Route = createFileRoute("/logistics/operator/")({
  head: () => ({
    meta: [
      { title: "Compliance dashboard | Beldium Operations" },
      { name: "description", content: "Attention queue, compliance trend and risk distribution for Beldium compliance operators." },
      { property: "og:title", content: "Compliance dashboard | Beldium Operations" },
      { property: "og:description", content: "Live attention cards, review queue and risk visualisation." },
    ],
  }),
  component: OperatorDashboard,
});

function OperatorDashboard() {
  const { companies, requests, notifications, expiringDocuments } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");

  const counts = {
    applications: companies.length,
    pending: companies.filter((c) => c.status === "Pending Review" || c.status === "Under Review").length,
    info: requests.filter((r) => r.status === "Open").length,
    expiring: expiringDocuments.length,
    high: companies.filter((c) => c.risk === "High").length,
    approved: companies.filter((c) => c.status === "Approved" || c.status === "Conditionally Approved").length,
    rejected: companies.filter((c) => c.status === "Rejected").length,
  };

  const queue = companies
    .filter((c) => ["Under Review", "Pending Review", "Awaiting Information", "Expiring Documents"].includes(c.status))
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.id.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.riskScore - b.riskScore);

  return (
    <AppShell
      role="operator"
      breadcrumbs={[{ label: "Compliance Operations" }, { label: "Dashboard" }]}
      search={{ value: query, onChange: setQuery, placeholder: "Search the attention queue…" }}
    >
      <PageHeader
        title="Compliance dashboard"
        description="Continuous assurance across 59 registered logistics operators. 3 credentials expire within 10 days."
        actions={
          <>
            <Link
              to="/logistics/operator/applications"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-[var(--brand)] transition hover:border-[var(--link)]/40"
            >
              <ClipboardList className="h-3.5 w-3.5" /> All applications
            </Link>
            <Link
              to="/logistics/operator/applications/$companyId"
              params={{ companyId: "BLD-2417" }}
              search={{ tab: "overview" as const }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-medium text-white transition hover:bg-[var(--brand)]/90"
            >
              Continue active review <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </>
        }
      />

      <ComplianceBanner
        tone="warning"
        title="Continuous compliance: 1 operator restricted, 3 credentials critical"
        body="Sahel Haulage & Minerals Ltd is restricted from mineral haulage until its Mining Cadastre licence is verified. Plateau Mineral Movers' fleet insurance expires in 8 days."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Applications" value={counts.applications} hint="Total in register" icon={Inbox} tone="info" onClick={() => navigate({ to: "/logistics/operator/applications" })} />
        <StatCard label="Pending reviews" value={counts.pending} hint="Awaiting operator action" icon={ClipboardList} tone="neutral" onClick={() => navigate({ to: "/logistics/operator/applications" })} />
        <StatCard label="Additional information" value={counts.info} hint="Open requests with partners" icon={MessageSquareWarning} tone="warning" onClick={() => navigate({ to: "/logistics/operator/requests" })} />
        <StatCard label="Expiring documents" value={counts.expiring} hint="Within 90 days" icon={FileClock} tone="warning" onClick={() => navigate({ to: "/logistics/operator/documents" })} />
        <StatCard label="High risk" value={counts.high} hint="Score below 60" icon={AlertOctagon} tone="danger" onClick={() => navigate({ to: "/logistics/operator/risk" })} />
        <StatCard label="Approved" value={counts.approved} hint="Incl. conditional approvals" icon={CheckCircle2} tone="success" onClick={() => navigate({ to: "/logistics/operator/applications" })} />
        <StatCard label="Rejected" value={counts.rejected} hint="Last 12 months" icon={XCircle} tone="danger" onClick={() => navigate({ to: "/logistics/operator/applications" })} />
        <StatCard label="Unread alerts" value={notifications.filter((n) => n.audience.includes("operator") && !n.read).length} hint="Platform notifications" icon={ShieldAlert} tone="info" onClick={() => navigate({ to: "/logistics/operator/notifications" })} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Panel
          title="Compliance trend"
          description="Decisions and average risk score by month"
          className="xl:col-span-2"
          bodyClassName="p-4"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complianceTrend} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F2" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5B6B85" }} stroke="#E2E8F2" />
                <YAxis tick={{ fontSize: 12, fill: "#5B6B85" }} stroke="#E2E8F2" />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F2", fontSize: 12 }}
                  labelStyle={{ color: "#101E3D", fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="approved" name="Approved" stroke="#2563EB" fill="url(#gApproved)" strokeWidth={2} />
                <Area type="monotone" dataKey="pending" name="Pending" stroke="#FBBF24" fill="url(#gPending)" strokeWidth={2} />
                <Line type="monotone" dataKey="avgRisk" name="Avg risk score" stroke="#101E3D" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Risk distribution" description="Registered operators by risk band" bodyClassName="p-4">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDistribution} dataKey="value" nameKey="band" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {riskDistribution.map((r) => (
                    <Cell key={r.band} fill={r.color} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F2", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 border-t border-border pt-4">
            <KeyValue
              items={[
                { label: "Median score", value: "84 / 100" },
                { label: "Restricted scopes", value: "2 operators" },
                { label: "SLA compliance", value: "91%" },
              ]}
            />
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Panel
          title="Attention queue"
          description="Ordered by lowest compliance score"
          className="xl:col-span-2"
          bodyClassName="p-0"
          actions={<Pill tone="warning">{queue.length} cases</Pill>}
        >
          <ul className="divide-y divide-border">
            {queue.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <Link
                    to="/logistics/operator/applications/$companyId"
                    params={{ companyId: c.id }}
                    search={{ tab: "overview" as const }}
                    className="font-display text-sm font-semibold text-[var(--brand)] hover:text-[var(--link)]"
                  >
                    {c.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {c.id} · {c.location}, Nigeria · {c.fleetSize} vehicles · {c.driverCount} drivers
                  </p>
                </div>
                <StatusBadge status={c.status} />
                <RiskBadge risk={c.risk} score={c.riskScore} />
                <Link
                  to="/logistics/operator/applications/$companyId"
                  params={{ companyId: c.id }}
                  search={{ tab: "overview" as const }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--link)] hover:underline"
                >
                  Open review <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
            {queue.length === 0 ? <li className="px-5 py-8 text-center text-sm text-muted-foreground">No cases match your search.</li> : null}
          </ul>
        </Panel>

        <Panel title="Critical expiries" description="Automatic monitoring across the register" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {expiringDocuments.slice(0, 6).map((d) => (
              <li key={d.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[var(--brand)]">{d.document}</p>
                    <p className="text-xs text-muted-foreground">{d.company}</p>
                  </div>
                  <Pill tone={d.severity === "critical" ? "danger" : d.severity === "warning" ? "warning" : "neutral"}>
                    {d.daysLeft}d
                  </Pill>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-5 py-3">
            <Link to="/logistics/operator/documents" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--link)] hover:underline">
              View all expiring documents <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
