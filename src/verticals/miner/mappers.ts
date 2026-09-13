// API shape (snake_case) -> UI shape (camelCase, display vocabulary).
// Mirrors src/verticals/mining/mappers.ts for the fields this vertical uses.

import type {
  Application as ApiApplication,
  CorrectiveSubmission as ApiCorrectiveSubmission,
  DocumentRecord as ApiDocumentRecord,
  Equipment as ApiEquipment,
  InfoRequest as ApiInfoRequest,
  InventoryItem as ApiInventoryItem,
  MineSite as ApiMineSite,
  MiningNonConformity as ApiNonConformity,
  ProductionRecord as ApiProductionRecord,
} from "@/lib/api/miner";
import type { OrganisationMembership } from "@/lib/api/types";
import type {
  Application,
  CorrectiveSubmission,
  DocumentRecord,
  Equipment,
  InfoRequest,
  InventoryItem,
  MineSite,
  NonConformity,
  OrgMember,
  ProductionRecord,
  RiskLevel,
  Severity,
} from "./types";

function isoDate(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

const SITE_STATUS: Record<string, MineSite["status"]> = {
  operational: "Operational",
  under_review: "Under Review",
  suspended: "Suspended",
  care_maintenance: "Care & Maintenance",
};

const SITE_RISK: Record<string, RiskLevel> = { low: "Low", medium: "Medium", high: "High" };

export function toMineSite(row: ApiMineSite): MineSite {
  const verification = (row.verification ?? {}) as Partial<MineSite["verification"]>;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    orgId: row.organisation ?? "",
    mineral: row.mineral,
    state: row.state,
    lga: row.lga,
    areaHa: row.area_ha ?? 0,
    status: SITE_STATUS[row.status] ?? "Under Review",
    complianceScore: row.compliance_score,
    risk: SITE_RISK[row.risk] ?? "Medium",
    capacityTpa: row.capacity_tpa ?? 0,
    currentTpa: row.current_tpa ?? 0,
    workforce: row.workforce ?? 0,
    lastInspection: row.last_inspection_on ?? "",
    verification: {
      site: Boolean(verification.site),
      licence: Boolean(verification.licence),
      documents: Boolean(verification.documents),
      gps: Boolean(verification.gps),
    },
    riskReasons: row.risk_reasons ?? [],
  };
}

const EQUIPMENT_STATUS: Record<string, Equipment["status"]> = {
  certified: "Certified",
  due_inspection: "Due Inspection",
  out_of_service: "Out of Service",
};

export function toEquipment(row: ApiEquipment): Equipment {
  return {
    id: row.id,
    siteId: row.site,
    name: row.name,
    serial: row.serial,
    certExpiry: row.cert_expires_on ?? "",
    status: EQUIPMENT_STATUS[row.status] ?? "Certified",
  };
}

export function toProductionRecord(row: ApiProductionRecord): ProductionRecord {
  return {
    id: row.id,
    siteId: row.site,
    periodStart: isoDate(row.period_start),
    periodEnd: isoDate(row.period_end),
    commodity: row.commodity,
    tonnage: row.tonnage,
    grade: row.grade,
    notes: row.notes ?? "",
  };
}

export function toInventoryItem(row: ApiInventoryItem): InventoryItem {
  return {
    id: row.id,
    siteId: row.site,
    category: row.category,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    threshold: row.threshold,
  };
}

const APPLICATION_STATUS: Record<string, Application["status"]> = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  info_requested: "Info Requested",
};

export function toApplication(row: ApiApplication): Application {
  return {
    id: row.id,
    ref: row.reference,
    orgId: row.organisation ?? "",
    siteName: row.site_name,
    type: row.type,
    mineral: row.mineral,
    submitted: row.submitted_on ?? "",
    stage: row.stage,
    status: APPLICATION_STATUS[row.status] ?? "Pending",
    assignedTo: row.assigned_to ?? "Unassigned",
    slaDays: row.sla_days ?? 0,
  };
}

const NC_SEVERITY: Record<string, Severity> = { minor: "Minor", major: "Major", critical: "Critical" };
const NC_STATUS: Record<string, NonConformity["status"]> = {
  open: "Open",
  in_progress: "In Progress",
  awaiting_review: "Awaiting Review",
  closed: "Closed",
  escalated: "Escalated",
};

export function toCorrectiveSubmission(row: ApiCorrectiveSubmission): CorrectiveSubmission {
  const decision = row.decision === "accepted" ? "Accepted" : row.decision === "rejected" ? "Rejected" : undefined;
  return {
    id: row.id,
    at: row.created_at,
    by: row.submitted_by_name,
    message: row.message,
    attachments: row.file ? [row.file] : [],
    ...(decision ? { decision } : {}),
    ...(row.decision_note ? { decisionNote: row.decision_note } : {}),
    ...(row.decided_at ? { decidedAt: row.decided_at } : {}),
  };
}

export function toNonConformity(row: ApiNonConformity): NonConformity {
  return {
    id: row.id,
    ref: row.reference,
    siteId: row.site,
    title: row.title,
    category: row.category,
    severity: NC_SEVERITY[row.severity] ?? "Minor",
    requiredAction: row.required_action,
    responsiblePerson: row.responsible_person,
    deadline: row.deadline,
    raisedAt: isoDate(row.created_at),
    status: NC_STATUS[row.status] ?? "Open",
    submissions: row.submissions.map(toCorrectiveSubmission),
  };
}

const INFO_REQUEST_STATUS: Record<string, InfoRequest["status"]> = {
  open: "Open",
  responded: "Responded",
  closed: "Closed",
};
const PRIORITY: Record<string, InfoRequest["priority"]> = { low: "Low", normal: "Normal", high: "High" };

export function toInfoRequest(row: ApiInfoRequest): InfoRequest {
  return {
    id: row.id,
    siteId: row.site,
    section: row.section || "general",
    subject: row.subject,
    details: row.details,
    requestedFrom: row.site_name,
    requestedBy: row.requested_by_name,
    requestedAt: isoDate(row.created_at),
    dueBy: row.due_by ?? "",
    priority: PRIORITY[row.priority] ?? "Normal",
    status: INFO_REQUEST_STATUS[row.status] ?? "Open",
    ...(row.response_at
      ? { response: { at: row.response_at, by: "", message: row.response_message, attachments: [] } }
      : {}),
  };
}

const DOCUMENT_STATUS: Record<string, DocumentRecord["status"]> = {
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
  expired: "Expired",
};

export function toDocumentRecord(row: ApiDocumentRecord): DocumentRecord {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    siteId: row.site,
    uploaded: isoDate(row.created_at),
    ...(row.expires_on ? { expiry: row.expires_on } : {}),
    status: DOCUMENT_STATUS[row.status] ?? "Pending",
    owner: row.uploaded_by_name,
  };
}

export function toOrgMember(row: OrganisationMembership): OrgMember {
  const name = [row.user.first_name, row.user.last_name].filter(Boolean).join(" ") || row.user.email;
  return { id: row.id, name, email: row.user.email, role: row.role };
}
