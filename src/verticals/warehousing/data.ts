/**
 * Role vocabulary and label maps for the Beldium Warehousing Compliance
 * dashboard. The register itself comes straight from the API (see
 * src/lib/api/warehousing.ts and store.tsx); nothing here is seeded.
 */

export type RoleId = "partner" | "operator" | "regulator";

export interface DemoRole {
  id: RoleId;
  title: string;
  org: string;
  blurb: string;
  home: string;
}

export const ROLES: DemoRole[] = [
  {
    id: "partner",
    title: "Warehouse Compliance Partner",
    org: "Beldium Compliance Partners (External Reviewer)",
    blurb:
      "Review warehouse applications, score risk, order inspections, raise non-conformities and issue decisions.",
    home: "/warehousing/partner",
  },
  {
    id: "operator",
    title: "Warehouse Operator / Manager",
    org: "Registered warehouse operator",
    blurb:
      "Run daily site operations: capacity, receipts, lots, release authorisation, documents and incidents.",
    home: "/warehousing/operator",
  },
  {
    id: "regulator",
    title: "Regulatory Oversight Officer",
    org: "Solid Minerals Oversight Desk (read-only)",
    blurb: "Read-only visibility of registered facilities, certificates, inspections and incidents.",
    home: "/warehousing/regulator",
  },
];

export const roleById = (id: RoleId) => ROLES.find((r) => r.id === id)!;

export function labelStatus(status: string) {
  switch (status) {
    case "draft":
      return "Draft";
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under review";
    case "awaiting_information":
      return "Awaiting information";
    case "conditionally_approved":
      return "Conditionally approved";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "not_started":
      return "Not started";
    default:
      return status;
  }
}
