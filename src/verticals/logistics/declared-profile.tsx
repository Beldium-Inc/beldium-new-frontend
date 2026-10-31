import { KeyValue, Panel } from "./bits";
import type { Company } from "./mock-data";

const shown = (value: string | undefined) => value?.trim() || "Not declared";

/** Everything the company declared on onboarding. Shown to the company and its reviewer. */
export function DeclaredProfilePanels({ company }: { company: Company }) {
  const declared = company.declared;
  if (!declared) return null;
  const { representative: r, officers: o, operating: p } = declared;
  return (
    <div className="mt-4 space-y-4">
      {declared.description ? (
        <Panel title="Business description">
          <p className="text-sm text-muted-foreground">{declared.description}</p>
        </Panel>
      ) : null}
      <Panel title="Authorised representative" description="Applicant-declared, not verified">
        <KeyValue
          items={[
            { label: "Full name", value: shown(r.name) },
            { label: "Job title", value: shown(r.title) },
            { label: "Work email", value: shown(r.email) },
            { label: "Phone", value: shown(r.phone) },
            { label: "Relationship to organisation", value: shown(r.relationship) },
            { label: "Signatory designation", value: shown(r.signatory) },
            { label: "Authority to represent", value: r.authority ? "Declared" : "Not declared" },
          ]}
        />
      </Panel>
      <Panel title="Responsible officers" description="Applicant-declared, not verified">
        <KeyValue
          items={[
            { label: "Fleet Manager", value: shown(o.fleet_manager) },
            { label: "Operations Manager", value: shown(o.operations_manager) },
            { label: "Transport Safety Manager", value: shown(o.transport_safety_manager) },
            { label: "Compliance Officer", value: shown(o.compliance_officer) },
            { label: "Maintenance Manager", value: shown(o.maintenance_manager) },
            { label: "Dispatch Coordinator", value: shown(o.dispatch_coordinator) },
          ]}
        />
      </Panel>
      <Panel
        title="Operating profile"
        description="All capacities are applicant-declared, not verified availability"
      >
        <KeyValue
          items={[
            { label: "Primary service", value: shown(p.primary_service) },
            { label: "Secondary services", value: shown(p.secondary_services) },
            { label: "Mineral haulage experience", value: shown(p.mineral_experience) },
            { label: "Minerals transported", value: shown(p.minerals_transported) },
            { label: "Operating states", value: shown(p.operating_states) },
            { label: "Transport corridors", value: shown(p.transport_corridors) },
            { label: "Fleet ownership model", value: shown(p.fleet_ownership_model) },
            { label: "Service coverage", value: shown(p.service_coverage) },
            { label: "Operating schedule", value: shown(p.operating_schedule) },
            { label: "Dispatch capability", value: shown(p.dispatch_capability) },
            { label: "Monthly capacity", value: shown(p.monthly_capacity) },
            { label: "Typical shipment", value: shown(p.typical_shipment) },
            { label: "Maximum load", value: shown(p.maximum_load) },
            { label: "Cargo characteristics", value: shown(p.cargo_characteristics) },
          ]}
        />
      </Panel>
    </div>
  );
}
