import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Gauge, MapPin, Radio, ShieldCheck, Truck } from "lucide-react";
import { AppShell, ComplianceBanner } from "@/components/beldium/AppShell";
import { PageHeader, Panel, Pill, StatCard } from "@/components/beldium/bits";
import { useApp } from "@/lib/app-state";
import { PRIMARY_COMPANY_ID } from "@/lib/mock-data";
import type { Vehicle } from "@/lib/mock-data";

export const Route = createFileRoute("/partner/fleet")({
  head: () => ({
    meta: [
      { title: "Fleet compliance — Beldium Logistics Partner Portal" },
      { name: "description", content: "Per-vehicle compliance records: registration, VIN, insurance, roadworthiness and GPS status." },
      { property: "og:title", content: "Fleet compliance — Beldium Logistics Partner Portal" },
      { property: "og:description", content: "Manage vehicle-level compliance across your haulage fleet." },
    ],
  }),
  component: FleetPage,
});

const tone = (s: Vehicle["status"]): "success" | "warning" | "danger" => (s === "Compliant" ? "success" : s === "Attention" ? "warning" : "danger");

function FleetPage() {
  const { companies } = useApp();
  const company = companies.find((c) => c.id === PRIMARY_COMPANY_ID)!;
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState("All");

  const vehicles = company.vehicles.filter(
    (v) =>
      (filter === "All" || v.status === filter) &&
      [v.registration, v.make, v.model, v.type, v.vin].join(" ").toLowerCase().includes(query.toLowerCase()),
  );

  const attention = company.vehicles.filter((v) => v.status !== "Compliant").length;

  return (
    <AppShell
      role="partner"
      breadcrumbs={[{ label: "Sahel Haulage & Minerals Ltd", to: "/partner" }, { label: "Fleet" }]}
      search={{ value: query, onChange: setQuery, placeholder: "Search registration, VIN, model…" }}
    >
      <PageHeader title="Fleet compliance" description="Each vehicle is a separate compliance object. Beldium continuously monitors insurance, roadworthiness and telematics." />

      {attention > 0 ? (
        <ComplianceBanner
          tone="warning"
          title={`${attention} vehicle${attention > 1 ? "s" : ""} need attention`}
          body="Vehicles with expired roadworthiness or inactive GPS cannot be dispatched on Beldium-managed mineral routes."
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vehicles registered" value={company.vehicles.length} icon={Truck} tone="info" />
        <StatCard label="Fully compliant" value={company.vehicles.filter((v) => v.status === "Compliant").length} icon={ShieldCheck} tone="success" />
        <StatCard label="Needs attention" value={attention} icon={Gauge} tone="warning" />
        <StatCard label="GPS active" value={company.vehicles.filter((v) => v.gps === "Active").length} icon={Radio} tone="info" />
      </div>

      <div className="my-4 flex flex-wrap gap-1.5">
        {["All", "Compliant", "Attention", "Non-compliant"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={
              "rounded-full border px-3 py-1 text-xs font-medium transition " +
              (filter === f ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-border bg-card text-muted-foreground hover:border-[var(--link)]/50")
            }
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {vehicles.map((v) => (
          <Panel key={v.id} bodyClassName="p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                <Truck className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-sm font-semibold text-[var(--brand)]">{v.registration}</p>
                  <Pill tone={tone(v.status)}>{v.status}</Pill>
                  <span className="ml-auto text-[11px] text-muted-foreground">{v.id}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {v.year} {v.make} {v.model} · {v.type}
                </p>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {[
                ["VIN", v.vin],
                ["Capacity", v.capacity],
                ["Ownership", v.ownership],
                ["Insurer", v.insurer],
                ["Insurance expiry", v.insuranceExpiry],
                ["Roadworthiness", v.roadworthinessExpiry],
              ].map(([k, val]) => (
                <div key={k}>
                  <dt className="text-[11px] text-muted-foreground">{k}</dt>
                  <dd className="font-medium text-[var(--brand)]">{val}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <Pill tone={v.gps === "Active" ? "success" : v.gps === "Intermittent" ? "warning" : "danger"}>
                <Radio className="h-3 w-3" /> GPS {v.gps}
              </Pill>
              <Pill tone="neutral">
                <MapPin className="h-3 w-3" /> {v.location}
              </Pill>
            </div>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
