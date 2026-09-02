import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/beldium/AppShell";
import { PageHeader, Panel, Pill } from "@/components/beldium/bits";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/operator/audit")({
  head: () => ({
    meta: [
      { title: "Audit history — Beldium Compliance Operations" },
      { name: "description", content: "Immutable audit trail of every compliance action across the Beldium platform." },
      { property: "og:title", content: "Audit history — Beldium Compliance Operations" },
      { property: "og:description", content: "Who did what, when, and with what outcome." },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const { audit } = useApp();
  const [query, setQuery] = React.useState("");
  const rows = audit.filter((a) =>
    [a.actor, a.action, a.target, a.outcome, a.role].join(" ").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <AppShell
      role="operator"
      breadcrumbs={[{ label: "Compliance Operations", to: "/operator" }, { label: "Audit history" }]}
      search={{ value: query, onChange: setQuery, placeholder: "Search the audit trail…" }}
    >
      <PageHeader title="Audit history" description="Every action taken by operators, partners, regulators and the platform itself." />
      <Panel bodyClassName="p-0" title="Audit trail" description={`${rows.length} entries`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3 font-semibold">Timestamp</th>
                <th className="px-3 py-3 font-semibold">Actor</th>
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 font-semibold">Action</th>
                <th className="px-3 py-3 font-semibold">Target</th>
                <th className="px-5 py-3 font-semibold">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-muted/40">
                  <td className="px-5 py-3 text-xs whitespace-nowrap text-muted-foreground">{a.at}</td>
                  <td className="px-3 py-3 text-xs font-medium text-[var(--brand)]">{a.actor}</td>
                  <td className="px-3 py-3 text-xs">
                    <Pill tone={a.role === "System" ? "info" : a.role === "Regulator" ? "neutral" : "success"}>{a.role}</Pill>
                  </td>
                  <td className="px-3 py-3 text-xs">{a.action}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{a.target}</td>
                  <td className="px-5 py-3 text-xs">{a.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
