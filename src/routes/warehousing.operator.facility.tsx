import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Field, Panel, StatusPill } from "@/verticals/warehousing/compliance-ui";
import { COMPANY_PROFILE, FACILITY_PROFILE } from "@/verticals/warehousing/data";

export const Route = createFileRoute("/warehousing/operator/facility")({
  head: () => ({
    meta: [
      { title: "Facility profile | Beldium Warehouse Operator" },
      { name: "description", content: "Facility profile for the Apapa Mineral Terminal: tenure, capacity, weighbridges, laboratory, security and fire systems." },
      { property: "og:title", content: "Facility profile | Beldium Warehouse Operator" },
      { property: "og:description", content: "Site details submitted for warehouse compliance registration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FacilityPage,
});

function FacilityPage() {
  return (
    <AppShell role="operator" title="Facility profile" subtitle={FACILITY_PROFILE.name}>
      <div className="space-y-6">
        <Panel
          title="Site details"
          description="These details are mirrored to Beldium as part of application BWC/APP/2026/0147."
          actions={<StatusPill tone="warning">Under review</StatusPill>}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Facility" value={FACILITY_PROFILE.name} />
            <Field label="Address" value={FACILITY_PROFILE.address} />
            <Field label="Coordinates" value={FACILITY_PROFILE.coordinates} />
            <Field label="Land title" value={FACILITY_PROFILE.landTitle} />
            <Field label="Built area" value={FACILITY_PROFILE.builtArea} />
            <Field label="Licensed capacity" value={FACILITY_PROFILE.capacity} />
            <Field label="Bays and docks" value={`${FACILITY_PROFILE.bays} bays · ${FACILITY_PROFILE.loadingDocks} docks`} />
            <Field label="Weighbridges" value={FACILITY_PROFILE.weighbridges} />
            <Field label="Laboratory" value={FACILITY_PROFILE.laboratory} />
            <Field label="Security" value={FACILITY_PROFILE.security} />
            <Field label="Fire systems" value={FACILITY_PROFILE.fireSystem} />
            <Field label="Facility manager" value={FACILITY_PROFILE.contact} />
          </div>
        </Panel>

        <Panel title="Operating company" description="Registered particulars held on file.">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Legal name" value={COMPANY_PROFILE.legalName} />
            <Field label="CAC registration" value={COMPANY_PROFILE.cac} />
            <Field label="TIN" value={COMPANY_PROFILE.tin} />
            <Field label="Head office" value={COMPANY_PROFILE.headOffice} />
            <Field label="Mineral licence" value={COMPANY_PROFILE.mineralTitle} />
            <Field label="Staff" value={`${COMPANY_PROFILE.staffCount} group-wide`} />
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
