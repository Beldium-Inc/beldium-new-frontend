import { apiFetch } from "./client";
import type {
  ApplicationActivity,
  ApplicationMessage,
  ComplianceApplication,
  ComplianceDocument,
  ConflictDeclarationData,
  DashboardResponse,
  DeclarationData,
  DocumentRequirement,
  InspectionCapabilityData,
  OrganisationProfileData,
  Paginated,
  Personnel,
  ProfessionalCapabilityData,
  RepresentativeData,
  ServicesData,
  UUID,
} from "./types";

// One compliance application per organisation (the backend field is a
// OneToOne), so the organisation has to exist before an application can.
// Everything on the application except `organisation` is read-only: the seven
// sections are written through their own PATCH endpoints below.

export function listComplianceApplications(): Promise<Paginated<ComplianceApplication>> {
  return apiFetch<Paginated<ComplianceApplication>>("/compliance-applications/");
}

export function getComplianceApplication(id: UUID): Promise<ComplianceApplication> {
  return apiFetch<ComplianceApplication>(`/compliance-applications/${id}/`);
}

export function createComplianceApplication(organisation: UUID): Promise<ComplianceApplication> {
  return apiFetch<ComplianceApplication>("/compliance-applications/", {
    method: "POST",
    body: { organisation },
  });
}

/**
 * PATCH on the application itself. The serialiser marks every field but
 * `organisation` read-only, so this is only useful as a no-op refresh; section
 * writes go through `saveSection`.
 */
export function updateComplianceApplication(
  id: UUID,
  patch: Record<string, unknown>,
): Promise<ComplianceApplication> {
  return apiFetch<ComplianceApplication>(`/compliance-applications/${id}/`, {
    method: "PATCH",
    body: patch,
  });
}

// --- sections ---------------------------------------------------------------

/** The seven section slugs, exactly as the backend routes them. */
export const SECTION_SLUGS = [
  "organisation",
  "representative",
  "services",
  "professional-capability",
  "inspection-capability",
  "conflict-declaration",
  "declaration",
] as const;

export type SectionSlug = (typeof SECTION_SLUGS)[number];

/** Payload shape per section, so callers cannot post one section's data to another. */
export interface SectionData {
  organisation: OrganisationProfileData;
  representative: RepresentativeData;
  services: ServicesData;
  "professional-capability": ProfessionalCapabilityData;
  "inspection-capability": InspectionCapabilityData;
  "conflict-declaration": ConflictDeclarationData;
  declaration: DeclarationData;
}

/**
 * Save one section. The backend validates the whole `data` object on every
 * write (there is no partial save) and returns the full application, so the
 * caller can replace its cached copy with the saved state rather than assuming
 * the optimistic one took.
 */
export function saveSection<S extends SectionSlug>(
  id: UUID,
  section: S,
  data: SectionData[S],
): Promise<ComplianceApplication> {
  return apiFetch<ComplianceApplication>(`/compliance-applications/${id}/sections/${section}/`, {
    method: "PATCH",
    body: { data },
  });
}

// --- personnel --------------------------------------------------------------

export interface PersonnelInput {
  full_name: string;
  role: string;
  discipline?: string;
  qualification?: string;
  years_experience?: number;
  registration_number?: string;
  cv?: File | null;
  certificate?: File | null;
}

/**
 * Personnel accepts JSON or multipart; the CV and certificate are file fields,
 * so anything carrying one has to go up as multipart.
 */
function personnelBody(input: Partial<PersonnelInput>): FormData | Record<string, unknown> {
  const { cv, certificate, ...rest } = input;
  if (!cv && !certificate) return rest as Record<string, unknown>;

  const form = new FormData();
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined || value === null) continue;
    form.append(key, String(value));
  }
  if (cv) form.append("cv", cv);
  if (certificate) form.append("certificate", certificate);
  return form;
}

export function listPersonnel(id: UUID): Promise<Personnel[]> {
  return apiFetch<Personnel[]>(`/compliance-applications/${id}/personnel/`);
}

export function createPersonnel(id: UUID, input: PersonnelInput): Promise<Personnel> {
  return apiFetch<Personnel>(`/compliance-applications/${id}/personnel/`, {
    method: "POST",
    body: personnelBody(input),
  });
}

export function updatePersonnel(
  id: UUID,
  personnelId: UUID,
  patch: Partial<PersonnelInput>,
): Promise<Personnel> {
  return apiFetch<Personnel>(`/compliance-applications/${id}/personnel/${personnelId}/`, {
    method: "PATCH",
    body: personnelBody(patch),
  });
}

export function deletePersonnel(id: UUID, personnelId: UUID): Promise<void> {
  return apiFetch<void>(`/compliance-applications/${id}/personnel/${personnelId}/`, {
    method: "DELETE",
  });
}

// --- documents --------------------------------------------------------------

export function listDocuments(id: UUID): Promise<ComplianceDocument[]> {
  return apiFetch<ComplianceDocument[]>(`/compliance-applications/${id}/documents/`);
}

/**
 * Upload (or replace) one document. `title` is ignored for the fifteen required
 * types (the backend substitutes its own label) and the endpoint rejects a
 * `document_type` that is neither required nor already requested by a reviewer.
 * Re-uploading an existing type returns 200 and resets it to `submitted`.
 */
export function uploadDocument(
  id: UUID,
  input: { document_type: string; file: File; title?: string },
): Promise<ComplianceDocument> {
  const form = new FormData();
  form.append("document_type", input.document_type);
  form.append("title", input.title ?? input.document_type);
  form.append("file", input.file);
  return apiFetch<ComplianceDocument>(`/compliance-applications/${id}/documents/`, {
    method: "POST",
    body: form,
  });
}

/** The fifteen required types and where each one stands. */
export function listDocumentRequirements(id: UUID): Promise<DocumentRequirement[]> {
  return apiFetch<DocumentRequirement[]>(`/compliance-applications/${id}/document-requirements/`);
}

// --- submission -------------------------------------------------------------

/**
 * Submit for review. Rejects with 409 `application_incomplete` unless progress
 * is at 100%, which needs all seven sections, at least one person, and every
 * one of the fifteen required documents.
 */
export function submitApplication(id: UUID): Promise<ComplianceApplication> {
  return apiFetch<ComplianceApplication>(`/compliance-applications/${id}/submit/`, {
    method: "POST",
  });
}

// --- messages ---------------------------------------------------------------

/** Non-staff callers only ever see the non-internal thread. */
export function listMessages(id: UUID): Promise<ApplicationMessage[]> {
  return apiFetch<ApplicationMessage[]>(`/compliance-applications/${id}/messages/`);
}

export function postMessage(id: UUID, body: string): Promise<ApplicationMessage> {
  return apiFetch<ApplicationMessage>(`/compliance-applications/${id}/messages/`, {
    method: "POST",
    body: { body },
  });
}

export function markMessagesRead(id: UUID): Promise<{ marked_read: number }> {
  return apiFetch<{ marked_read: number }>(`/compliance-applications/${id}/messages/mark-read/`, {
    method: "POST",
  });
}

// --- activity ---------------------------------------------------------------

/**
 * What has happened to this application. Paginated, newest first, and readable
 * by any member: reviewer entries are attributed to the team rather than to a
 * named person, and carry none of the audit row's network detail.
 */
export function listActivity(id: UUID, page?: number): Promise<Paginated<ApplicationActivity>> {
  return apiFetch<Paginated<ApplicationActivity>>(`/compliance-applications/${id}/activity/`, {
    query: page ? { page } : {},
  });
}

// --- dashboard --------------------------------------------------------------

export function fetchDashboard(signal?: AbortSignal): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>("/dashboard/", { signal });
}
