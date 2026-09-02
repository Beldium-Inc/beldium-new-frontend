import type { Role } from "@/lib/prototype/types";

export interface NavItem {
  label: string;
  to: string;
  icon: string;
  group: string;
}

export const partnerNav: NavItem[] = [
  { label: "Dashboard", to: "/app/dashboard", icon: "gauge", group: "Overview" },
  { label: "Applications", to: "/app/applications", icon: "inbox", group: "Intake" },
  { label: "Mining Organisations", to: "/app/organisations", icon: "building", group: "Register" },
  { label: "Mining Sites", to: "/app/sites", icon: "mountain", group: "Register" },
  { label: "Pending Reviews", to: "/app/reviews", icon: "clipboard", group: "Review" },
  { label: "Documents & Licences", to: "/app/documents", icon: "files", group: "Review" },
  { label: "Inspections", to: "/app/inspections", icon: "hardhat", group: "Field" },
  { label: "Sampling & Quality", to: "/app/sampling", icon: "flask", group: "Field" },
  { label: "Environmental & Safety", to: "/app/environmental", icon: "leaf", group: "Field" },
  { label: "Risk", to: "/app/risk", icon: "shield", group: "Assurance" },
  { label: "Non-Conformities", to: "/app/nonconformities", icon: "alert", group: "Assurance" },
  { label: "Reports", to: "/app/reports", icon: "chart", group: "Assurance" },
  { label: "Audit Trail", to: "/app/audit", icon: "history", group: "Assurance" },
];

export const minerNav: NavItem[] = [
  { label: "Dashboard", to: "/app/dashboard", icon: "gauge", group: "Overview" },
  { label: "My Organisation", to: "/app/organisations", icon: "building", group: "Company" },
  { label: "My Sites", to: "/app/sites", icon: "mountain", group: "Company" },
  { label: "Licences", to: "/app/documents", icon: "files", group: "Company" },
  { label: "Production", to: "/app/production", icon: "chart", group: "Operations" },
  { label: "Inventory", to: "/app/inventory", icon: "boxes", group: "Operations" },
  { label: "Transactions", to: "/app/transactions", icon: "receipt", group: "Operations" },
  { label: "Sampling & Quality", to: "/app/sampling", icon: "flask", group: "Operations" },
  { label: "Environmental & Safety", to: "/app/environmental", icon: "leaf", group: "Compliance" },
  { label: "Compliance", to: "/app/compliance", icon: "shield", group: "Compliance" },
  { label: "Action Required", to: "/app/actions", icon: "alert", group: "Compliance" },
  { label: "Inspections", to: "/app/inspections", icon: "hardhat", group: "Compliance" },
];

export const regulatorNav: NavItem[] = [
  { label: "Oversight Dashboard", to: "/app/dashboard", icon: "gauge", group: "Overview" },
  { label: "Organisations", to: "/app/organisations", icon: "building", group: "Register" },
  { label: "Mining Sites", to: "/app/sites", icon: "mountain", group: "Register" },
  { label: "Licence & Compliance", to: "/app/documents", icon: "files", group: "Register" },
  { label: "Inspections", to: "/app/inspections", icon: "hardhat", group: "Monitoring" },
  { label: "Environmental Alerts", to: "/app/environmental", icon: "leaf", group: "Monitoring" },
  { label: "Non-Conformities", to: "/app/nonconformities", icon: "alert", group: "Monitoring" },
  { label: "Risk", to: "/app/risk", icon: "shield", group: "Monitoring" },
  { label: "Reports", to: "/app/reports", icon: "chart", group: "Assurance" },
  { label: "Audit History", to: "/app/audit", icon: "history", group: "Assurance" },
];

export function navForRole(role: Role): NavItem[] {
  if (role === "miner") return minerNav;
  if (role === "regulator") return regulatorNav;
  return partnerNav;
}
