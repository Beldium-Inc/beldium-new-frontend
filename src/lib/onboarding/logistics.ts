import type { LogisticsDomainKey } from "@/lib/api/logistics";

/**
 * The Logistics document checklist, as a logistics company files it. `domain` is
 * the review section each document lands in. Matches the backend's
 * compliance/logistics_documents.py.
 */
export const logisticsDocumentCatalogue: {
  type: string;
  title: string;
  required: boolean;
  appliesWhen?: string;
  domain: LogisticsDomainKey;
}[] = [
  {
    type: "logistics_cac_incorporation",
    title: "CAC incorporation evidence",
    required: true,
    domain: "corporate",
  },
  {
    type: "logistics_tax_documentation",
    title: "Tax documentation",
    required: true,
    domain: "corporate",
  },
  {
    type: "logistics_representative_declaration",
    title: "Authorized representative declaration",
    required: true,
    domain: "corporate",
  },
  {
    type: "logistics_transport_authorization",
    title: "Applicable transport authorization",
    required: false,
    domain: "regulatory",
  },
  {
    type: "logistics_mineral_haulage_authorization",
    title: "Applicable mineral haulage authorization",
    required: false,
    appliesWhen: "If you haul minerals or bulk cargo",
    domain: "mineral",
  },
  {
    type: "logistics_vehicle_schedule",
    title: "Vehicle registration and roadworthiness schedule",
    required: true,
    domain: "fleet",
  },
  {
    type: "logistics_lease_declaration",
    title: "Lease / contracted fleet declaration",
    required: false,
    appliesWhen: "If any vehicle is leased or contracted",
    domain: "fleet",
  },
  {
    type: "logistics_driver_schedule",
    title: "Driver licence and competence schedule",
    required: true,
    domain: "driver",
  },
  {
    type: "logistics_maintenance_procedures",
    title: "Maintenance and safety procedures",
    required: true,
    domain: "hs",
  },
  {
    type: "logistics_cargo_custody_procedure",
    title: "Cargo custody and delivery procedure",
    required: false,
    appliesWhen: "If you haul minerals or bulk cargo",
    domain: "mineral",
  },
  {
    type: "logistics_container_seal_procedure",
    title: "Container seal procedure",
    required: false,
    appliesWhen: "If you run container trucks",
    domain: "operational",
  },
  {
    type: "logistics_vehicle_insurance",
    title: "Commercial vehicle insurance declaration",
    required: true,
    domain: "insurance",
  },
  {
    type: "logistics_hse_declaration",
    title: "Journey management and HSE declaration",
    required: true,
    domain: "hs",
  },
  {
    type: "logistics_hazardous_cargo_procedure",
    title: "Hazardous cargo handling procedure",
    required: false,
    appliesWhen: "If you carry hazardous cargo",
    domain: "hs",
  },
  {
    type: "logistics_corridor_risk_declaration",
    title: "Interstate corridor risk declaration",
    required: false,
    appliesWhen: "If you operate in more than one state",
    domain: "operational",
  },
];
