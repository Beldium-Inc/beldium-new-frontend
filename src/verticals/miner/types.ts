// UI-facing shapes for the Miner Portal. Adapted from the mining vertical's
// ./types.ts (same backend register) plus the two new records —
// ProductionRecord / InventoryItem — that only this vertical uses.

export type RiskLevel = "Low" | "Medium" | "High";
export type Severity = "Minor" | "Major" | "Critical";

export interface MineSite {
  id: string;
  code: string;
  name: string;
  orgId: string;
  mineral: string;
  state: string;
  lga: string;
  areaHa: number;
  status: "Operational" | "Under Review" | "Suspended" | "Care & Maintenance";
  complianceScore: number;
  risk: RiskLevel;
  capacityTpa: number;
  currentTpa: number;
  workforce: number;
  lastInspection: string;
  verification: { site: boolean; licence: boolean; documents: boolean; gps: boolean };
  riskReasons: string[];
}

export interface Equipment {
  id: string;
  siteId: string;
  name: string;
  serial: string;
  certExpiry: string;
  status: "Certified" | "Due Inspection" | "Out of Service";
}

export interface ProductionRecord {
  id: string;
  siteId: string;
  periodStart: string;
  periodEnd: string;
  commodity: string;
  tonnage: number;
  grade: number | null;
  notes: string;
}

export interface InventoryItem {
  id: string;
  siteId: string;
  category: string;
  name: string;
  quantity: number;
  unit: string;
  threshold: number | null;
}

export interface Application {
  id: string;
  ref: string;
  orgId: string;
  siteName: string;
  type: string;
  mineral: string;
  submitted: string;
  stage: string;
  status: "Pending" | "Under Review" | "Approved" | "Rejected" | "Info Requested";
  assignedTo: string;
  slaDays: number;
}

export interface CorrectiveSubmission {
  id: string;
  at: string;
  by: string;
  message: string;
  attachments: string[];
  decision?: "Accepted" | "Rejected";
  decisionNote?: string;
  decidedAt?: string;
}

export interface NonConformity {
  id: string;
  ref: string;
  siteId: string;
  title: string;
  category: string;
  severity: Severity;
  requiredAction: string;
  responsiblePerson: string;
  deadline: string;
  raisedAt: string;
  status: "Open" | "In Progress" | "Awaiting Review" | "Closed" | "Escalated";
  submissions: CorrectiveSubmission[];
}

export interface InfoRequest {
  id: string;
  siteId: string;
  section: string;
  subject: string;
  details: string;
  requestedFrom: string;
  requestedBy: string;
  requestedAt: string;
  dueBy: string;
  priority: "Low" | "Normal" | "High";
  status: "Open" | "Responded" | "Closed";
  response?: { at: string; by: string; message: string; attachments: string[] };
}

export interface DocumentRecord {
  id: string;
  name: string;
  category: string;
  siteId: string;
  uploaded: string;
  expiry?: string;
  status: "Verified" | "Pending" | "Rejected" | "Expired";
  owner: string;
}

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Notification {
  id: string;
  at: string;
  title: string;
  body: string;
  tone: "neutral" | "positive" | "warning" | "negative";
  read: boolean;
}
