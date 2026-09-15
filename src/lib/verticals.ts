// Registry of the seven Beldium compliance dashboards.
//
// Each vertical used to be its own Vite app on its own port. They now share one
// server and one router, mounted under /<slug>. This file is the single source
// of truth for what exists, who can sign in to it, and where each role lands.
//
// `home` is relative to the vertical prefix; the full URL is `/${slug}${home}`.

export type VerticalSlug =
  | "export"
  | "logistics"
  | "marketplace"
  | "mining"
  | "processing"
  | "quality"
  | "warehousing";

export type VerticalRole = {
  id: string;
  label: string;
  blurb: string;
  home: string;
};

export type Vertical = {
  slug: VerticalSlug;
  name: string;
  tagline: string;
  roles: VerticalRole[];
};

export const VERTICALS: Vertical[] = [
  {
    slug: "mining",
    name: "Mining Compliance",
    tagline: "Site licensing, production, sampling and environmental oversight.",
    roles: [
      {
        id: "partner",
        label: "Compliance Partner",
        blurb:
          "Full review workspace: applications, mine reviews, scoring, inspections, non-conformities and reporting.",
        home: "/dashboard",
      },
      {
        id: "miner",
        label: "Miner / Producer",
        blurb:
          "Operator view of your organisation, sites, licences, production and outstanding compliance actions.",
        home: "/dashboard",
      },
      {
        id: "regulator",
        label: "Regulatory Oversight",
        blurb:
          "Read-mostly oversight of the register, licence status, inspections, alerts and audit history.",
        home: "/dashboard",
      },
    ],
  },
  {
    slug: "processing",
    name: "Processing Compliance",
    tagline: "Processor onboarding, traceability, incidents and monitoring.",
    roles: [
      {
        id: "operator",
        label: "Compliance Operator",
        blurb:
          "Review processor applications, verify evidence and own the compliance decision record.",
        home: "/dashboard",
      },
      {
        id: "processor",
        label: "Processor / Applicant",
        blurb:
          "Complete your application section by section, upload evidence, answer information requests and close findings.",
        home: "/dashboard",
      },
      {
        id: "regulator",
        label: "Regulatory Oversight",
        blurb: "Oversight of processor status, incidents, inspections and audit history.",
        home: "/dashboard",
      },
    ],
  },
  {
    slug: "export",
    name: "Export Compliance",
    tagline: "Consignment verification, evidence review and export records.",
    roles: [
      {
        id: "operator",
        label: "Compliance Operator",
        blurb:
          "Full review workflow: work queue, exporter verification, document actions, non-conformities and compliance decisions.",
        home: "/queue",
      },
      {
        id: "exporter",
        label: "Exporter",
        blurb: "Submit consignments, upload evidence and track verification status.",
        home: "/dashboard",
      },
      {
        id: "regulator",
        label: "Regulatory Oversight",
        blurb: "Oversight desk view of shipments, flags and compliance records.",
        home: "/oversight",
      },
    ],
  },
  {
    slug: "quality",
    name: "Quality & Control",
    tagline: "Sample custody, laboratory testing and material certificates.",
    roles: [
      {
        id: "operator",
        label: "Compliance Operator",
        blurb: "Verifies Quality & Control Partners and owns the decision record.",
        home: "/dashboard",
      },
      {
        id: "partner",
        label: "Quality Partner",
        blurb: "Accredited laboratory executing tests and issuing certificates.",
        home: "/dashboard",
      },
      {
        id: "miner",
        label: "Miner / Producer",
        blurb: "Registers lots and samples, tracks custody to the lab.",
        home: "/dashboard",
      },
      {
        id: "buyer",
        label: "Buyer",
        blurb: "Verifies certificates and material provenance before purchase.",
        home: "/dashboard",
      },
      {
        id: "regulator",
        label: "Regulatory Oversight",
        blurb: "Read-only oversight of certificates, samples and non-conformities.",
        home: "/dashboard",
      },
    ],
  },
  {
    slug: "warehousing",
    name: "Warehousing Compliance",
    tagline: "Facility accreditation, inventory custody and release control.",
    roles: [
      {
        id: "partner",
        label: "Compliance Partner",
        blurb:
          "Reviews facility applications, runs inspections and issues accreditation decisions.",
        home: "/partner",
      },
      {
        id: "operator",
        label: "Warehouse Operator",
        blurb: "Runs the facility: receiving, locations, inventory, releases and incidents.",
        home: "/operator",
      },
      {
        id: "regulator",
        label: "Regulatory Oversight",
        blurb: "Read-only oversight of facilities, certificates, inspections and incidents.",
        home: "/regulator",
      },
    ],
  },
  {
    slug: "logistics",
    name: "Logistics Compliance",
    tagline: "Carrier accreditation, fleet and driver compliance, movement audit.",
    roles: [
      {
        id: "operator",
        label: "Compliance Operator",
        blurb: "Full review workspace: applications, documents, risk, requests and reporting.",
        home: "/operator",
      },
      {
        id: "partner",
        label: "Logistics Partner",
        blurb: "Manage your company, fleet, drivers and compliance submissions.",
        home: "/partner",
      },
      {
        id: "regulator",
        label: "Regulatory Oversight",
        blurb: "Oversight of registered operators, expiring documents and alerts.",
        home: "/regulator",
      },
      {
        id: "admin",
        label: "Administrator",
        blurb: "Platform administration and configuration.",
        home: "/admin",
      },
    ],
  },
  {
    slug: "marketplace",
    name: "Marketplace Compliance",
    tagline: "Verified offtake: RFQs, offers, orders and settlement.",
    roles: [
      {
        id: "operator",
        label: "Compliance Operator",
        blurb: "Verifies participants and owns the compliance decision record.",
        home: "/dashboard",
      },
      {
        id: "buyer",
        label: "Buyer",
        blurb: "Source verified material, raise RFQs and place orders.",
        home: "/dashboard",
      },
      {
        id: "offtaker",
        label: "Offtaker",
        blurb: "Contract long-term supply against verified compliance records.",
        home: "/dashboard",
      },
      {
        id: "oem",
        label: "OEM",
        blurb: "Trace material provenance into the manufacturing supply chain.",
        home: "/dashboard",
      },
    ],
  },
];

export const VERTICAL_BY_SLUG: Record<VerticalSlug, Vertical> = Object.fromEntries(
  VERTICALS.map((v) => [v.slug, v]),
) as Record<VerticalSlug, Vertical>;

/**
 * The shared compliance dashboards. The Miner Portal (`/miner-portal`) is a
 * standalone entry point with its own branding and sign-in flow, but it now
 * hands off into this same `mining` vertical scoped to the `miner` role,
 * there is no separate vertical to exclude here any more.
 */
export const COMPLIANCE_VERTICALS: Vertical[] = VERTICALS;

export function roleIn(slug: VerticalSlug, roleId: string): VerticalRole | undefined {
  return VERTICAL_BY_SLUG[slug].roles.find((r) => r.id === roleId);
}

export function homeFor(slug: VerticalSlug, roleId: string): string {
  const role = roleIn(slug, roleId);
  return `/${slug}${role?.home ?? VERTICAL_BY_SLUG[slug].roles[0]!.home}`;
}
