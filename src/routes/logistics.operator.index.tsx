import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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

  const restricted = companies.filter((c) => c.status === "Rejected");
  const criticalDocs = expiringDocuments.filter((d) => d.daysLeft <= 10);
  const snapshot = [
    { label: "Approved", value: counts.approved, color: "#2563EB" },
    { label: "Pending", value: counts.pending, color: "#FBBF24" },
    { label: "Rejected", value: counts.rejected, color: "#F87171" },
  ];
  const riskDistribution = [
    { band: "Low", value: companies.filter((c) => c.risk === "Low").length, color: "#B0E2CD" },
    { band: "Medium", value: companies.filter((c) => c.risk === "Medium").length, color: "#FBBF24" },
    { band: "High", value: companies.filter((c) => c.risk === "High").length, color: "#F87171" },
  ];
  const medianScore = companies.length
    ? [...companies].map((c) => c.riskScore).sort((a, b) => a - b)[Math.floor(companies.length / 2)]
    : null;

  return (
    <AppShell
      role="operator"
      breadcrumbs={[{ label: "Compliance Operations" }, { label: "Dashboard" }]}
      search={{ value: query, onChange: setQuery, placeholder: "Search the attention queue…" }}
    >
      <PageHeader
        title="Compliance dashboard"
        description={`Continuous assurance across ${companies.length} registered logistics operators. ${criticalDocs.length} credential${criticalDocs.length === 1 ? "" : "s"} expire within 10 days.`}
        actions={
          <>
            <Link
              to="/logistics/operator/applications"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-[var(--brand)] transition hover:border-[var(--link)]/40"
            >
              <ClipboardList className="h-3.5 w-3.5" /> All applications
            </Link>
            {queue[0] && (
              <Link
                to="/logistics/operator/applications/$companyId"
                params={{ companyId: queue[0].id }}
                search={{ tab: "overview" as const }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-medium text-white transition hover:bg-[var(--brand)]/90"
              >
                Continue active review <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </>
        }
      />

      {(restricted.length > 0 || criticalDocs.length > 0) && (
        <ComplianceBanner
          tone="warning"
          title={`Continuous compliance: ${restricted.length} operator${restricted.length === 1 ? "" : "s"} restricted, ${criticalDocs.length} credential${criticalDocs.length === 1 ? "" : "s"} critical`}
          body={
            restricted.length > 0
              ? `${restricted[0]!.name} is ${restricted[0]!.status.toLowerCase()}.${criticalDocs[0] ? ` ${criticalDocs[0].document} expires in ${criticalDocs[0].daysLeft} days.` : ""}`
              : `${criticalDocs[0]!.document} expires in ${criticalDocs[0]!.daysLeft} days.`
          }
        />
      )}

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
          title="Register snapshot"
          description="Current decisions across the register"
          className="xl:col-span-2"
          bodyClassName="p-4"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={snapshot} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F2" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5B6B85" }} stroke="#E2E8F2" />
                <YAxis tick={{ fontSize: 12, fill: "#5B6B85" }} stroke="#E2E8F2" />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F2", fontSize: 12 }}
                  labelStyle={{ color: "#101E3D", fontWeight: 600 }}
                />
                <Bar dataKey="value" name="Companies" radius={[6, 6, 0, 0]}>
                  {snapshot.map((s) => (
                    <Cell key={s.label} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
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
                { label: "Median score", value: medianScore !== null ? `${medianScore} / 100` : "-" },
                { label: "Restricted operators", value: `${restricted.length}` },
                { label: "Registered operators", value: `${companies.length}` },
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
