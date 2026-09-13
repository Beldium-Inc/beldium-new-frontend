export interface NavItem {
  label: string;
  to: string;
  icon: string;
  group: string;
}

// Single-role vertical: one nav list, no per-role branching.
export const minerNav: NavItem[] = [
  { label: "Dashboard", to: "/miner/dashboard", icon: "gauge", group: "Overview" },
  { label: "My Organisation", to: "/miner/organisation", icon: "building", group: "Company" },
  { label: "My Sites", to: "/miner/sites", icon: "mountain", group: "Company" },
  { label: "Application / Status", to: "/miner/application-record", icon: "files", group: "Company" },
  { label: "Production", to: "/miner/production", icon: "chart", group: "Operations" },
  { label: "Inventory", to: "/miner/inventory", icon: "boxes", group: "Operations" },
  { label: "Equipment", to: "/miner/equipment", icon: "hardhat", group: "Operations" },
  { label: "Compliance", to: "/miner/compliance", icon: "shield", group: "Compliance" },
  { label: "Corrective Actions", to: "/miner/actions", icon: "alert", group: "Compliance" },
  { label: "Documents", to: "/miner/documents", icon: "files", group: "Compliance" },
  { label: "Reports", to: "/miner/reports", icon: "chart", group: "Compliance" },
  { label: "Notifications", to: "/miner/notifications", icon: "inbox", group: "Account" },
  { label: "Settings", to: "/miner/settings", icon: "settings", group: "Account" },
];
