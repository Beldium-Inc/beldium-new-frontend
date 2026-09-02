import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, FileClock, ShieldAlert, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/beldium/AppShell";
import { PageHeader, Panel, Pill, ReadOnlyNotice, StatCard, StatusBadge } from "@/components/beldium/bits";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/regulator/")({
  head: () => ({
    meta: [
      { title: "Oversight overview — Beldium Regulatory Portal" },
      { name: "description", content: "Read-only regulatory view of registered logistics operators and their compliance standing." },
      { property: "og:title", content: "Oversight overview — Beldium Regulatory Portal" },
      { property: "og:description", content: "Regulatory oversight of Nigerian logistics operators on Beldium." },
    ],
  }),
  component: RegulatorOverview,
});

function RegulatorOverview() {
  const { companies, notifications } = useApp();
  const approved = companies.filter((c) => c.status === "Approved" || c.status === "Conditionally Approved");
  const highRisk = companies.filter((c) => c.risk === "High");

  return (
    <AppShell role="regulator" breadcrumbs={[{ label: "Regulatory Oversight" }, { label: "Overview" }]}>
      <PageHeader title="Oversight overview" description="Federal Road Safety Corps · read-only access to the Beldium compliance register." />
      <ReadOnlyNotice text="Regulatory access is read-only. Documents cannot be edited and compliance decisions cannot be made from this portal." />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered operators" value={companies.length} icon={Building2} tone="info" />
        <StatCard label="Verified / conditional" value={approved.length} icon={ShieldCheck} tone="success" />
        <StatCard label="High risk" value={highRisk.length} icon={ShieldAlert} tone="danger" />
        <StatCard label="Credentials expiring" value={companies.reduce((n, c) => n + c.documents.filter((d) => d.expires < "2026-11-01").length, 0)} icon={FileClock} tone="warning" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Operator standing" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {companies.slice(0, 8).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <Link to="/regulator/operators" className="text-sm font-medium text-[var(--brand)] hover:text-[var(--link)]">
                    {c.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {c.id} · {c.location} · {c.fleetSize} vehicles
                  </p>
                </div>
                <Pill tone={c.risk === "High" ? "danger" : c.risk === "Medium" ? "warning" : "success"}>{c.risk} risk · {c.riskScore}</Pill>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent regulatory alerts" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {notifications.filter((n) => n.audience.includes("regulator")).slice(0, 6).map((n) => (
              <li key={n.id} className="px-5 py-3">
                <p className="text-sm font-medium text-[var(--brand)]">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{n.at}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
