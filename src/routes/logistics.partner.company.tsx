import { createFileRoute } from "@tanstack/react-router";
import { Building2, MapPin } from "lucide-react";
import { AppShell } from "@/verticals/logistics/AppShell";
import { KeyValue, PageHeader, Panel, Pill } from "@/verticals/logistics/bits";
import { useApp } from "@/verticals/logistics/store";
import { PRIMARY_COMPANY_ID } from "@/verticals/logistics/mock-data";

export const Route = createFileRoute("/logistics/partner/company")({
  head: () => ({
    meta: [
      { title: "Company information | Beldium Logistics Partner Portal" },
      { name: "description", content: "Registered company details, operating locations and service scope held by Beldium." },
      { property: "og:title", content: "Company information | Beldium Logistics Partner Portal" },
      { property: "og:description", content: "Your registered corporate profile on Beldium." },
    ],
  }),
  component: CompanyPage,
});

function CompanyPage() {
  const { companies } = useApp();
  const c = companies.find((x) => x.id === PRIMARY_COMPANY_ID)!;

  return (
    <AppShell role="partner" breadcrumbs={[{ label: "Sahel Haulage & Minerals Ltd", to: "/logistics/partner" }, { label: "Company information" }]}>
      <PageHeader title="Company information" description="Corporate record submitted to Beldium. Changes after submission require a compliance re-check." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Registered details">
          <KeyValue
            items={[
              { label: "Legal name", value: c.name },
              { label: "Beldium ID", value: c.id },
              { label: "RC number", value: c.rcNumber },
              { label: "TIN / Reg ID", value: c.regId },
              { label: "Incorporated", value: c.incorporated },
              { label: "Head office", value: c.location },
              { label: "State", value: c.state },
              { label: "Country", value: c.country },
              { label: "Employees", value: `${c.employees}` },
              { label: "Annual tonnage", value: c.annualTonnage },
              { label: "Website", value: c.website },
              { label: "Primary contact", value: `${c.contactName} · ${c.contactPhone}` },
            ]}
          />
        </Panel>
        <Panel title="Services offered">
          <ul className="flex flex-wrap gap-1.5">
            {c.services.map((s) => (
              <li key={s}>
                <Pill tone="info">{s}</Pill>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Mineral haulage is listed but currently restricted pending authorisation review.
          </p>
        </Panel>
      </div>

      <Panel className="mt-4" title="Operating locations" bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {c.operatingLocations.map((l) => (
            <li key={l.name} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                {l.type === "Head Office" ? <Building2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--brand)]">{l.name}</p>
                <p className="text-xs text-muted-foreground">{l.address}</p>
              </div>
              <Pill tone="neutral">{l.type}</Pill>
              <span className="text-xs text-muted-foreground">{l.staff} staff</span>
            </li>
          ))}
        </ul>
      </Panel>
    </AppShell>
  );
}
