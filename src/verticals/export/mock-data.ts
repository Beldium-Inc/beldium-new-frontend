// View-model types for the Beldium Export Compliance dashboard. The data
// itself comes from the API (see src/lib/api/export.ts and store.tsx, which
// maps the API's snake_case shapes into these); nothing here is seeded.

export type Role = "operator" | "exporter" | "regulator";

export type DocStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "replacement_requested"
  | "clarification_requested";

export type DocNote = {
  at: string;
  by: string;
  action: string;
  comment: string;
};

export type ShipmentDocument = {
  id: string;
  name: string;
  category: string;
  issuer: string;
  reference: string;
  issued: string;
  expires?: string | undefined;
  status: DocStatus;
  mandatory: boolean;
  notes: DocNote[];
};

export type Exporter = {
  id: string;
  name: string;
  rcNumber: string;
  state: string;
  contact: string;
  email: string;
  phone: string;
  minerals: string[];
  verification: "verified" | "in_review" | "action_required";
  complianceScore: number;
  onboarded: string;
  licences: { name: string; ref: string; expires: string; status: DocStatus }[];
  kyc: { label: string; value: string; ok: boolean }[];
};

export const SECTION_KEYS = [
  "overview",
  "exporter",
  "product",
  "source",
  "quality",
  "quantity",
  "documents",
  "financial",
  "customs",
  "inspection",
  "logistics",
  "regulatory",
  "audit",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  overview: "Overview",
  exporter: "Exporter",
  product: "Product",
  source: "Source",
  quality: "Quality",
  quantity: "Quantity",
  documents: "Documents",
  financial: "Financial",
  customs: "Customs",
  inspection: "Inspection",
  logistics: "Logistics",
  regulatory: "Regulatory",
  audit: "Audit Trail",
};

export type Field = { label: string; value: string; flag?: "warn" | "fail" };

export type ChecklistItem = {
  id: string;
  label: string;
  section: SectionKey;
  state: "pass" | "open" | "fail";
  detail: string;
};

export type NonConformity = {
  id: string;
  title: string;
  severity: "minor" | "major" | "critical";
  section: SectionKey;
  raisedBy: string;
  raisedAt: string;
  status: "open" | "responded" | "closed";
  detail: string;
  response?: string | undefined;
};

export type AuditEntry = {
  at: string;
  actor: string;
  role: Role | "system";
  action: string;
  detail: string;
};

export type ShipmentStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "info_requested"
  | "cleared"
  | "conditionally_cleared"
  | "declined";

export type Shipment = {
  id: string;
  reference: string;
  exporterId: string;
  mineral: string;
  hsCode: string;
  grade: string;
  quantity: string;
  destination: string;
  buyer: string;
  port: string;
  incoterm: string;
  valueUsd: number;
  etd: string;
  submitted: string;
  status: ShipmentStatus;
  riskScore: number;
  riskBand: "low" | "medium" | "high";
  riskFactors: { label: string; weight: number; note: string }[];
  sections: Partial<Record<SectionKey, Field[]>>;
  documents: ShipmentDocument[];
  checklist: ChecklistItem[];
  nonConformities: NonConformity[];
  audit: AuditEntry[];
  decision?: {
    outcome: "cleared" | "conditionally_cleared" | "declined";
    by: string;
    at: string;
    rationale: string;
    conditions?: string | undefined;
  };
};

export type MonitoringEvent = {
  id: string;
  at: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  shipmentId?: string;
  exporterId?: string;
};

export const DISCLAIMER =
  "Beldium issues an independent compliance verification record. It is not a government permit, licence, or customs clearance and does not replace any statutory approval.";
