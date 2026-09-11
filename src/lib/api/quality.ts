import { apiFetch } from "./client";
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
  };
  capability: {
    lead_assessor: string;
    credential: string;
    years_experience: number;
    registry: string;
    registry_id: string;
    staff: { name: string; role: string; competency: string; verified: boolean }[];
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

export interface TestResult {
  id: UUID;
  analyte: string;
  method: string;
  value: string;
  unit: string;
  spec: string;
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
  limits: { analyte: string; rule: string; target: string }[];
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

export function setResultVerdict(
  sampleId: UUID,
  resultId: UUID,
  input: { verdict: ResultVerdict; value?: string | undefined },
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
