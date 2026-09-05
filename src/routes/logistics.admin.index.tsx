import { createFileRoute } from "@tanstack/react-router";
import { Building2, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/verticals/logistics/AppShell";
import { PageHeader, Panel, Pill, StatCard } from "@/verticals/logistics/bits";
import { useApp } from "@/verticals/logistics/store";

export const Route = createFileRoute("/logistics/admin/")({
  head: () => ({
    meta: [
      { title: "Admin overview | Beldium Platform Administration" },
      { name: "description", content: "Platform-level view of Beldium roles, tenants and compliance configuration." },
      { property: "og:title", content: "Admin overview | Beldium Platform Administration" },
      { property: "og:description", content: "Role separation and platform configuration for Beldium." },
    ],
  }),
  component: AdminOverview,
});

const ROLES = [
  { role: "Compliance Operator", users: 6, perms: ["Review applications", "Verify documents", "Issue decisions"] },
  { role: "Logistics Partner", users: 42, perms: ["Manage own company", "Upload documents", "Respond to requests"] },
  { role: "Regulator", users: 4, perms: ["Read-only register", "Export reports"] },
  { role: "Beldium Admin", users: 2, perms: ["Manage users & roles", "Configure check domains"] },
];

function AdminOverview() {
  const { companies, audit } = useApp();

  return (
    <AppShell role="admin" breadcrumbs={[{ label: "Beldium Admin" }, { label: "Overview" }]}>
      <PageHeader title="Platform administration" description="Placeholder admin view demonstrating role separation across the Beldium prototype." />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Tenants" value={companies.length} icon={Building2} tone="info" />
        <StatCard label="Platform users" value={54} icon={Users} tone="info" />
        <StatCard label="Audit events" value={audit.length} icon={ShieldCheck} tone="success" />
      </div>
      <Panel className="mt-4" title="Roles & permissions" bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {ROLES.map((r) => (
            <li key={r.role} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--brand)]">{r.role}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {r.perms.map((p) => (
                    <Pill key={p} tone="neutral">
                      {p}
                    </Pill>
                  ))}
                </div>
              </div>
              <Pill tone="info">{r.users} users</Pill>
            </li>
          ))}
        </ul>
      </Panel>
    </AppShell>
  );
}
