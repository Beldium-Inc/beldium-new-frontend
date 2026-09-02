import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/beldium/AppShell";
import { PageHeader, Panel, Pill, ReadOnlyNotice } from "@/components/beldium/bits";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/regulator/alerts")({
  head: () => ({
    meta: [
      { title: "Regulatory alerts — Beldium Regulatory Portal" },
      { name: "description", content: "Restrictions, high-risk findings and enforcement-relevant alerts across registered operators." },
      { property: "og:title", content: "Regulatory alerts — Beldium Regulatory Portal" },
      { property: "og:description", content: "Enforcement-relevant compliance alerts." },
    ],
  }),
  component: RegulatorAlerts,
});

function RegulatorAlerts() {
  const { companies, audit } = useApp();
  const restricted = companies.filter((c) => c.scores.mineral < 60 || c.risk === "High");

  return (
    <AppShell role="regulator" breadcrumbs={[{ label: "Regulatory Oversight", to: "/regulator" }, { label: "Regulatory alerts" }]}>
      <PageHeader title="Regulatory alerts" description="Active restrictions and elevated-risk operators flagged by continuous monitoring." />
      <ReadOnlyNotice text="Alerts are informational. Enforcement action is taken outside the Beldium platform." />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Active restrictions" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {restricted.map((c) => (
              <li key={c.id} className="flex items-start gap-3 px-5 py-3.5">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--brand)]">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.scores.mineral < 60 ? "Mineral haulage restricted pending authorisation. " : ""}
                    Risk score {c.riskScore}/100 ({c.risk}).
                  </p>
                </div>
                <Pill tone={c.risk === "High" ? "danger" : "warning"}>{c.risk}</Pill>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Monitoring events" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {audit.filter((a) => a.role === "System" || /Restriction|Expiry/.test(a.action)).map((a) => (
              <li key={a.id} className="px-5 py-3">
                <p className="text-sm font-medium text-[var(--brand)]">{a.action}</p>
                <p className="text-xs text-muted-foreground">
                  {a.target} · {a.outcome}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{a.at}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
