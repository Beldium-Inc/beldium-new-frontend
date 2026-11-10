// Onboarding and roles endpoints (backend tasks BE-O1 to BE-O6).
//
// The options list itself is fetched in src/lib/onboarding/options.ts.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { OrganisationType, Paginated, Timestamp, UUID } from "./types";
import type { VerticalSlug } from "../verticals";

// me/ (BE-O6)

export type MembershipStatus = "active" | "suspended" | "pending" | "none";
export type DashboardType = "applicant" | "partner" | "regulator" | "operator";

/** One key per row of the backend plan's section 2 rights table. */
export type Right =
  | "dashboard.view"
  | "dashboard.read_only"
  | "drafts.edit"
  | "documents.upload"
  | "nonconformity.submit_evidence"
  | "application.submit"
  | "declaration.sign"
  | "profile.edit"
  | "team.view"
  | "team.view_names"
  | "team.manage"
  | "join_code.manage"
  | "finance.view"
  | "reminders.email"
  | "reminders.assigned_only";

export interface OnboardingMe {
  sector: VerticalSlug;
  user: { id: UUID; email: string; first_name: string; last_name: string; full_name: string };
  /** Only id and name while the membership is pending or suspended. */
  organisation: {
    id: UUID;
    name: string;
    beldium_id?: string;
    organisation_type?: OrganisationType;
    participant_subtype?: ParticipantSubtype | "";
    verification_status?: string;
  } | null;
  membership_id: UUID | null;
  membership_role: string | null;
  membership_status: MembershipStatus;
  dashboard: DashboardType | null;
  rights: Right[];
  admin_name: string;
  granted_sectors: VerticalSlug[];
  pending_join_request: {
    id: UUID;
    organisation_name: string;
    requested_role: string;
    created_at: Timestamp;
  } | null;
  regulator_request: {
    id: UUID;
    status: RegulatorRequestStatus;
    agency_name: string;
    requested_sectors: VerticalSlug[];
    approved_sectors: VerticalSlug[];
    rejection_reason: string;
  } | null;
}

export function fetchOnboardingMe(sector: VerticalSlug): Promise<OnboardingMe> {
  return apiFetch<OnboardingMe>("/onboarding/me/", { query: { sector } });
}

export function useOnboardingMe(sector: VerticalSlug | null, enabled = true) {
  return useQuery({
    queryKey: ["onboarding", "me", sector],
    queryFn: () => fetchOnboardingMe(sector as VerticalSlug),
    enabled: enabled && Boolean(sector),
    staleTime: 30_000,
  });
}

export function hasRight(me: OnboardingMe | undefined, right: Right): boolean {
  return Boolean(me?.rights.includes(right));
}

// Participant application (BE-O3)

export type ParticipantSector = "processing" | "warehousing" | "export" | "marketplace";
export type ParticipantSubtype = "buyer" | "offtaker" | "oem";
export type ParticipantSection =
  "company" | "operations" | "sites" | "representative" | "declarations";
export type Answer = string | number | boolean | string[] | null;

export interface ParticipantApplication {
  id: UUID;
  sector: ParticipantSector;
  status: "draft" | "submitted";
  participant_subtype: ParticipantSubtype | "";
  organisation: {
    id: UUID;
    beldium_id: string;
    name: string;
    organisation_type: OrganisationType;
    participant_subtype: ParticipantSubtype | "";
    verification_status: string;
  };
  company: Record<string, Answer>;
  operations: Record<string, Answer>;
  sites: Record<string, string>[];
  representative: Record<string, Answer>;
  declarations: Record<string, boolean>;
  documents: {
    id: UUID;
    title: string;
    file_name: string;
    created_at: Timestamp;
    updated_at: Timestamp;
  }[];
  my_role: string | null;
  can_submit: boolean;
  /** What still blocks submit, as "company.tin", "documents.<title>", "sites"... */
  missing: string[];
  submitted_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface RegisterParticipantInput {
  sector: ParticipantSector;
  name: string;
  registration_number?: string;
  participant_subtype?: ParticipantSubtype;
}

export function listParticipantApplications(): Promise<Paginated<ParticipantApplication>> {
  return apiFetch<Paginated<ParticipantApplication>>("/onboarding/participants/");
}

export function registerParticipant(
  input: RegisterParticipantInput,
): Promise<ParticipantApplication> {
  return apiFetch<ParticipantApplication>("/onboarding/participants/", {
    method: "POST",
    body: input,
  });
}

export function saveParticipantSection(
  id: UUID,
  section: ParticipantSection,
  data: Record<string, Answer> | Record<string, string>[],
): Promise<ParticipantApplication> {
  return apiFetch<ParticipantApplication>(`/onboarding/participants/${id}/sections/${section}/`, {
    method: "PUT",
    body: data,
  });
}

export function uploadParticipantDocument(
  id: UUID,
  title: string,
  file: File,
): Promise<ParticipantApplication> {
  const form = new FormData();
  form.append("title", title);
  form.append("file", file);
  return apiFetch<ParticipantApplication>(`/onboarding/participants/${id}/documents/`, {
    method: "POST",
    body: form,
  });
}

export function submitParticipantApplication(id: UUID): Promise<ParticipantApplication> {
  return apiFetch<ParticipantApplication>(`/onboarding/participants/${id}/submit/`, {
    method: "POST",
  });
}

export function useParticipantApplications(enabled = true) {
  return useQuery({
    queryKey: ["onboarding", "participants"],
    queryFn: listParticipantApplications,
    enabled,
  });
}

// Regulator access request (BE-O5)

export type RegulatorRequestStatus = "pending" | "approved" | "rejected";

export interface RegulatorAccessRequest {
  id: UUID;
  agency_name: string;
  institution_type: string;
  official_email: string;
  office: string;
  state: string;
  requester_title: string;
  requested_sectors: VerticalSlug[];
  has_authority_letter: boolean;
  authority_letter_name: string;
  mandate: string;
  status: RegulatorRequestStatus;
  approved_sectors: VerticalSlug[];
  rejection_reason: string;
  decided_at: Timestamp | null;
  organisation: UUID | null;
  requester_email: string;
  requester_name: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface RegulatorAccessRequestInput {
  agency_name: string;
  institution_type?: string;
  official_email: string;
  office: string;
  state: string;
  requester_title?: string;
  requested_sectors: VerticalSlug[];
  mandate?: string;
  authority_letter?: File | null;
}

export function createRegulatorRequest(
  input: RegulatorAccessRequestInput,
): Promise<RegulatorAccessRequest> {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || key === "authority_letter") continue;
    form.append(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  if (input.authority_letter) form.append("authority_letter", input.authority_letter);
  return apiFetch<RegulatorAccessRequest>("/onboarding/regulator-requests/", {
    method: "POST",
    body: form,
  });
}

export function listMyRegulatorRequests(): Promise<RegulatorAccessRequest[]> {
  return apiFetch<RegulatorAccessRequest[]>("/onboarding/regulator-requests/mine/");
}

/** Beldium operators only. */
export function listRegulatorRequests(
  status?: RegulatorRequestStatus,
): Promise<Paginated<RegulatorAccessRequest>> {
  return apiFetch<Paginated<RegulatorAccessRequest>>("/onboarding/regulator-requests/", {
    query: { status },
  });
}

export function approveRegulatorRequest(
  id: UUID,
  sectors: VerticalSlug[],
): Promise<RegulatorAccessRequest> {
  return apiFetch<RegulatorAccessRequest>(`/onboarding/regulator-requests/${id}/approve/`, {
    method: "POST",
    body: { sectors },
  });
}

export function rejectRegulatorRequest(id: UUID, reason: string): Promise<RegulatorAccessRequest> {
  return apiFetch<RegulatorAccessRequest>(`/onboarding/regulator-requests/${id}/reject/`, {
    method: "POST",
    body: { reason },
  });
}

export function useMyRegulatorRequests(enabled = true) {
  return useQuery({
    queryKey: ["onboarding", "regulator-requests", "mine"],
    queryFn: listMyRegulatorRequests,
    enabled,
  });
}

export function useRegulatorRequests(status?: RegulatorRequestStatus) {
  return useQuery({
    queryKey: ["onboarding", "regulator-requests", "all", status ?? "any"],
    queryFn: () => listRegulatorRequests(status),
  });
}

export function useDecideRegulatorRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      input:
        | { id: UUID; decision: "approve"; sectors: VerticalSlug[] }
        | { id: UUID; decision: "reject"; reason: string },
    ) =>
      input.decision === "approve"
        ? approveRegulatorRequest(input.id, input.sectors)
        : rejectRegulatorRequest(input.id, input.reason),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["onboarding", "regulator-requests"] }),
  });
}

/**
 * Beldium operators verify or reject a participant company once its
 * application is submitted (the existing POST /organisations/{id}/decide/).
 */
export function decideParticipantOrganisation(
  organisationId: UUID,
  decision: "verified" | "rejected",
  reason = "",
): Promise<unknown> {
  return apiFetch(`/organisations/${organisationId}/decide/`, {
    method: "POST",
    body: { decision, reason },
  });
}

export function useDecideParticipantOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      organisationId: UUID;
      decision: "verified" | "rejected";
      reason?: string;
    }) => decideParticipantOrganisation(input.organisationId, input.decision, input.reason ?? ""),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["onboarding", "participants"] }),
  });
}
