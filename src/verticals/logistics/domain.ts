// The Logistics Compliance domain, as this dashboard sees it: the vocabulary
// its screens render against, plus the adapters that turn the Django API's
// rows into that vocabulary.
//
// The API speaks snake_case identifiers and machine values ("under_review");
// the screens read camelCase and display labels ("Under Review"). Rather than
// spread that translation through thirty components, every conversion lives
// at the bottom of this file and the store applies it once.

import type * as Api from "@/lib/api/logistics";

export type DomainKey =
  | "corporate"
  | "regulatory"
  | "fleet"
  | "driver"
  | "insurance"
  | "hs"
  | "operational"
  | "mineral"
  | "data";

export const DOMAINS: { key: DomainKey; label: string; short: string }[] = [
  { key: "corporate", label: "Corporate Verification", short: "Corporate" },
  { key: "regulatory", label: "Regulatory Licensing", short: "Regulatory" },
  { key: "fleet", label: "Fleet Compliance", short: "Fleet" },
  { key: "driver", label: "Driver Compliance", short: "Driver" },
  { key: "insurance", label: "Insurance Cover", short: "Insurance" },
  { key: "hs", label: "Health & Safety", short: "H&S" },
  { key: "operational", label: "Operational Capability", short: "Operational" },
  { key: "mineral", label: "Mineral Transport", short: "Mineral" },
  { key: "data", label: "Data & Platform", short: "Data" },
];

export function domainLabel(key: DomainKey): string {
  return DOMAINS.find((d) => d.key === key)?.label ?? key;
}

export type LogisticsApplicationStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Awaiting Information"
  | "Conditionally Approved"
  | "Approved"
  | "Rejected"
  | "Not Started";

export type EvidenceStatus = "pending" | "verified" | "rejected";
export type DomainReviewStatus = "pending" | "passed" | "attention" | "failed";
export type RiskBand = "low" | "medium" | "high";
export type CredentialValidity = "current" | "expiring" | "expired";

const STATUS_LABEL: Record<Api.LogisticsApplicationStatus, LogisticsApplicationStatus> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  awaiting_information: "Awaiting Information",
  conditionally_approved: "Conditionally Approved",
  approved: "Approved",
  rejected: "Rejected",
};

export function applicationStatusLabel(status: Api.LogisticsApplicationStatus | "not_started"): LogisticsApplicationStatus {
  return status === "not_started" ? "Not Started" : STATUS_LABEL[status];
}

// --- companies -----------------------------------------------------------

export type Company = {
  id: string;
  uuid: string;
  organisation: string;
  reference: string;
  name: string;
  registrationNumber: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  incorporatedOn: string | null;
  employees: number;
  annualTonnage: string;
  services: string[];
  createdAt: string;
  updatedAt: string;
};

export function toCompany(row: Api.LogisticsCompany): Company {
  return {
    id: row.reference,
    uuid: row.id,
    organisation: row.organisation,
    reference: row.reference,
    name: row.name,
    registrationNumber: row.registration_number,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    incorporatedOn: row.incorporated_on,
    employees: row.employees,
    annualTonnage: row.annual_tonnage,
    services: row.services,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// --- locations -----------------------------------------------------------

export type OperatingLocation = {
  id: string;
  company: string;
  name: string;
  type: string;
  address: string;
  state: string;
  country: string;
  staff: number;
};

export function toLocation(row: Api.OperatingLocation): OperatingLocation {
  return {
    id: row.id,
    company: row.company,
    name: row.name,
    type: row.location_type,
    address: row.address,
    state: row.state,
    country: row.country,
    staff: row.staff_count,
  };
}

// --- vehicles / drivers ---------------------------------------------------

export type Vehicle = {
  id: string;
  company: string;
  registration: string;
  vin: string;
  type: string;
  make: string;
  model: string;
  year: number;
  capacity: string;
  capacityUnit: "tonnes" | "litres" | "seats";
  ownership: "Owned" | "Leased" | "Contracted";
  insurer: string;
  insuranceExpiry: string;
  roadworthinessExpiry: string;
  gps: "Unknown" | "Active" | "Intermittent" | "Inactive";
  location: string;
  isActive: boolean;
  credentialStatus: CredentialValidity;
};

const OWNERSHIP_LABEL: Record<Api.Vehicle["ownership"], Vehicle["ownership"]> = {
  owned: "Owned",
  leased: "Leased",
  contracted: "Contracted",
};

const GPS_LABEL: Record<Api.Vehicle["gps_status"], Vehicle["gps"]> = {
  unknown: "Unknown",
  active: "Active",
  intermittent: "Intermittent",
  inactive: "Inactive",
};

export function toVehicle(row: Api.Vehicle): Vehicle {
  return {
    id: row.id,
    company: row.company,
    registration: row.registration,
    vin: row.vin,
    type: row.vehicle_type,
    make: row.make,
    model: row.model,
    year: row.year,
    capacity: `${row.capacity} ${row.capacity_unit}`,
    capacityUnit: row.capacity_unit,
    ownership: OWNERSHIP_LABEL[row.ownership],
    insurer: row.insurer,
    insuranceExpiry: row.insurance_expiry,
    roadworthinessExpiry: row.roadworthiness_expiry,
    gps: GPS_LABEL[row.gps_status],
    location: row.location,
    isActive: row.is_active,
    credentialStatus: row.credential_status,
  };
}

export type Driver = {
  id: string;
  company: string;
  name: string;
  licence: string;
  licenceClass: string;
  licenceExpiry: string;
  nationalId: string;
  experience: number;
  assignedVehicle: string | null;
  training: string[];
  medicalExpiry: string;
  isActive: boolean;
  credentialStatus: CredentialValidity;
};

export function toDriver(row: Api.Driver): Driver {
  return {
    id: row.id,
    company: row.company,
    name: row.full_name,
    licence: row.licence_number,
    licenceClass: row.licence_class,
    licenceExpiry: row.licence_expiry,
    nationalId: row.national_id,
    experience: row.years_experience,
    assignedVehicle: row.assigned_vehicle,
    training: row.training,
    medicalExpiry: row.medical_expiry,
    isActive: row.is_active,
    credentialStatus: row.credential_status,
  };
}

// --- applications ----------------------------------------------------------

export type DocItem = {
  id: string;
  domain: DomainKey;
  documentType: string;
  title: string;
  issuer: string;
  reference: string;
  issued: string | null;
  expires: string | null;
  serviceScope: string;
  vehicle: string | null;
  driver: string | null;
  condition: string | null;
  originalName: string;
  version: number;
  isCurrent: boolean;
  status: EvidenceStatus;
  validity: CredentialValidity;
  downloadUrl: string;
  reviewNotes: string;
  reviewedAt: string | null;
};

export function toDocItem(row: Api.LogisticsDocument): DocItem {
  return {
    id: row.id,
    domain: row.domain,
    documentType: row.document_type,
    title: row.title,
    issuer: row.issuer,
    reference: row.reference,
    issued: row.issued_on,
    expires: row.expires_on,
    serviceScope: row.service_scope,
    vehicle: row.vehicle,
    driver: row.driver,
    condition: row.condition,
    originalName: row.original_name,
    version: row.version,
    isCurrent: row.is_current,
    status: row.status,
    validity: row.validity,
    downloadUrl: row.download_url,
    reviewNotes: row.review_notes,
    reviewedAt: row.reviewed_at,
  };
}

export type DomainSection = {
  key: DomainKey;
  label: string;
  data: Record<string, unknown>;
  applicable: boolean;
  status: DomainReviewStatus;
  score: number;
  reviewNotes: string;
  reviewedAt: string | null;
};

export function toDomainSection(row: Api.DomainReview): DomainSection {
  const key = row.key as DomainKey;
  return {
    key,
    label: domainLabel(key),
    data: row.data,
    applicable: row.applicable,
    status: row.status,
    score: row.score,
    reviewNotes: row.review_notes,
    reviewedAt: row.reviewed_at,
  };
}

export type Condition = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  serviceScope: string;
  clearedAt: string | null;
  isOverdue: boolean;
};

export function toCondition(row: Api.ApprovalCondition): Condition {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    serviceScope: row.service_scope,
    clearedAt: row.cleared_at,
    isOverdue: row.is_overdue,
  };
}

export type Application = {
  id: string;
  company: string;
  createdBy: string;
  reviewer: string | null;
  status: LogisticsApplicationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  rationale: string;
  policyVersion: string;
  sections: DomainSection[];
  conditions: Condition[];
  progressPercent: number;
  missingSections: DomainKey[];
  missingDocumentDomains: DomainKey[];
  documentsSubmitted: number;
  complianceScore: number;
  riskBand: RiskBand;
};

export function toApplication(row: Api.LogisticsApplication): Application {
  return {
    id: row.id,
    company: row.company,
    createdBy: row.created_by,
    reviewer: row.reviewer,
    status: applicationStatusLabel(row.status),
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    rationale: row.rationale,
    policyVersion: row.policy_version,
    sections: row.sections.map(toDomainSection),
    conditions: row.conditions.map(toCondition),
    progressPercent: row.progress?.percent ?? 0,
    missingSections: (row.progress?.missing_sections ?? []) as DomainKey[],
    missingDocumentDomains: (row.progress?.missing_document_domains ?? []) as DomainKey[],
    documentsSubmitted: row.progress?.documents_submitted ?? 0,
    complianceScore: row.risk?.compliance_score ?? 0,
    riskBand: row.risk?.risk_band ?? "low",
  };
}

// --- requests ----------------------------------------------------------------

export type RequestResponse = {
  id: string;
  message: string;
  documents: string[];
  author: string;
  createdAt: string;
};

export type InfoRequest = {
  id: string;
  application: string;
  reason: string;
  message: string;
  items: string[];
  dueDate: string;
  status: "Open" | "Responded" | "Accepted";
  raisedBy: string;
  reviewNotes: string;
  responses: RequestResponse[];
  isOverdue: boolean;
  createdAt: string;
};

const REQUEST_STATUS_LABEL: Record<Api.InformationRequest["status"], InfoRequest["status"]> = {
  open: "Open",
  responded: "Responded",
  accepted: "Accepted",
};

export function toInfoRequest(row: Api.InformationRequest): InfoRequest {
  return {
    id: row.id,
    application: row.application,
    reason: row.reason,
    message: row.message,
    items: row.items,
    dueDate: row.due_date,
    status: REQUEST_STATUS_LABEL[row.status],
    raisedBy: row.raised_by,
    reviewNotes: row.review_notes,
    responses: row.responses.map((response) => ({
      id: response.id,
      message: response.message,
      documents: response.documents,
      author: response.author,
      createdAt: response.created_at,
    })),
    isOverdue: row.is_overdue,
    createdAt: row.created_at,
  };
}

// --- restrictions --------------------------------------------------------------

export type Restriction = {
  id: string;
  company: string;
  serviceScope: string;
  reason: string;
  automatic: boolean;
  resolvedAt: string | null;
  resolutionNotes: string;
};

export function toRestriction(row: Api.ScopeRestriction): Restriction {
  return {
    id: row.id,
    company: row.company,
    serviceScope: row.service_scope,
    reason: row.reason,
    automatic: row.automatic,
    resolvedAt: row.resolved_at,
    resolutionNotes: row.resolution_notes,
  };
}

// --- notifications & alerts ----------------------------------------------------

export type Notification = {
  id: string;
  company: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
};

export function toNotification(row: Api.Notification): Notification {
  return {
    id: row.id,
    company: row.company,
    title: row.title,
    body: row.body,
    at: relativeTime(row.created_at),
    read: Boolean(row.read_at),
  };
}

export type Alert = {
  id: string;
  company: string;
  kind: string;
  message: string;
  at: string;
};

export function toAlert(row: Api.MonitoringEvent): Alert {
  return {
    id: row.id,
    company: row.company,
    kind: row.kind,
    message: row.message,
    at: row.created_at,
  };
}

// --- audit -----------------------------------------------------------------

export type AuditEvent = {
  id: string;
  at: string;
  action: string;
  actor: string | null;
};

export function toAuditEvent(row: Api.LogisticsAuditEvent): AuditEvent {
  return {
    id: row.id,
    at: minuteStamp(row.created_at),
    action: row.event_type.replace(/^logistics\./, "").replace(/_/g, " "),
    actor: row.actor_id,
  };
}

// --- dashboard ---------------------------------------------------------------

export type DashboardCompanyRow = {
  companyId: string;
  reference: string;
  name: string;
  applicationId: string | null;
  status: LogisticsApplicationStatus;
  progressPercent: number | null;
  complianceScore: number | null;
  riskBand: RiskBand | null;
  fleetCount: number;
  driverCount: number;
  openRequests: number;
  expiringDocuments: number;
  openAlerts: number;
  permittedScopes: string[];
  restrictedScopes: string[];
};

export function toDashboardCompanyRow(row: Api.LogisticsDashboardCompany): DashboardCompanyRow {
  return {
    companyId: row.company_id,
    reference: row.reference,
    name: row.name,
    applicationId: row.application_id,
    status: applicationStatusLabel(row.status),
    progressPercent: row.progress?.percent ?? null,
    complianceScore: row.risk?.compliance_score ?? null,
    riskBand: row.risk?.risk_band ?? null,
    fleetCount: row.fleet_count,
    driverCount: row.driver_count,
    openRequests: row.open_requests,
    expiringDocuments: row.expiring_documents,
    openAlerts: row.open_alerts,
    permittedScopes: row.permitted_scopes,
    restrictedScopes: row.restricted_scopes,
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

/** `2026-08-14T06:00:00Z` → `2026-08-14 06:00`, the format these screens show. */
export function minuteStamp(iso: string | null): string {
  return iso ? iso.slice(0, 16).replace("T", " ") : "";
}
