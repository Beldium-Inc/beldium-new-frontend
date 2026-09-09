// The Processing Compliance domain, as this dashboard sees it: the vocabulary
// its screens render against, plus the adapters that turn the Django API's
// rows into that vocabulary.
//
// The API speaks snake_case identifiers and machine values ("in_review"); the
// screens read camelCase and display labels ("In Review"). Rather than spread
// that translation through thirty components, every conversion lives at the
// bottom of this file and the store applies it once.

import type * as Api from "@/lib/api/processing";

export type ReviewState = "pending" | "verified" | "rejected" | "info_requested" | "flagged";

export type SectionKey =
  | "corporate"
  | "regulatory"
  | "facility"
  | "environmental"
  | "health_safety"
  | "equipment"
  | "operational"
  | "quality"
  | "waste"
  | "inspection";

export const SECTIONS: { key: SectionKey; label: string; short: string }[] = [
  { key: "corporate", label: "Corporate & Legal Identity", short: "Corporate" },
  { key: "regulatory", label: "Regulatory Licences & Permits", short: "Regulatory" },
  { key: "facility", label: "Facility & Site Infrastructure", short: "Facility" },
  { key: "environmental", label: "Environmental Management", short: "Environmental" },
  { key: "health_safety", label: "Health, Safety & Workforce", short: "Health & Safety" },
  { key: "equipment", label: "Equipment & Process Technology", short: "Equipment" },
  { key: "operational", label: "Operational Controls", short: "Operational" },
  { key: "quality", label: "Quality Controls & Laboratory", short: "Quality" },
  { key: "waste", label: "Waste & Residue Handling", short: "Waste" },
  { key: "inspection", label: "Physical Inspection Readiness", short: "Inspection" },
];

export type ProcessingType =
  "crushing_milling" | "chemical_refining" | "smelting" | "sorting_baling";

export const PROCESSING_TYPES: {
  key: ProcessingType;
  label: string;
  blurb: string;
  extra: string[];
}[] = [
  {
    key: "crushing_milling",
    label: "Crushing & Milling",
    blurb: "Mechanical size reduction of ore, aggregate or mineral feedstock.",
    extra: ["Dust suppression plan", "Noise & vibration survey", "Crusher calibration records"],
  },
  {
    key: "chemical_refining",
    label: "Chemical Processing / Refining",
    blurb: "Leaching, solvent extraction, acid handling and refining operations.",
    extra: [
      "NESREA effluent discharge permit",
      "Chemical inventory & MSDS register",
      "Tailings / effluent containment design",
      "Emergency chemical spill response plan",
      "Reagent storage bund certification",
    ],
  },
  {
    key: "smelting",
    label: "Smelting & Thermal Recovery",
    blurb: "High-temperature recovery with stack emissions and slag handling.",
    extra: ["Stack emission monitoring", "Slag disposal agreement", "Thermal PPE certification"],
  },
  {
    key: "sorting_baling",
    label: "Sorting, Washing & Baling",
    blurb: "Manual and mechanical separation, washing and densification.",
    extra: ["Wash water recycling plan", "Manual handling risk assessment"],
  },
];

export type DocItem = {
  id: string;
  name: string;
  /** Authenticated download route, or null when nothing has been uploaded. */
  url?: string | null;
  /** The desk's verdict on this document, distinct from its validity `status`. */
  reviewState?: ReviewState;
  ref: string;
  issuer: string;
  issued: string;
  expires: string | null;
  status: "valid" | "expiring" | "expired" | "missing";
};

export type Field = { label: string; value: string; flag?: "ok" | "warn" | "bad" };

export type SectionData = {
  key: SectionKey;
  fields: Field[];
  docs: DocItem[];
  notes?: string;
  /** The desk's verdict on this section, as recorded by the API. */
  reviewState: ReviewState;
  reviewNote: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
};

/** Everything the queue and the dashboards read. Sections are detail-only. */
export type ApplicationSummary = {
  /** The human reference, e.g. `BPC-APP-2026-4D62`. Also the URL segment. */
  id: string;
  /** The API's primary key. Every write is addressed by this, never by `id`. */
  uuid: string;
  company: string;
  rcNumber: string;
  tin: string;
  processingType: ProcessingType;
  state: string;
  lga: string;
  facility: string;
  submitted: string;
  contact: string;
  email: string;
  phone: string;
  capacity: string;
  workforce: number;
  riskScore: number;
  riskBand: "low" | "medium" | "high";
  stage: "New" | "In Review" | "Awaiting Info" | "Inspection" | "Decided";
  decision?: "Approved" | "Conditional Approval" | "More Info Required" | "Rejected";
  completeness: number;
  riskCauses: { id: string; cause: string; weight: number; detail: string }[];
};

/** One application in full: the ten evidence sections and the review tally. */
export type Application = ApplicationSummary & {
  sections: Record<SectionKey, SectionData>;
  review: {
    sectionsTotal: number;
    sectionsVerified: number;
    sectionsRejected: number;
    sectionsFlagged: number;
  };
  /** Empty exactly when the application is submittable. */
  outstanding: SectionGap[];
};

export type NonConformity = {
  /** The human reference, e.g. `BPC-NC-2026-EADC`. */
  id: string;
  /** The API's primary key; writes are addressed by this. */
  uuid: string;
  /** The owning application's reference, which is also its URL segment. */
  applicationId: string;
  applicationUuid: string | null;
  company: string;
  section: SectionKey;
  severity: "Minor" | "Major" | "Critical";
  title: string;
  detail: string;
  raised: string;
  due: string;
  status: "Open" | "Evidence Submitted" | "Closed";
  evidence?: { name: string; submitted: string; note: string };
};

export type Inspection = {
  id: string;
  uuid: string;
  applicationId: string;
  company: string;
  facility: string;
  state: string;
  scheduled: string;
  inspector: string;
  type: "Pre-approval" | "Routine" | "Follow-up" | "Incident-triggered";
  status: "Scheduled" | "In Progress" | "Completed" | "Requested";
  outcome?: string;
};

export type Processor = {
  id: string;
  uuid: string;
  name: string;
  rcNumber: string;
  tin: string;
  state: string;
  lga: string;
  facilities: number;
  processingType: ProcessingType;
  status: "Approved" | "Conditional" | "Suspended" | "Under Review";
  complianceScore: number;
  lastInspection: string;
  openNCs: number;
  registered: string;
};

export type EnvAlert = {
  id: string;
  uuid: string;
  facility: string;
  state: string;
  parameter: string;
  reading: string;
  threshold: string;
  severity: "Warning" | "Critical";
  detected: string;
  status: "Open" | "Acknowledged" | "Resolved";
};

export type Incident = {
  id: string;
  uuid: string;
  facility: string;
  state: string;
  type: string;
  severity: "Low" | "Moderate" | "Severe";
  reported: string;
  status: "Under Investigation" | "Closed" | "Reported";
  summary: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  detail: string;
};

export type TraceRun = {
  runId: string;
  inputBatch: string;
  inputSource: string;
  inputMass: string;
  process: string;
  started: string;
  completed: string;
  outputBatch: string;
  outputMass: string;
  yield: string;
  qc: { assay: string; moisture: string; verdict: "Pass" | "Hold" | "Fail"; lab: string };
  facility: string;
};

export function processingTypeLabel(t: ProcessingType) {
  return PROCESSING_TYPES.find((p) => p.key === t)?.label ?? t;
}

export function sectionLabel(k: SectionKey) {
  return SECTIONS.find((s) => s.key === k)?.label ?? k;
}

// --- shapes the dashboards read that have no per-row model -------------------

export type RegionalRow = {
  region: string;
  processors: number;
  compliant: number;
  conditional: number;
  suspended: number;
  avgScore: number;
};

export type KpiPoint = {
  month: string;
  approvals: number;
  nonconformities: number;
  inspections: number;
};

export type ExpiringDoc = {
  doc: string;
  ref: string;
  company: string;
  expires: string;
  days: number;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  at: string;
  kind: "info" | "warn" | "error";
};

export type ReportItem = {
  id: string;
  /** The API's key, for downloads. */
  uuid: string;
  kind: string;
  title: string;
  period: string;
  generated: string;
  pages: number;
  scope: string;
  /** Authenticated download route, or null when no file was ever stored. */
  fileUrl: string | null;
};

export type Totals = Api.ProcessingDashboard["totals"];

/** One section's remaining gaps, as the API computes them. */
export type SectionGap = {
  section: SectionKey;
  label: string;
  missingPrompts: string[];
  missingDocuments: string[];
};

// --- adapters ----------------------------------------------------------------

const STAGE_LABEL: Record<Api.ApplicationStage, ApplicationSummary["stage"]> = {
  new: "New",
  in_review: "In Review",
  awaiting_info: "Awaiting Info",
  inspection: "Inspection",
  decided: "Decided",
};

const DECISION_LABEL: Record<
  Api.ApplicationDecisionValue,
  NonNullable<ApplicationSummary["decision"]>
> = {
  approved: "Approved",
  conditional_approval: "Conditional Approval",
  more_info_required: "More Info Required",
  rejected: "Rejected",
};

const SEVERITY_LABEL: Record<Api.NonConformity["severity"], NonConformity["severity"]> = {
  minor: "Minor",
  major: "Major",
  critical: "Critical",
};

const NC_STATUS_LABEL: Record<Api.NonConformity["status"], NonConformity["status"]> = {
  open: "Open",
  evidence_submitted: "Evidence Submitted",
  closed: "Closed",
};

const INSPECTION_TYPE_LABEL: Record<Api.Inspection["inspection_type"], Inspection["type"]> = {
  pre_approval: "Pre-approval",
  routine: "Routine",
  follow_up: "Follow-up",
  incident_triggered: "Incident-triggered",
};

const INSPECTION_STATUS_LABEL: Record<Api.Inspection["status"], Inspection["status"]> = {
  requested: "Requested",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
};

const PROCESSOR_STATUS_LABEL: Record<Api.ProcessorStatus, Processor["status"]> = {
  approved: "Approved",
  conditional: "Conditional",
  suspended: "Suspended",
  under_review: "Under Review",
};

const ALERT_SEVERITY_LABEL: Record<Api.EnvironmentalAlert["severity"], EnvAlert["severity"]> = {
  warning: "Warning",
  critical: "Critical",
};

const ALERT_STATUS_LABEL: Record<Api.EnvironmentalAlert["status"], EnvAlert["status"]> = {
  open: "Open",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
};

const INCIDENT_SEVERITY_LABEL: Record<Api.Incident["severity"], Incident["severity"]> = {
  low: "Low",
  moderate: "Moderate",
  severe: "Severe",
};

const INCIDENT_STATUS_LABEL: Record<Api.Incident["status"], Incident["status"]> = {
  reported: "Reported",
  under_investigation: "Under Investigation",
  closed: "Closed",
};

const QC_VERDICT_LABEL: Record<Api.TraceabilityRun["qc_verdict"], TraceRun["qc"]["verdict"]> = {
  pass: "Pass",
  hold: "Hold",
  fail: "Fail",
};

/** Machine values the API expects back, keyed by the label the UI hands over. */
export const DECISION_VALUE: Record<
  NonNullable<ApplicationSummary["decision"]>,
  Api.ApplicationDecisionValue
> = {
  Approved: "approved",
  "Conditional Approval": "conditional_approval",
  "More Info Required": "more_info_required",
  Rejected: "rejected",
};

export const SEVERITY_VALUE: Record<NonConformity["severity"], Api.NonConformity["severity"]> = {
  Minor: "minor",
  Major: "major",
  Critical: "critical",
};

/** `2026-08-14T06:00:00Z` → `2026-08-14 06:00`, the format these screens show. */
function minuteStamp(iso: string | null): string {
  return iso ? iso.slice(0, 16).replace("T", " ") : "";
}

/** Kilograms to the tonne figure the screens print. */
function tonnes(kg: number): string {
  return `${(kg / 1000).toFixed(1)} t`;
}

export function toDocItem(document: Api.ProcessingDocument): DocItem {
  return {
    id: document.id,
    name: document.name,
    url: document.file_url,
    ref: document.reference,
    issuer: document.issuer,
    issued: document.issued_on ?? "",
    expires: document.expires_on,
    status: document.status,
    reviewState: document.review_state,
  };
}

export function toApplicationSummary(row: Api.ProcessingApplication): ApplicationSummary {
  return {
    id: row.reference,
    uuid: row.id,
    company: row.company,
    rcNumber: row.rc_number,
    tin: row.tin,
    processingType: row.processing_type as ProcessingType,
    state: row.state,
    lga: row.lga,
    facility: row.facility_name,
    submitted: row.submitted_on ?? "",
    contact: row.contact_name,
    email: row.contact_email,
    phone: row.contact_phone,
    capacity: row.capacity,
    workforce: row.workforce,
    riskScore: row.risk_score,
    riskBand: row.risk_band,
    stage: STAGE_LABEL[row.stage],
    ...(row.decision ? { decision: DECISION_LABEL[row.decision] } : {}),
    completeness: row.completeness,
    riskCauses: row.risk_causes.map((cause) => ({
      id: cause.id,
      cause: cause.cause,
      weight: cause.weight,
      detail: cause.detail,
    })),
  };
}

export function toApplication(row: Api.ProcessingApplicationDetail): Application {
  const sections = {} as Record<SectionKey, SectionData>;
  for (const section of row.sections) {
    const key = section.key as SectionKey;
    sections[key] = {
      key,
      fields: section.fields as Field[],
      docs: section.documents.map(toDocItem),
      notes: section.notes,
      reviewState: section.review_state,
      reviewNote: section.review_note,
      reviewedBy: section.reviewed_by_name,
      reviewedAt: section.reviewed_at,
    };
  }
  // A section the API has not laid down yet would otherwise be `undefined` on
  // a Record the screens index into unguarded.
  for (const { key } of SECTIONS) {
    sections[key] ??= {
      key,
      fields: [],
      docs: [],
      reviewState: "pending",
      reviewNote: "",
      reviewedBy: null,
      reviewedAt: null,
    };
  }
  return {
    ...toApplicationSummary(row),
    sections,
    review: {
      sectionsTotal: row.review.sections_total,
      sectionsVerified: row.review.sections_verified,
      sectionsRejected: row.review.sections_rejected,
      sectionsFlagged: row.review.sections_flagged,
    },
    outstanding: (row.outstanding ?? []).map(toSectionGap),
  };
}

export function toSectionGap(row: Api.SectionGap): SectionGap {
  return {
    section: row.section as SectionKey,
    label: row.label,
    missingPrompts: row.missing_prompts,
    missingDocuments: row.missing_documents,
  };
}

/**
 * The gaps an incomplete submission came back with. The API returns them in
 * `error.details.outstanding`; a failure with no such payload yields none.
 */
export function outstandingFromError(error: unknown): SectionGap[] {
  const details = (error as { details?: unknown })?.details;
  if (!details || typeof details !== "object") return [];
  const rows = (details as { outstanding?: unknown }).outstanding;
  return Array.isArray(rows) ? (rows as Api.SectionGap[]).map(toSectionGap) : [];
}

export function toNonConformity(
  row: Api.NonConformity,
  applicationReference: string,
): NonConformity {
  const evidence = row.evidence[0];
  return {
    id: row.reference,
    uuid: row.id,
    applicationId: applicationReference,
    applicationUuid: row.application,
    company: row.company,
    section: row.section as SectionKey,
    severity: SEVERITY_LABEL[row.severity],
    title: row.title,
    detail: row.detail,
    raised: row.raised_on,
    due: row.due_on,
    status: NC_STATUS_LABEL[row.status],
    ...(evidence
      ? {
          evidence: {
            name: evidence.name,
            submitted: evidence.created_at.slice(0, 10),
            note: evidence.note,
          },
        }
      : {}),
  };
}

export function toInspection(row: Api.Inspection, applicationReference: string): Inspection {
  return {
    id: row.reference,
    uuid: row.id,
    applicationId: applicationReference,
    company: row.company,
    facility: row.facility_name,
    state: row.state,
    scheduled: row.scheduled_for ?? "To be confirmed",
    inspector: row.inspector_display,
    type: INSPECTION_TYPE_LABEL[row.inspection_type],
    status: INSPECTION_STATUS_LABEL[row.status],
    ...(row.outcome ? { outcome: row.outcome } : {}),
  };
}

export function toProcessor(row: Api.Processor): Processor {
  return {
    id: row.reference,
    uuid: row.id,
    name: row.name,
    rcNumber: row.rc_number,
    tin: row.tin,
    state: row.state,
    lga: row.lga,
    facilities: row.facilities_count,
    processingType: row.processing_type as ProcessingType,
    status: PROCESSOR_STATUS_LABEL[row.status],
    complianceScore: row.compliance_score,
    lastInspection: row.last_inspection_on ?? "-",
    openNCs: row.open_non_conformities,
    registered: row.registered_on,
  };
}

export function toEnvAlert(row: Api.EnvironmentalAlert): EnvAlert {
  return {
    id: row.reference,
    uuid: row.id,
    facility: row.facility_name,
    state: row.state,
    parameter: row.parameter,
    reading: row.reading,
    threshold: row.threshold,
    severity: ALERT_SEVERITY_LABEL[row.severity],
    detected: row.detected_on,
    status: ALERT_STATUS_LABEL[row.status],
  };
}

export function toIncident(row: Api.Incident): Incident {
  return {
    id: row.reference,
    uuid: row.id,
    facility: row.facility_name,
    state: row.state,
    type: row.incident_type,
    severity: INCIDENT_SEVERITY_LABEL[row.severity],
    reported: row.reported_on,
    status: INCIDENT_STATUS_LABEL[row.status],
    summary: row.summary,
  };
}

export function toTraceRun(row: Api.TraceabilityRun): TraceRun {
  return {
    runId: row.reference,
    inputBatch: row.input_batch,
    inputSource: row.input_source,
    inputMass: tonnes(row.input_mass_kg),
    process: row.process,
    started: minuteStamp(row.started_at),
    completed: minuteStamp(row.completed_at),
    outputBatch: row.output_batch,
    outputMass: tonnes(row.output_mass_kg),
    yield: `${row.yield_percent}%`,
    qc: {
      assay: row.qc_assay,
      moisture: row.qc_moisture,
      verdict: QC_VERDICT_LABEL[row.qc_verdict],
      lab: row.qc_lab,
    },
    facility: row.facility_name,
  };
}

export function toAuditEvent(row: Api.ProcessingAuditEvent): AuditEvent {
  return {
    id: row.id,
    at: minuteStamp(row.created_at),
    actor: row.actor,
    role: row.role,
    action: row.action,
    target: row.target,
    detail: row.detail,
  };
}

export function toRegionalRow(
  row: Api.ProcessingDashboard["regional_compliance"][number],
): RegionalRow {
  return {
    region: row.region,
    processors: row.processors,
    compliant: row.compliant,
    conditional: row.conditional,
    suspended: row.suspended,
    avgScore: row.avg_score,
  };
}

export function toExpiringDoc(row: Api.ExpiringDocument): ExpiringDoc {
  return {
    doc: row.name,
    ref: row.reference || row.id,
    company: row.company,
    expires: row.expires_on,
    days: row.days_to_expiry,
  };
}

export function toNotification(
  row: Api.ProcessingDashboard["notifications"][number],
): Notification {
  return { id: row.id, title: row.title, body: row.body, at: relativeTime(row.at), kind: row.kind };
}

export function toReportItem(row: Api.ComplianceReport): ReportItem {
  return {
    id: row.reference,
    uuid: row.id,
    kind: row.kind,
    title: row.title,
    period: row.period_label,
    generated: row.generated_on,
    pages: row.pages,
    scope: row.scope,
    fileUrl: row.file_url,
  };
}

/** "2h ago" / "3d ago" — the notification tray's own format. */
export function relativeTime(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
