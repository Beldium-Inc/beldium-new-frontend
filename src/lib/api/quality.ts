import { apiFetch } from "./client";
import { apiUrl } from "./config";
import { readTokens } from "./tokens";
import type { Paginated, UUID } from "./types";

// The Quality & Control Partner register: accredited labs, their admission
// applications, the samples and custody chain running through them, issued
// certificates, and non-conformities raised against partners.

const BASE = "/quality";

export type QualityRole = "operator" | "partner" | "miner" | "buyer" | "regulator";

export interface QualityCapabilities {
  role: QualityRole | null;
  can_review: boolean;
  can_decide: boolean;
  is_staff: boolean;
}

export type QualityApplicationStatus =
  "submitted" | "in_review" | "info_requested" | "approved" | "rejected";

export type DocStatus = "pending" | "verified" | "flagged" | "expired";

export interface PartnerDocument {
  id: UUID;
  name: string;
  category: "organisation" | "professional" | "laboratory" | "conditional";
  reference: string;
  issuer: string;
  issued: string;
  expires: string | null;
  status: DocStatus;
  note: string;
  conditional_on: string;
  /** Set once a file has been uploaded for this requirement. */
  file_id?: UUID;
}

export interface RiskFlag {
  id: UUID;
  severity: "low" | "medium" | "high";
  title: string;
  detail: string;
  resolved: boolean;
}

export interface AuditEntry {
  id: UUID;
  at: string;
  actor: string;
  role: QualityRole | "";
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

export interface QualityApplication {
  id: UUID;
  reference: string;
  submitted_at: string;
  status: QualityApplicationStatus;
  assigned_to: string;
  risk_score: number;
  organisation: {
    legal_name: string;
    trading_name: string;
    registration_no: string;
    country: string;
    city: string;
    incorporated: string;
    website: string;
    beneficial_owners: { name: string; share: number; pep: boolean }[];
    contact: { name: string; email: string; phone: string };
    /** Present on applications that came in through Q&C onboarding. */
    organisation_type?: string;
    tax_identifier?: string;
    registered_address?: string;
  };
  capability: {
    lead_assessor: string;
    credential: string;
    years_experience: number;
    registry: string;
    registry_id: string;
    staff: { name: string; role: string; competency: string; verified: boolean }[];
    capabilities?: string[];
    minerals?: string[];
    sampling?: {
      geographic_coverage?: string[];
      field_sampling_teams?: number;
      tamper_evident_sealing?: string;
      sampling_procedure_summary?: string;
    };
  };
  laboratory: {
    facility: string;
    accreditation: string;
    accreditation_body: string;
    certificate_no: string;
    valid_until: string;
    last_surveillance: string;
    proficiency_testing: string;
    scope: ScopeItem[];
    accredited_scope?: string;
    laboratories?: { name: string; location: string; registration_number: string }[];
    equipment?: { name: string; serial_number: string; calibration_date: string }[];
  };
  documents: PartnerDocument[];
  risk_flags: RiskFlag[];
  audit: AuditEntry[];
  decision_note: string;
  created_at: string;
  updated_at: string;
}

export type SampleStatus =
  "registered" | "in_transit" | "received" | "testing" | "reviewed" | "certified" | "rejected";

export interface CustodyEvent {
  id: UUID;
  at: string;
  actor: string;
  location: string;
  action: string;
  seal_intact: boolean;
  hash: string;
}

export type ResultVerdict = "pass" | "fail" | "conditional" | "pending";

/** One limit on a buyer specification. Empty `min`/`max` mean unbounded on that side. */
export interface SpecLimit {
  analyte: string;
  unit?: string;
  min?: string;
  max?: string;
  method?: string;
}

export interface TestResult {
  id: UUID;
  analyte: string;
  method: string;
  value: string;
  unit: string;
  spec: string;
  /** The buyer-spec limit this row is measured against, when seeded from one. */
  limit?: SpecLimit;
  verdict: ResultVerdict;
  uncertainty: string;
}

export interface TestRequest {
  id: UUID;
  requested_at: string;
  priority: "standard" | "expedited";
  methods: string[];
  turnaround: string;
  status: "draft" | "submitted" | "accepted" | "complete";
}

export interface QualityReview {
  reviewer: string;
  at: string;
  verdict: ResultVerdict;
  note: string;
}

export interface Sample {
  id: UUID;
  reference: string;
  material: string;
  lot: string;
  mine_site: string;
  origin: string;
  mass_kg: number;
  registered_at: string;
  miner_org: string;
  partner_org: string;
  buyer_org: string;
  buyer_spec: UUID | null;
  miner_organisation: UUID | null;
  partner_organisation: UUID | null;
  buyer_organisation: UUID | null;
  status: SampleStatus;
  custody: CustodyEvent[];
  test_request: TestRequest | null;
  results: TestResult[];
  quality_review: QualityReview | null;
  audit: AuditEntry[];
  created_at: string;
  updated_at: string;
}

export interface BuyerSpec {
  id: UUID;
  name: string;
  buyer_org: string;
  material: string;
  buyer_organisation: UUID | null;
  limits: SpecLimit[];
}

export interface Certificate {
  id: UUID;
  reference: string;
  sample: UUID;
  sample_reference: string;
  material: string;
  issued_at: string;
  issued_by: string;
  valid_until: string;
  status: "active" | "revoked" | "draft";
  verification_hash: string;
  scans: number;
}

export interface CorrectiveAction {
  id: UUID;
  action: string;
  owner: string;
  due: string;
  status: "open" | "in_progress" | "complete";
}

export interface QualityNonConformity {
  id: UUID;
  reference: string;
  title: string;
  raised_at: string;
  raised_by: string;
  against: string;
  severity: "minor" | "major" | "critical";
  status: "open" | "capa_submitted" | "closed";
  detail: string;
  capa: CorrectiveAction[];
}

export interface QualityDashboard {
  role: QualityRole | null;
  capabilities: QualityCapabilities;
  totals: {
    applications: number;
    applications_in_review: number;
    partners_approved: number;
    samples: number;
    samples_in_testing: number;
    certificates_active: number;
    open_non_conformities: number;
  };
  recent_applications: QualityApplication[];
}

// --- capabilities and dashboard ----------------------------------------------

export function fetchQualityCapabilities(signal?: AbortSignal): Promise<QualityCapabilities> {
  return apiFetch<QualityCapabilities>(`${BASE}/me/`, { signal });
}

export function fetchQualityDashboard(signal?: AbortSignal): Promise<QualityDashboard> {
  return apiFetch<QualityDashboard>(`${BASE}/dashboard/`, { signal });
}

// --- applications -------------------------------------------------------------

export interface QualityListQuery {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export function listQualityApplications(
  query: QualityListQuery = {},
): Promise<Paginated<QualityApplication>> {
  return apiFetch<Paginated<QualityApplication>>(`${BASE}/applications/`, { query });
}

export function getQualityApplication(id: UUID): Promise<QualityApplication> {
  return apiFetch<QualityApplication>(`${BASE}/applications/${id}/`);
}

export function setDocumentStatus(
  appId: UUID,
  docId: UUID,
  status: DocStatus,
): Promise<PartnerDocument> {
  return apiFetch<PartnerDocument>(`${BASE}/applications/${appId}/documents/${docId}/`, {
    method: "PATCH",
    body: { status },
  });
}

export function resolveRiskFlag(appId: UUID, flagId: UUID): Promise<RiskFlag> {
  return apiFetch<RiskFlag>(`${BASE}/applications/${appId}/risk-flags/${flagId}/resolve/`, {
    method: "POST",
  });
}

export function decideQualityApplication(
  id: UUID,
  input: { status: QualityApplicationStatus; note?: string | undefined },
): Promise<QualityApplication> {
  return apiFetch<QualityApplication>(`${BASE}/applications/${id}/decide/`, {
    method: "POST",
    body: input,
  });
}

export function assignApplication(id: UUID): Promise<QualityApplication> {
  return apiFetch<QualityApplication>(`${BASE}/applications/${id}/assign/`, { method: "POST" });
}

// --- samples --------------------------------------------------------------------

export function listSamples(query: QualityListQuery = {}): Promise<Paginated<Sample>> {
  return apiFetch<Paginated<Sample>>(`${BASE}/samples/`, { query });
}

export function getSample(id: UUID): Promise<Sample> {
  return apiFetch<Sample>(`${BASE}/samples/${id}/`);
}

export interface NewSampleInput {
  material: string;
  lot: string;
  mine_site: string;
  origin: string;
  mass_kg: number;
  buyer_spec: UUID;
}

export function registerSample(input: NewSampleInput): Promise<Sample> {
  return apiFetch<Sample>(`${BASE}/samples/`, { method: "POST", body: input });
}

export function addCustodyEvent(
  id: UUID,
  input: { action: string; location: string; seal_intact: boolean },
): Promise<Sample> {
  return apiFetch<Sample>(`${BASE}/samples/${id}/custody/`, { method: "POST", body: input });
}

export function createTestRequest(
  id: UUID,
  input: { methods: string[]; priority: "standard" | "expedited"; turnaround: string },
): Promise<Sample> {
  return apiFetch<Sample>(`${BASE}/samples/${id}/test-request/`, { method: "POST", body: input });
}

/**
 * Record a measurement. The verdict is not sent: the API derives it from the
 * measured value and the buyer-spec limit on the row.
 */
export function updateTestResult(
  sampleId: UUID,
  resultId: UUID,
  input: {
    value?: string | undefined;
    unit?: string | undefined;
    spec?: string | undefined;
    uncertainty?: string | undefined;
  },
): Promise<TestResult> {
  return apiFetch<TestResult>(`${BASE}/samples/${sampleId}/results/${resultId}/`, {
    method: "PATCH",
    body: input,
  });
}

export function submitQualityReview(
  id: UUID,
  input: { verdict: ResultVerdict; note: string },
): Promise<Sample> {
  return apiFetch<Sample>(`${BASE}/samples/${id}/review/`, { method: "POST", body: input });
}

export function setSampleStatus(id: UUID, status: SampleStatus): Promise<Sample> {
  return apiFetch<Sample>(`${BASE}/samples/${id}/`, { method: "PATCH", body: { status } });
}

// --- certificates -----------------------------------------------------------

export function listCertificates(query: QualityListQuery = {}): Promise<Paginated<Certificate>> {
  return apiFetch<Paginated<Certificate>>(`${BASE}/certificates/`, { query });
}

export function getCertificate(id: UUID): Promise<Certificate> {
  return apiFetch<Certificate>(`${BASE}/certificates/${id}/`);
}

export function issueCertificate(sampleId: UUID): Promise<Certificate> {
  return apiFetch<Certificate>(`${BASE}/samples/${sampleId}/certificate/`, { method: "POST" });
}

export function revokeCertificate(id: UUID): Promise<Certificate> {
  return apiFetch<Certificate>(`${BASE}/certificates/${id}/revoke/`, { method: "POST" });
}

// --- buyer specs --------------------------------------------------------------

export function listBuyerSpecs(query: QualityListQuery = {}): Promise<Paginated<BuyerSpec>> {
  return apiFetch<Paginated<BuyerSpec>>(`${BASE}/buyer-specs/`, { query });
}

export interface BuyerSpecInput {
  name: string;
  material: string;
  buyer_org?: string | undefined;
  limits: SpecLimit[];
}

export function createBuyerSpec(input: BuyerSpecInput): Promise<BuyerSpec> {
  return apiFetch<BuyerSpec>(`${BASE}/buyer-specs/`, { method: "POST", body: input });
}

export function updateBuyerSpec(id: UUID, input: Partial<BuyerSpecInput>): Promise<BuyerSpec> {
  return apiFetch<BuyerSpec>(`${BASE}/buyer-specs/${id}/`, { method: "PATCH", body: input });
}

// --- non-conformities -----------------------------------------------------------

export function listQualityNonConformities(
  query: QualityListQuery = {},
): Promise<Paginated<QualityNonConformity>> {
  return apiFetch<Paginated<QualityNonConformity>>(`${BASE}/non-conformities/`, { query });
}

export function raiseQualityNonConformity(input: {
  title: string;
  against: string;
  severity: QualityNonConformity["severity"];
  detail: string;
}): Promise<QualityNonConformity> {
  return apiFetch<QualityNonConformity>(`${BASE}/non-conformities/`, {
    method: "POST",
    body: input,
  });
}

export function addCorrectiveAction(
  id: UUID,
  input: { action: string; owner: string; due: string },
): Promise<CorrectiveAction> {
  return apiFetch<CorrectiveAction>(`${BASE}/non-conformities/${id}/capa/`, {
    method: "POST",
    body: input,
  });
}

export function advanceCorrectiveAction(ncId: UUID, actionId: UUID): Promise<CorrectiveAction> {
  return apiFetch<CorrectiveAction>(`${BASE}/non-conformities/${ncId}/capa/${actionId}/advance/`, {
    method: "POST",
  });
}

export function closeQualityNonConformity(id: UUID): Promise<QualityNonConformity> {
  return apiFetch<QualityNonConformity>(`${BASE}/non-conformities/${id}/close/`, {
    method: "POST",
  });
}

// --- application documents ------------------------------------------------------

export interface UploadedApplicationDocument {
  id: UUID;
  application: UUID;
  document_id: string;
  name: string;
  category: string;
  file_url: string | null;
  original_name: string;
  created_at: string;
}

export function uploadQualityApplicationDocument(
  appId: UUID,
  docId: string,
  file: File,
): Promise<UploadedApplicationDocument> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<UploadedApplicationDocument>(
    `${BASE}/applications/${appId}/documents/${docId}/upload/`,
    { method: "POST", body: form },
  );
}

/**
 * Fetch an uploaded document with the bearer token and open it in a new tab.
 * The download route is authenticated, so a plain link would arrive without it.
 */
export async function openApplicationDocument(appId: UUID, docId: string): Promise<void> {
  const tokens = readTokens();
  const response = await fetch(
    apiUrl(`${BASE}/applications/${appId}/documents/${docId}/download/`),
    { headers: tokens ? { Authorization: `Bearer ${tokens.access}` } : {} },
  );
  if (!response.ok) throw new Error("The document could not be opened.");
  const url = URL.createObjectURL(await response.blob());
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// --- notifications -----------------------------------------------------------------

export interface QualityNotification {
  id: UUID;
  title: string;
  body: string;
  event: string;
  read_at: string | null;
  created_at: string;
  sample: UUID | null;
  application: UUID | null;
  certificate: UUID | null;
  non_conformity: UUID | null;
}

export function listQualityNotifications(
  query: QualityListQuery = {},
): Promise<Paginated<QualityNotification>> {
  return apiFetch<Paginated<QualityNotification>>(`${BASE}/notifications/`, { query });
}

export function markQualityNotificationRead(id: UUID): Promise<QualityNotification> {
  return apiFetch<QualityNotification>(`${BASE}/notifications/${id}/read/`, { method: "POST" });
}

// --- public certificate verification -----------------------------------------------

export interface CertificateVerification {
  reference: string;
  sample_reference: string;
  material: string;
  issued_at: string;
  valid_until: string | null;
  status: Certificate["status"];
  scans: number;
}

/** Unauthenticated: anyone holding the hash from a certificate's QR code can check it. */
export function verifyCertificate(hash: string): Promise<CertificateVerification> {
  return apiFetch<CertificateVerification>(
    `${BASE}/certificates/verify/${encodeURIComponent(hash)}/`,
    { auth: false },
  );
}

// --- professional applications ------------------------------------------------

// An individual (officer, inspector) applying to work under a Q&C organisation.
// Beldium reviews the person here; the organisation's administrator answers the
// join request that is sent alongside.

export interface QualityProfessionalInput {
  /** The organisation the applicant is asking to join. */
  organisation: UUID;
  role: "officer_inspector";
  personal: {
    full_legal_name: string;
    /** ISO date (YYYY-MM-DD). */
    date_of_birth: string;
    national_id: string;
    job_title: string;
    base_city: string;
  };
  qualifications: { qualification: string; institution: string; year: string }[];
  certifications: { name: string; certificate_number: string; expiry: string }[];
  capability: { capabilities: string[]; minerals: string[] };
  experience: { years_experience: number; previous_employer: string; summary: string };
  declaration: {
    information_true: boolean;
    consent_to_verification: boolean;
    understands_verification: boolean;
    signature: string;
  };
}

export interface QualityProfessionalDocument {
  id: UUID;
  document_type: string;
  title: string;
  original_name: string;
  created_at: string;
}

export interface QualityProfessionalApplication extends Omit<
  QualityProfessionalInput,
  "organisation"
> {
  id: UUID;
  reference: string;
  status: QualityApplicationStatus;
  applicant_email: string;
  organisation: UUID | null;
  organisation_name: string;
  documents: QualityProfessionalDocument[];
  audit: AuditEntry[];
  decision_note: string;
  submitted_at: string;
}

/**
 * One multipart request: the answers as a JSON string under `data`, and each
 * attached file under its document type.
 */
export function submitQualityProfessionalApplication(
  input: QualityProfessionalInput,
  files: Record<string, File>,
): Promise<QualityProfessionalApplication> {
  const form = new FormData();
  form.append("data", JSON.stringify(input));
  for (const [documentType, file] of Object.entries(files)) form.append(documentType, file);
  return apiFetch<QualityProfessionalApplication>(`${BASE}/professional-applications/`, {
    method: "POST",
    body: form,
  });
}

/** Operators see every application; anyone else sees only their own. */
export function listQualityProfessionalApplications(
  query: QualityListQuery = {},
): Promise<Paginated<QualityProfessionalApplication>> {
  return apiFetch<Paginated<QualityProfessionalApplication>>(`${BASE}/professional-applications/`, {
    query,
  });
}

export function decideQualityProfessionalApplication(
  id: UUID,
  input: { status: QualityApplicationStatus; note?: string | undefined },
): Promise<QualityProfessionalApplication> {
  return apiFetch<QualityProfessionalApplication>(
    `${BASE}/professional-applications/${id}/decide/`,
    { method: "POST", body: input },
  );
}

/** Same reason as `openApplicationDocument`: the download route needs the token. */
export async function openProfessionalDocument(appId: UUID, docId: UUID): Promise<void> {
  const tokens = readTokens();
  const response = await fetch(
    apiUrl(`${BASE}/professional-applications/${appId}/documents/${docId}/download/`),
    { headers: tokens ? { Authorization: `Bearer ${tokens.access}` } : {} },
  );
  if (!response.ok) throw new Error("The document could not be opened.");
  const url = URL.createObjectURL(await response.blob());
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
