import type { Role } from "@/verticals/mining/types";

export interface NavItem {
  label: string;
  to: string;
  icon: string;
  group: string;
  /** Genuine Beldium staff only — not shown to a verified compliance-partner
   * org, since deciding another applicant's compliance-partner status is a
   * platform-operator action, not something one partner does to another. */
  staffOnly?: boolean;
}

export const partnerNav: NavItem[] = [
  { label: "Dashboard", to: "/mining/dashboard", icon: "gauge", group: "Overview" },
  { label: "Applications", to: "/mining/applications", icon: "inbox", group: "Intake" },
  { label: "Mining Organisations", to: "/mining/organisations", icon: "building", group: "Register" },
  { label: "Mining Sites", to: "/mining/sites", icon: "mountain", group: "Register" },
  { label: "Pending Reviews", to: "/mining/reviews", icon: "clipboard", group: "Review" },
  { label: "Documents & Licences", to: "/mining/documents", icon: "files", group: "Review" },
  { label: "Inspections", to: "/mining/inspections", icon: "hardhat", group: "Field" },
  { label: "Sampling & Quality", to: "/mining/sampling", icon: "flask", group: "Field" },
  { label: "Environmental & Safety", to: "/mining/environmental", icon: "leaf", group: "Field" },
  { label: "Risk", to: "/mining/risk", icon: "shield", group: "Assurance" },
  { label: "Non-Conformities", to: "/mining/nonconformities", icon: "alert", group: "Assurance" },
  { label: "Reports", to: "/mining/reports", icon: "chart", group: "Assurance" },
  { label: "Audit Trail", to: "/mining/audit", icon: "history", group: "Assurance" },
];

export const minerNav: NavItem[] = [
  { label: "Dashboard", to: "/mining/dashboard", icon: "gauge", group: "Overview" },
  { label: "My Organisation", to: "/mining/organisations", icon: "building", group: "Company" },
  { label: "My Sites", to: "/mining/sites", icon: "mountain", group: "Company" },
  { label: "Licences", to: "/mining/documents", icon: "files", group: "Company" },
  { label: "Production", to: "/mining/production", icon: "chart", group: "Operations" },
  { label: "Inventory", to: "/mining/inventory", icon: "boxes", group: "Operations" },
  { label: "Transactions", to: "/mining/transactions", icon: "receipt", group: "Operations" },
  { label: "Sampling & Quality", to: "/mining/sampling", icon: "flask", group: "Operations" },
  { label: "Environmental & Safety", to: "/mining/environmental", icon: "leaf", group: "Compliance" },
  { label: "Compliance", to: "/mining/compliance", icon: "shield", group: "Compliance" },
  { label: "Action Required", to: "/mining/actions", icon: "alert", group: "Compliance" },
  { label: "Inspections", to: "/mining/inspections", icon: "hardhat", group: "Compliance" },
];

export const regulatorNav: NavItem[] = [
  { label: "Oversight Dashboard", to: "/mining/dashboard", icon: "gauge", group: "Overview" },
  { label: "Organisations", to: "/mining/organisations", icon: "building", group: "Register" },
  { label: "Mining Sites", to: "/mining/sites", icon: "mountain", group: "Register" },
  { label: "Licence & Compliance", to: "/mining/documents", icon: "files", group: "Register" },
  { label: "Inspections", to: "/mining/inspections", icon: "hardhat", group: "Monitoring" },
  { label: "Environmental Alerts", to: "/mining/environmental", icon: "leaf", group: "Monitoring" },
  { label: "Non-Conformities", to: "/mining/nonconformities", icon: "alert", group: "Monitoring" },
  { label: "Risk", to: "/mining/risk", icon: "shield", group: "Monitoring" },
  { label: "Reports", to: "/mining/reports", icon: "chart", group: "Assurance" },
  { label: "Audit History", to: "/mining/audit", icon: "history", group: "Assurance" },
];

export function navForRole(role: Role): NavItem[] {
  if (role === "miner") return minerNav;
  if (role === "regulator") return regulatorNav;
  return partnerNav;
}
