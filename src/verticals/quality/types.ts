export type Role = "operator" | "partner" | "miner" | "buyer" | "regulator";

export interface DemoUser {
  id: string;
  role: Role;
  name: string;
  title: string;
  org: string;
  initials: string;
  blurb: string;
}

export type DocStatus = "pending" | "verified" | "flagged" | "expired";

export interface PartnerDocument {
  id: string;
  name: string;
  category: "organisation" | "professional" | "laboratory" | "conditional";
  reference: string;
  issuer: string;
  issued: string;
  expires: string | null;
  status: DocStatus;
  note?: string;
  conditionalOn?: string;
}

export type ApplicationStatus =
  | "submitted"
  | "in_review"
  | "info_requested"
  | "approved"
  | "rejected";

export interface RiskFlag {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  detail: string;
  resolved: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  role: Role;
  action: string;
  detail: string;
}

export interface ScopeItem {
  method: string;
  matrix: string;
  analyte: string;
  loq: string;
  accredited: boolean;
}

export interface Application {
  id: string;
  ref: string;
  submittedAt: string;
  status: ApplicationStatus;
  assignedTo: string;
  riskScore: number;
  organisation: {
    legalName: string;
    tradingName: string;
    registrationNo: string;
    country: string;
    city: string;
    incorporated: string;
    website: string;
    beneficialOwners: { name: string; share: number; pep: boolean }[];
    contact: { name: string; email: string; phone: string };
  };
  capability: {
    leadAssessor: string;
    credential: string;
    yearsExperience: number;
    registry: string;
    registryId: string;
    staff: { name: string; role: string; competency: string; verified: boolean }[];
  };
  laboratory: {
    facility: string;
    accreditation: string;
    accreditationBody: string;
    certificateNo: string;
    validUntil: string;
    lastSurveillance: string;
    proficiencyTesting: string;
    scope: ScopeItem[];
  };
  documents: PartnerDocument[];
  riskFlags: RiskFlag[];
  audit: AuditEntry[];
  decisionNote?: string;
}

export type SampleStatus =
  | "registered"
  | "in_transit"
  | "received"
  | "testing"
  | "reviewed"
  | "certified"
  | "rejected";

export interface CustodyEvent {
  id: string;
  at: string;
  actor: string;
  location: string;
  action: string;
  sealIntact: boolean;
  hash: string;
}

export type ResultVerdict = "pass" | "fail" | "conditional" | "pending";

export interface TestResult {
  id: string;
  analyte: string;
  method: string;
  value: string;
  unit: string;
  spec: string;
  verdict: ResultVerdict;
  uncertainty: string;
}

export interface Sample {
  id: string;
  ref: string;
  material: string;
  lot: string;
  mineSite: string;
  origin: string;
  massKg: number;
  registeredAt: string;
  minerOrg: string;
  partnerOrg: string;
  buyerOrg: string;
  buyerSpecId: string;
  status: SampleStatus;
  custody: CustodyEvent[];
  testRequest: {
    id: string;
    requestedAt: string;
    priority: "standard" | "expedited";
    methods: string[];
    turnaround: string;
    status: "draft" | "submitted" | "accepted" | "complete";
  } | null;
  results: TestResult[];
  qualityReview: {
    reviewer: string;
    at: string;
    verdict: ResultVerdict;
    note: string;
  } | null;
  audit: AuditEntry[];
}

export interface BuyerSpec {
  id: string;
  name: string;
  buyerOrg: string;
  material: string;
  limits: { analyte: string; rule: string; target: string }[];
}

export interface Certificate {
  id: string;
  ref: string;
  sampleRef: string;
  material: string;
  issuedAt: string;
  issuedBy: string;
  validUntil: string;
  status: "active" | "revoked" | "draft";
  verificationHash: string;
  scans: number;
}

export interface CorrectiveAction {
  id: string;
  action: string;
  owner: string;
  due: string;
  status: "open" | "in_progress" | "complete";
}

export interface NonConformity {
  id: string;
  ref: string;
  title: string;
  raisedAt: string;
  raisedBy: string;
  against: string;
  severity: "minor" | "major" | "critical";
  status: "open" | "capa_submitted" | "closed";
  detail: string;
  capa: CorrectiveAction[];
}
