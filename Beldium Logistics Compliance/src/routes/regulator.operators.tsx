import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/beldium/AppShell";
import { PageHeader, Panel, Pill, ReadOnlyNotice, StatusBadge } from "@/components/beldium/bits";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/regulator/operators")({
  head: () => ({
    meta: [
      { title: "Registered operators — Beldium Regulatory Portal" },
      { name: "description", content: "Register of logistics operators verified through Beldium, with fleet size and risk band." },
      { property: "og:title", content: "Registered operators — Beldium Regulatory Portal" },
      { property: "og:description", content: "Read-only register of Nigerian logistics operators." },
    ],
  }),
  component: RegulatorOperators,
});

function RegulatorOperators() {
  const { companies } = useApp();
  const [query, setQuery] = React.useState("");
  const rows = companies.filter((c) => [c.name, c.id, c.location, c.status].join(" ").toLowerCase().includes(query.toLowerCase()));

  return (
    <AppShell
      role="regulator"
      breadcrumbs={[{ label: "Regulatory Oversight", to: "/regulator" }, { label: "Registered operators" }]}
      search={{ value: query, onChange: setQuery, placeholder: "Search operators…" }}
    >
      <PageHeader title="Registered operators" description="Read-only register maintained by Beldium compliance operations." />
      <ReadOnlyNotice text="You can view and export this register. Editing operator records is not permitted from the regulatory portal." />
      <Panel className="mt-4" bodyClassName="p-0" title="Operator register" description={`${rows.length} operators`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3 font-semibold">Operator</th>
                <th className="px-3 py-3 font-semibold">Beldium ID</th>
                <th className="px-3 py-3 font-semibold">Location</th>
                <th className="px-3 py-3 font-semibold">Fleet</th>
                <th className="px-3 py-3 font-semibold">Drivers</th>
                <th className="px-3 py-3 font-semibold">Risk</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-muted/40">
                  <td className="px-5 py-3 text-sm font-medium text-[var(--brand)]">{c.name}</td>
                  <td className="px-3 py-3 text-xs">{c.id}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{c.location}</td>
                  <td className="px-3 py-3 text-xs">{c.fleetSize}</td>
                  <td className="px-3 py-3 text-xs">{c.driverCount}</td>
                  <td className="px-3 py-3">
                    <Pill tone={c.risk === "High" ? "danger" : c.risk === "Medium" ? "warning" : "success"}>
                      {c.risk} · {c.riskScore}
                    </Pill>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
