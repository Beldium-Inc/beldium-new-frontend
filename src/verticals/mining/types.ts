export type Role = "partner" | "miner" | "regulator";

export type RiskLevel = "Low" | "Medium" | "High";
export type ReviewStatus =
  | "Pending"
  | "Under Review"
  | "Verified"
  | "Rejected"
  | "Info Requested"
  | "Inspection Requested"
  | "Flagged";

export type Severity = "Minor" | "Major" | "Critical";

export interface Evidence {
  id: string;
  name: string;
  kind: "PDF" | "Image" | "Certificate" | "Spreadsheet" | "Report";
  uploaded: string;
  size: string;
  status: "Verified" | "Pending" | "Rejected" | "Expired";
}

export interface SectionField {
  label: string;
  value: string;
  flag?: "ok" | "warn" | "bad";
  note?: string;
}

export type SectionKey =
  | "corporate"
  | "licence"
  | "site"
  | "ownership"
  | "environmental"
  | "safety"
  | "equipment"
  | "production"
  | "sampling"
  | "inspection";

export interface ReviewSection {
  key: SectionKey;
  title: string;
  summary: string;
  weight: number;
  score: number;
  status: ReviewStatus;
  fields: SectionField[];
  evidence: Evidence[];
  decisionNote?: string;
  decidedBy?: string;
  decidedAt?: string;
}

export interface ScoreFactor {
  id: string;
  label: string;
  weight: number;
  score: number;
  reason: string;
  trend: "up" | "down" | "flat";
}

export interface ActivityEntry {
  id: string;
  at: string;
  actor: string;
  role: Role;
  action: string;
  detail: string;
  target?: string;
  tone?: "neutral" | "positive" | "warning" | "negative";
}

export interface InfoRequest {
  id: string;
  siteId: string;
  section: SectionKey | "general";
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

export interface CorrectiveSubmission {
  id: string;
  at: string;
  by: string;
  message: string;
  attachments: string[];
  decision?: "Accepted" | "Rejected" | "More Info Requested";
  decisionNote?: string;
  decidedAt?: string;
  decidedBy?: string;
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
  raisedBy: string;
  raisedAt: string;
  status: "Open" | "In Progress" | "Awaiting Review" | "Closed" | "Escalated";
  submissions: CorrectiveSubmission[];
}

export interface Inspection {
  id: string;
  ref: string;
  siteId: string;
  type: string;
  scheduled: string;
  inspector: string;
  status: "Scheduled" | "Completed" | "Requested" | "Overdue";
  result?: "Pass" | "Pass with Observations" | "Fail";
  findings: { id: string; area: string; observation: string; severity: Severity }[];
  notes?: string;
}

export interface Sample {
  id: string;
  ref: string;
  siteId: string;
  collected: string;
  lab: string;
  certificate: string;
  li2o: number;
  fe2o3: number;
  moisture: number;
  status: "Verified" | "Pending" | "Disputed";
  method: string;
  chainOfCustody: string[];
}

export interface LicenceDoc {
  id: string;
  number: string;
  type: string;
  siteId: string;
  orgId: string;
  issued: string;
  expiry: string;
  status: "Active" | "Expiring" | "Expired" | "Suspended";
  authority: string;
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

export interface Organisation {
  id: string;
  name: string;
  rcNumber: string;
  type: string;
  hq: string;
  contact: string;
  email: string;
  phone: string;
  onboarded: string;
  status: "Active" | "Under Review" | "Suspended";
  complianceScore: number;
  risk: RiskLevel;
  siteCount: number;
  directors: { name: string; role: string; bvnVerified: boolean; nationality: string }[];
  beneficialOwners: { name: string; stake: number; pepScreened: boolean; country: string }[];
}

export interface EnvRecord {
  id: string;
  siteId: string;
  metric: string;
  value: string;
  limit: string;
  status: "Within Limit" | "Watch" | "Breach";
  measured: string;
}

export interface SafetyIncident {
  id: string;
  siteId: string;
  date: string;
  type: string;
  severity: Severity;
  lostDays: number;
  status: "Closed" | "Investigating";
  summary: string;
}

export interface Equipment {
  id: string;
  siteId: string;
  name: string;
  serial: string;
  certExpiry: string;
  status: "Certified" | "Due Inspection" | "Out of Service";
}

export interface MineSite {
  id: string;
  code: string;
  name: string;
  orgId: string;
  mineral: string;
  state: string;
  lga: string;
  lat: number;
  lng: number;
  areaHa: number;
  licenceId: string;
  status: "Operational" | "Under Review" | "Suspended" | "Care & Maintenance";
  complianceScore: number;
  risk: RiskLevel;
  capacityTpa: number;
  currentTpa: number;
  workforce: number;
  lastInspection: string;
  verification: { site: boolean; licence: boolean; documents: boolean; gps: boolean };
  scoreFactors: ScoreFactor[];
  riskReasons: string[];
  sections: ReviewSection[];
  production: { month: string; tonnes: number; grade: number }[];
  inventory: { item: string; qty: string; location: string; updated: string }[];
  transactions: { id: string; date: string; buyer: string; tonnes: number; value: string; status: string }[];
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

export interface PendingReview {
  id: string;
  siteId: string;
  subject: string;
  type: string;
  priority: "Low" | "Normal" | "High";
  submitted: string;
  due: string;
  status: "Queued" | "In Progress" | "Completed";
  assignedTo: string;
}
