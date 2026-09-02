import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, GraduationCap, IdCard, Users } from "lucide-react";
import { AppShell } from "@/components/beldium/AppShell";
import { PageHeader, Panel, Pill, StatCard } from "@/components/beldium/bits";
import { useApp } from "@/lib/app-state";
import { PRIMARY_COMPANY_ID } from "@/lib/mock-data";
import type { Driver } from "@/lib/mock-data";

export const Route = createFileRoute("/partner/drivers")({
  head: () => ({
    meta: [
      { title: "Drivers — Beldium Logistics Partner Portal" },
      { name: "description", content: "Driver licences, medicals, training records and vehicle assignments for your haulage operation." },
      { property: "og:title", content: "Drivers — Beldium Logistics Partner Portal" },
      { property: "og:description", content: "Track driver credentials and training compliance." },
    ],
  }),
  component: DriversPage,
});

const tone = (s: Driver["status"]): "success" | "warning" | "danger" => (s === "Compliant" ? "success" : s === "Attention" ? "warning" : "danger");

function DriversPage() {
  const { companies } = useApp();
  const company = companies.find((c) => c.id === PRIMARY_COMPANY_ID)!;
  const [query, setQuery] = React.useState("");
  const drivers = company.drivers.filter((d) =>
    [d.name, d.licence, d.assignedVehicle, d.licenceClass].join(" ").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <AppShell
      role="partner"
      breadcrumbs={[{ label: "Sahel Haulage & Minerals Ltd", to: "/partner" }, { label: "Drivers" }]}
      search={{ value: query, onChange: setQuery, placeholder: "Search drivers, licence, vehicle…" }}
    >
      <PageHeader title="Driver compliance" description="Licence validity, medical fitness and mandatory training are monitored continuously." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Drivers registered" value={company.drivers.length} icon={Users} tone="info" />
        <StatCard label="Fully compliant" value={company.drivers.filter((d) => d.status === "Compliant").length} icon={BadgeCheck} tone="success" />
        <StatCard label="Needs attention" value={company.drivers.filter((d) => d.status !== "Compliant").length} icon={IdCard} tone="warning" />
        <StatCard label="Hazmat trained" value={company.drivers.filter((d) => d.training.some((t) => /hazard|mineral|hazmat/i.test(t))).length} icon={GraduationCap} tone="info" />
      </div>

      <Panel className="mt-4" title="Driver register" bodyClassName="p-0" description={`${drivers.length} of ${company.drivers.length} shown`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3 font-semibold">Driver</th>
                <th className="px-3 py-3 font-semibold">Licence</th>
                <th className="px-3 py-3 font-semibold">Expiry</th>
                <th className="px-3 py-3 font-semibold">National ID</th>
                <th className="px-3 py-3 font-semibold">Experience</th>
                <th className="px-3 py-3 font-semibold">Vehicle</th>
                <th className="px-3 py-3 font-semibold">Training</th>
                <th className="px-3 py-3 font-semibold">Medical</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drivers.map((d) => (
                <tr key={d.id} className="hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-[var(--brand)]">{d.name}</p>
                    <p className="text-[11px] text-muted-foreground">{d.id}</p>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {d.licence}
                    <span className="block text-[11px] text-muted-foreground">Class {d.licenceClass}</span>
                  </td>
                  <td className="px-3 py-3 text-xs">{d.licenceExpiry}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{d.nationalId}</td>
                  <td className="px-3 py-3 text-xs">{d.experience}</td>
                  <td className="px-3 py-3 text-xs">{d.assignedVehicle}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {d.training.map((t) => (
                        <Pill key={t} tone="neutral">
                          {t}
                        </Pill>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs">{d.medicalExpiry}</td>
                  <td className="px-5 py-3">
                    <Pill tone={tone(d.status)}>{d.status}</Pill>
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
