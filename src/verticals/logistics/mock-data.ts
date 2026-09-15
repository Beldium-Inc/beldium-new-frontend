/**
 * View-model types for the Beldium Logistics Compliance dashboard. The data
 * itself comes from the API (see src/lib/api/logistics.ts and store.tsx,
 * which maps the API's snake_case shapes into these); nothing here is
 * seeded. `REQUEST_REASONS` is a static option list for a form, not data.
 */

export type Role = "operator" | "partner" | "regulator" | "admin";

export type DocStatus = "pending" | "verified" | "rejected" | "replacement";

export type CheckStatus = "passed" | "attention" | "pending" | "failed";

export type CompanyStatus =
  | "Under Review"
  | "Pending Review"
  | "Awaiting Information"
  | "Approved"
  | "Conditionally Approved"
  | "Rejected"
  | "Expiring Documents";

export type RiskBand = "Low" | "Medium" | "High";

export interface ComplianceDocument {
  id: string;
  name: string;
  category: string;
  type: string;
  issuer: string;
  reference: string;
  issued: string;
  expires: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  status: DocStatus;
  notes: { id: string; author: string; at: string; text: string }[];
}

export interface CheckItem {
  label: string;
  value: string;
  status: CheckStatus;
}

export interface CheckSection {
  key: string;
  label: string;
  description: string;
  status: CheckStatus;
  score: number;
  items: CheckItem[];
  documentIds: string[];
}

export interface Vehicle {
  id: string;
  registration: string;
  type: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  capacity: string;
  ownership: "Owned" | "Leased" | "Contracted";
  insurer: string;
  insuranceExpiry: string;
  roadworthinessExpiry: string;
  gps: "Active" | "Inactive" | "Intermittent";
  status: "Compliant" | "Attention" | "Non-compliant";
  location: string;
}

export interface Driver {
  id: string;
  name: string;
  licence: string;
  licenceClass: string;
  licenceExpiry: string;
  nationalId: string;
  experience: string;
  assignedVehicle: string;
  training: string[];
  medicalExpiry: string;
  status: "Compliant" | "Attention" | "Non-compliant";
}

export interface ActivityEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
  channel: "Operator" | "Partner" | "System" | "Regulator";
}

export interface Company {
  id: string;
  name: string;
  regId: string;
  rcNumber: string;
  location: string;
  state: string;
  country: string;
  incorporated: string;
  fleetSize: number;
  driverCount: number;
  status: CompanyStatus;
  risk: RiskBand;
  riskScore: number;
  submitted: string;
  reviewer: string;
  lastActivity: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  employees: number;
  annualTonnage: string;
  services: string[];
  operatingLocations: { name: string; type: string; address: string; staff: number }[];
  scores: { fleet: number; drivers: number; insurance: number; safety: number; mineral: number };
  checks: CheckSection[];
  documents: ComplianceDocument[];
  vehicles: Vehicle[];
  drivers: Driver[];
  activity: ActivityEvent[];
}

export interface ExpiringDoc {
  id: string;
  company: string;
  companyId: string;
  document: string;
  category: string;
  expires: string;
  daysLeft: number;
  severity: "critical" | "warning" | "watch";
}

export interface InfoRequest {
  id: string;
  companyId: string;
  company: string;
  reason: string;
  message: string;
  items: string[];
  raisedBy: string;
  raisedAt: string;
  due: string;
  status: "Open" | "Responded" | "Closed";
  response?: { at: string; message: string; files: string[] };
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  outcome: string;
}

export interface Notification {
  id: string;
  audience: Role[];
  title: string;
  body: string;
  at: string;
  tone: "info" | "warning" | "critical" | "success";
  read: boolean;
}

export const REQUEST_REASONS = [
  "Missing document",
  "Illegible or poor-quality scan",
  "Expired document",
  "Details do not match registry records",
  "Incomplete fleet or driver schedule",
  "Insurance cover below required limit",
  "Additional clarification required",
  "Mineral transport authorisation outstanding",
];
