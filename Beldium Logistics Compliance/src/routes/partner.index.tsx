import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  MessageSquareWarning,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { AppShell, ComplianceBanner } from "@/components/beldium/AppShell";
import { KeyValue, PageHeader, Panel, Pill, ScoreBar, StatCard, StatusBadge } from "@/components/beldium/bits";
import { useApp } from "@/lib/app-state";
import { PRIMARY_COMPANY_ID } from "@/lib/mock-data";

export const Route = createFileRoute("/partner/")({
  head: () => ({
    meta: [
      { title: "Partner dashboard — Beldium Logistics Partner Portal" },
      { name: "description", content: "Verification status, outstanding information requests and compliance health for your logistics company." },
      { property: "og:title", content: "Partner dashboard — Beldium Logistics Partner Portal" },
      { property: "og:description", content: "Track your Beldium verification and respond to compliance requests." },
    ],
  }),
  component: PartnerDashboard,
});

function PartnerDashboard() {
  const { companies, requests, notifications } = useApp();
  const company = companies.find((c) => c.id === PRIMARY_COMPANY_ID)!;
  const open = requests.filter((r) => r.companyId === company.id && r.status === "Open");

  return (
    <AppShell role="partner" breadcrumbs={[{ label: "Sahel Haulage & Minerals Ltd" }, { label: "Dashboard" }]}>
      <PageHeader
        title="Compliance overview"
        description={`Beldium ID ${company.id} · application submitted ${company.submitted} · reviewer ${company.reviewer}`}
        actions={<StatusBadge status={company.status} />}
      />

      <ComplianceBanner
        tone="warning"
        title="Mineral haulage restricted"
        body="Your mineral transport licence is outstanding. Mineral routes remain blocked on the Beldium platform until the Mining Cadastre Office licence is verified."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Verification status" value={company.status} icon={ShieldCheck} tone="info" />
        <StatCard label="Compliance score" value={`${company.riskScore}/100`} hint={`${company.risk} risk`} icon={CheckCircle2} tone="warning" />
        <StatCard label="Open information requests" value={open.length} hint="Action required" icon={MessageSquareWarning} tone="danger" />
        <StatCard label="Unread notices" value={notifications.filter((n) => n.audience.includes("partner") && !n.read).length} icon={AlertTriangle} tone="warning" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Outstanding information requests"
          description="Exactly what Beldium compliance still needs from you"
          bodyClassName="p-0"
          actions={
            <Link to="/partner/requests" className="text-xs font-medium text-[var(--link)] hover:underline">
              Open request centre
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {open.map((r) => (
              <li key={r.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-semibold text-[var(--brand)]">{r.reason}</span>
                  <Pill tone="warning">Due {r.due}</Pill>
                  <span className="ml-auto text-xs text-muted-foreground">{r.id}</span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{r.message}</p>
                <ul className="mt-2 space-y-1">
                  {r.items.map((i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-[var(--brand)]">
                      <FileText className="h-3.5 w-3.5 text-[var(--warning)]" /> {i}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/partner/requests"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--brand)]/90"
                >
                  Upload & reply <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
            {open.length === 0 ? (
              <li className="px-5 py-10 text-center text-sm text-muted-foreground">Nothing outstanding — you're all caught up.</li>
            ) : null}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel title="Compliance health">
            <div className="space-y-3">
              <ScoreBar label="Fleet" value={company.scores.fleet} />
              <ScoreBar label="Drivers" value={company.scores.drivers} />
              <ScoreBar label="Insurance" value={company.scores.insurance} />
              <ScoreBar label="Health & safety" value={company.scores.safety} />
              <ScoreBar label="Mineral transport" value={company.scores.mineral} />
            </div>
          </Panel>
          <Panel title="Company at a glance">
            <KeyValue
              items={[
                { label: "RC number", value: company.rcNumber },
                { label: "Head office", value: company.location },
                { label: "Fleet", value: `${company.fleetSize} vehicles` },
                { label: "Drivers", value: `${company.driverCount}` },
              ]}
            />
            <div className="mt-4 flex gap-2">
              <Link to="/partner/fleet" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-[var(--brand)] hover:border-[var(--link)]/50">
                <Truck className="h-3.5 w-3.5" /> Fleet
              </Link>
              <Link to="/partner/drivers" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-[var(--brand)] hover:border-[var(--link)]/50">
                <Users className="h-3.5 w-3.5" /> Drivers
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
