// Bidirectional maps between the backend's lowercase snake_case choice
// values (src/lib/api/mining.ts, mirroring beldium-backend/mining/models.py
// and serializers.py) and this vertical's capitalized display vocabulary
// (./types.ts). Verified against the backend source, not guessed.

import type {
  MineSiteRisk,
  MineSiteStatus,
  ReviewSectionStatus,
  NonConformitySeverity,
  NonConformityStatus,
  InspectionStatus,
  InspectionResult,
  MiningSampleStatus,
  LicenceStatus,
  MiningDocumentStatus,
  MiningEvidenceStatus,
  EnvRecordStatus,
  SafetyIncidentStatus,
  EquipmentStatus,
  MiningApplicationStatus,
  PendingReviewStatus,
  InfoRequestStatus,
  Priority,
  MineSite as ApiMineSite,
  MineSiteDetail as ApiMineSiteDetail,
  ReviewSection as ApiReviewSection,
  Evidence as ApiEvidence,
  ScoreFactor as ApiScoreFactor,
  Application as ApiApplication,
  MiningNonConformity as ApiNonConformity,
  CorrectiveSubmission as ApiCorrectiveSubmission,
  MiningInspection as ApiInspection,
  MiningSample as ApiSample,
  PendingReview as ApiPendingReview,
  InfoRequest as ApiInfoRequest,
  LicenceDoc as ApiLicenceDoc,
  DocumentRecord as ApiDocumentRecord,
  EnvRecord as ApiEnvRecord,
  SafetyIncident as ApiSafetyIncident,
  Equipment as ApiEquipment,
  OrganisationProfile as ApiOrganisationProfile,
} from "@/lib/api/mining";
import type { Organisation as ApiOrganisation } from "@/lib/api/types";
import type {
  RiskLevel,
  ReviewStatus,
  Severity,
  MineSite,
  ReviewSection,
  Evidence,
  ScoreFactor,
  Application,
  NonConformity,
  CorrectiveSubmission,
  Inspection,
  Sample,
  PendingReview,
  InfoRequest,
  LicenceDoc,
  DocumentRecord,
  EnvRecord,
  SafetyIncident,
  Equipment,
  Organisation,
} from "./types";

function invert<K extends string, V extends string>(m: Record<K, V>): Record<V, K> {
  const out = {} as Record<V, K>;
  for (const k in m) out[m[k]] = k;
  return out;
}

// --- MineSite.status / risk ---------------------------------------------------

export const siteStatusToUi: Record<MineSiteStatus, MineSite["status"]> = {
  operational: "Operational",
  under_review: "Under Review",
  suspended: "Suspended",
  care_maintenance: "Care & Maintenance",
};
export const siteStatusToApi = invert(siteStatusToUi);

export const siteRiskToUi: Record<MineSiteRisk, RiskLevel> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
export const siteRiskToApi = invert(siteRiskToUi);

// --- ReviewSection.status ------------------------------------------------------

export const sectionStatusToUi: Record<ReviewSectionStatus, ReviewStatus> = {
  pending: "Pending",
  under_review: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
  info_requested: "Info Requested",
  inspection_requested: "Inspection Requested",
  flagged: "Flagged",
};
export const sectionStatusToApi = invert(sectionStatusToUi);

// --- MiningNonConformity.severity / status --------------------------------------------

export const ncSeverityToUi: Record<NonConformitySeverity, Severity> = {
  minor: "Minor",
  major: "Major",
  critical: "Critical",
};
export const ncSeverityToApi = invert(ncSeverityToUi);

export const ncStatusToUi: Record<
  NonConformityStatus,
  "Open" | "In Progress" | "Awaiting Review" | "Closed" | "Escalated"
> = {
  open: "Open",
  in_progress: "In Progress",
  awaiting_review: "Awaiting Review",
  closed: "Closed",
  escalated: "Escalated",
};
export const ncStatusToApi = invert(ncStatusToUi);

// --- MiningInspection.status / result -------------------------------------------------

export const inspectionStatusToUi: Record<
  InspectionStatus,
  "Requested" | "Scheduled" | "Completed" | "Overdue"
> = {
  requested: "Requested",
  scheduled: "Scheduled",
  completed: "Completed",
  overdue: "Overdue",
};
export const inspectionStatusToApi = invert(inspectionStatusToUi);

export const inspectionResultToUi: Record<
  Exclude<InspectionResult, "">,
  "Pass" | "Pass with Observations" | "Fail"
> = {
  pass: "Pass",
  pass_with_observations: "Pass with Observations",
  fail: "Fail",
};
export const inspectionResultToApi = invert(inspectionResultToUi);

// --- MiningSample.status ---------------------------------------------------------------

export const sampleStatusToUi: Record<MiningSampleStatus, "Verified" | "Pending" | "Disputed"> = {
  verified: "Verified",
  pending: "Pending",
  disputed: "Disputed",
};
export const sampleStatusToApi = invert(sampleStatusToUi);

// --- LicenceDoc.status -------------------------------------------------------------

export const licenceStatusToUi: Record<
  LicenceStatus,
  "Active" | "Expiring" | "Expired" | "Suspended"
> = {
  active: "Active",
  expiring: "Expiring",
  expired: "Expired",
  suspended: "Suspended",
};
export const licenceStatusToApi = invert(licenceStatusToUi);

// --- DocumentRecord.status / Evidence.status ----------------------------------------

export const documentStatusToUi: Record<
  MiningDocumentStatus,
  "Pending" | "Verified" | "Rejected" | "Expired"
> = {
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
  expired: "Expired",
};
export const documentStatusToApi = invert(documentStatusToUi);

// Evidence uses the same four states as DocumentRecord.
export const evidenceStatusToUi: Record<
  MiningEvidenceStatus,
  "Pending" | "Verified" | "Rejected" | "Expired"
> = documentStatusToUi;
export const evidenceStatusToApi = invert(evidenceStatusToUi);

// --- EnvRecord.status --------------------------------------------------------------

export const envStatusToUi: Record<EnvRecordStatus, "Within Limit" | "Watch" | "Breach"> = {
  within_limit: "Within Limit",
  watch: "Watch",
  breach: "Breach",
};
export const envStatusToApi = invert(envStatusToUi);

// --- SafetyIncident.status -----------------------------------------------------------

export const safetyStatusToUi: Record<SafetyIncidentStatus, "Investigating" | "Closed"> = {
  investigating: "Investigating",
  closed: "Closed",
};
export const safetyStatusToApi = invert(safetyStatusToUi);

// --- Equipment.status --------------------------------------------------------------

export const equipmentStatusToUi: Record<
  EquipmentStatus,
  "Certified" | "Due Inspection" | "Out of Service"
> = {
  certified: "Certified",
  due_inspection: "Due Inspection",
  out_of_service: "Out of Service",
};
export const equipmentStatusToApi = invert(equipmentStatusToUi);

// --- Application.status --------------------------------------------------------------

export const applicationStatusToUi: Record<
  MiningApplicationStatus,
  "Pending" | "Under Review" | "Approved" | "Rejected" | "Info Requested"
> = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  info_requested: "Info Requested",
};
export const applicationStatusToApi = invert(applicationStatusToUi);

// --- PendingReview.status ------------------------------------------------------------

export const pendingReviewStatusToUi: Record<
  PendingReviewStatus,
  "Queued" | "In Progress" | "Completed"
> = {
  queued: "Queued",
  in_progress: "In Progress",
  completed: "Completed",
};
export const pendingReviewStatusToApi = invert(pendingReviewStatusToUi);

// --- InfoRequest.status / Priority ------------------------------------------------------

export const infoRequestStatusToUi: Record<InfoRequestStatus, "Open" | "Responded" | "Closed"> = {
  open: "Open",
  responded: "Responded",
  closed: "Closed",
};
export const infoRequestStatusToApi = invert(infoRequestStatusToUi);

export const priorityToUi: Record<Priority, "Low" | "Normal" | "High"> = {
  low: "Low",
  normal: "Normal",
  high: "High",
};
export const priorityToApi = invert(priorityToUi);

// --- row mappers: API shape (snake_case, ids) -> UI shape (camelCase, display) ------

function isoDate(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

export function toEvidence(row: ApiEvidence): Evidence {
  return {
    id: row.id,
    name: row.name,
    kind: (["PDF", "Image", "Certificate", "Spreadsheet", "Report"] as const).includes(
      row.kind as never,
    )
      ? (row.kind as Evidence["kind"])
      : "PDF",
    uploaded: isoDate(row.created_at),
    size: "",
    status: evidenceStatusToUi[row.status],
  };
}

export function toScoreFactor(row: ApiScoreFactor): ScoreFactor {
  const trend = row.trend === "up" || row.trend === "down" ? row.trend : "flat";
  return {
    id: row.id,
    label: row.label,
    weight: row.weight,
    score: row.score,
    reason: row.reason,
    trend,
  };
}

export function toReviewSection(row: ApiReviewSection): ReviewSection {
  return {
    key: row.key,
    title: row.title || row.label,
    summary: row.summary,
    weight: row.weight,
    score: row.score,
    status: sectionStatusToUi[row.status],
    fields: row.fields as ReviewSection["fields"],
    evidence: row.evidence.map(toEvidence),
    ...(row.decision_note ? { decisionNote: row.decision_note } : {}),
    ...(row.decided_by_name ? { decidedBy: row.decided_by_name } : {}),
    ...(row.decided_at ? { decidedAt: row.decided_at } : {}),
  };
}

const SECTION_KEYS: ReviewSection["key"][] = [
  "corporate",
  "licence",
  "site",
  "ownership",
  "environmental",
  "safety",
  "equipment",
  "production",
  "sampling",
  "inspection",
];

export function toMineSite(row: ApiMineSite): MineSite {
  const verification = row.verification as Partial<MineSite["verification"]>;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    orgId: row.organisation ?? "",
    mineral: row.mineral,
    state: row.state,
    lga: row.lga,
    lat: row.latitude ?? 0,
    lng: row.longitude ?? 0,
    areaHa: row.area_ha ?? 0,
    licenceId: "",
    status: siteStatusToUi[row.status],
    complianceScore: row.compliance_score,
    risk: siteRiskToUi[row.risk],
    capacityTpa: row.capacity_tpa ?? 0,
    currentTpa: row.current_tpa ?? 0,
    workforce: row.workforce ?? 0,
    lastInspection: row.last_inspection_on ?? "",
    verification: {
      site: Boolean(verification?.site),
      licence: Boolean(verification?.licence),
      documents: Boolean(verification?.documents),
      gps: Boolean(verification?.gps),
    },
    scoreFactors: row.score_factors.map(toScoreFactor),
    riskReasons: row.risk_reasons,
    sections: [],
    production: Array.isArray(row.production)
      ? (row.production as unknown as MineSite["production"])
      : [],
    inventory: Array.isArray(row.inventory)
      ? (row.inventory as unknown as MineSite["inventory"])
      : [],
    transactions: Array.isArray(row.transactions)
      ? (row.transactions as unknown as MineSite["transactions"])
      : [],
  };
}

export function toMineSiteDetail(row: ApiMineSiteDetail): MineSite {
  const site = toMineSite(row);
  const sections = row.sections.map(toReviewSection);
  for (const key of SECTION_KEYS) {
    if (!sections.some((s) => s.key === key)) {
      sections.push({
        key,
        title: key,
        summary: "",
        weight: 0,
        score: 0,
        status: "Pending",
        fields: [],
        evidence: [],
      });
    }
  }
  return { ...site, sections };
}

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
    status: applicationStatusToUi[row.status],
    assignedTo: row.assigned_to ?? "Unassigned",
    slaDays: row.sla_days ?? 0,
  };
}

export function toCorrectiveSubmission(row: ApiCorrectiveSubmission): CorrectiveSubmission {
  const decision =
    row.decision === "accepted" ? "Accepted" : row.decision === "rejected" ? "Rejected" : undefined;
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
    severity: ncSeverityToUi[row.severity],
    requiredAction: row.required_action,
    responsiblePerson: row.responsible_person,
    deadline: row.deadline,
    raisedBy: "",
    raisedAt: isoDate(row.created_at),
    status: ncStatusToUi[row.status],
    submissions: row.submissions.map(toCorrectiveSubmission),
  };
}

export function toInspection(row: ApiInspection): Inspection {
  return {
    id: row.id,
    ref: row.reference,
    siteId: row.site,
    type: row.type,
    scheduled: row.scheduled_for ?? "",
    inspector: row.inspector_display,
    status: inspectionStatusToUi[row.status],
    ...(row.result ? { result: inspectionResultToUi[row.result] } : {}),
    findings: [],
    ...(row.notes ? { notes: row.notes } : {}),
  };
}

export function toSample(row: ApiSample): Sample {
  return {
    id: row.id,
    ref: row.reference,
    siteId: row.site,
    collected: row.collected_on,
    lab: row.lab,
    certificate: row.certificate,
    li2o: row.li2o_percent ?? 0,
    fe2o3: row.fe2o3_percent ?? 0,
    moisture: row.moisture_percent ?? 0,
    status: sampleStatusToUi[row.status],
    method: row.method,
    chainOfCustody: row.chain_of_custody ? [row.chain_of_custody] : [],
  };
}

export function toPendingReview(row: ApiPendingReview): PendingReview {
  return {
    id: row.id,
    siteId: row.site,
    subject: row.subject,
    type: row.type,
    priority: priorityToUi[row.priority],
    submitted: row.submitted_on ?? "",
    due: row.due_on ?? "",
    status: pendingReviewStatusToUi[row.status],
    assignedTo: row.assigned_to ?? "Unassigned",
  };
}

export function toInfoRequest(row: ApiInfoRequest): InfoRequest {
  return {
    id: row.id,
    siteId: row.site,
    section: (row.section || "general") as InfoRequest["section"],
    subject: row.subject,
    details: row.details,
    requestedFrom: row.site_name,
    requestedBy: row.requested_by_name,
    requestedAt: isoDate(row.created_at),
    dueBy: row.due_by ?? "",
    priority: priorityToUi[row.priority],
    status: infoRequestStatusToUi[row.status],
    ...(row.response_at
      ? {
          response: { at: row.response_at, by: "", message: row.response_message, attachments: [] },
        }
      : {}),
  };
}

export function toLicenceDoc(row: ApiLicenceDoc): LicenceDoc {
  return {
    id: row.id,
    number: row.number,
    type: row.type,
    siteId: row.site,
    orgId: "",
    issued: row.issued_on ?? "",
    expiry: row.expires_on ?? "",
    status: licenceStatusToUi[row.status],
    authority: row.authority,
  };
}

export function toDocumentRecord(row: ApiDocumentRecord): DocumentRecord {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    siteId: row.site,
    uploaded: isoDate(row.created_at),
    ...(row.expires_on ? { expiry: row.expires_on } : {}),
    status: documentStatusToUi[row.status],
    owner: row.uploaded_by_name,
  };
}

export function toEnvRecord(row: ApiEnvRecord): EnvRecord {
  return {
    id: row.id,
    siteId: row.site,
    metric: row.metric,
    value: row.value,
    limit: row.limit,
    status: envStatusToUi[row.status],
    measured: row.measured_on,
  };
}

export function toSafetyIncident(row: ApiSafetyIncident): SafetyIncident {
  return {
    id: row.id,
    siteId: row.site,
    date: row.date,
    type: row.type,
    severity: (["Minor", "Major", "Critical"] as const).includes(row.severity as never)
      ? (row.severity as Severity)
      : "Minor",
    lostDays: row.lost_days,
    status: safetyStatusToUi[row.status],
    summary: row.summary,
  };
}

export function toEquipment(row: ApiEquipment): Equipment {
  return {
    id: row.id,
    siteId: row.site,
    name: row.name,
    serial: row.serial,
    certExpiry: row.cert_expires_on ?? "",
    status: equipmentStatusToUi[row.status],
  };
}

const ORG_STATUS_UI: Record<string, Organisation["status"]> = {
  verified: "Active",
  rejected: "Suspended",
  unverified: "Under Review",
  pending: "Under Review",
};

export function toOrganisation(
  row: ApiOrganisation,
  profile: ApiOrganisationProfile | undefined,
  sitesForOrg: MineSite[],
): Organisation {
  const scores = sitesForOrg.map((s) => s.complianceScore);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  return {
    id: row.id,
    name: row.name,
    rcNumber: row.registration_number,
    type: row.organisation_type,
    hq: row.address,
    contact: "",
    email: row.email,
    phone: row.phone_number,
    onboarded: isoDate(row.submitted_at),
    status: ORG_STATUS_UI[row.verification_status] ?? "Under Review",
    complianceScore: avg,
    risk: avg >= 80 ? "Low" : avg >= 60 ? "Medium" : "High",
    siteCount: sitesForOrg.length,
    directors: (profile?.directors ?? []) as Organisation["directors"],
    beneficialOwners: (profile?.beneficial_owners ?? []) as Organisation["beneficialOwners"],
  };
}
