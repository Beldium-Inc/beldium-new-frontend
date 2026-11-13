import { apiFetch } from "./client";
import type {
  JoinRequest,
  MembershipRole,
  Organisation,
  OrganisationInvitation,
  OrganisationMembership,
  OrganisationType,
  Paginated,
  UUID,
  VerificationStatus,
} from "./types";

export interface OrganisationQuery {
  search?: string | undefined;
  organisation_type?: OrganisationType | undefined;
  verification_status?: VerificationStatus | undefined;
  country?: string | undefined;
  state?: string | undefined;
  ordering?: string | undefined;
  page?: number | undefined;
  page_size?: number | undefined;
}

export interface OrganisationInput {
  name: string;
  organisation_type: OrganisationType;
  registration_number?: string;
  tax_identifier?: string;
  email?: string;
  phone_number?: string;
  website?: string;
  address?: string;
  country?: string;
  state?: string;
}

/** Organisations the signed-in user belongs to. */
export function listOrganisations(query: OrganisationQuery = {}): Promise<Paginated<Organisation>> {
  return apiFetch<Paginated<Organisation>>("/organisations/", { query: { ...query } });
}

/** Every verified organisation, whether or not the user belongs to it. */
export function organisationDirectory(
  query: OrganisationQuery = {},
): Promise<Paginated<Organisation>> {
  return apiFetch<Paginated<Organisation>>("/organisations/directory/", { query: { ...query } });
}

export function getOrganisation(id: UUID): Promise<Organisation> {
  return apiFetch<Organisation>(`/organisations/${id}/`);
}

/** Creates the organisation and makes the caller its owner. */
export function createOrganisation(input: OrganisationInput): Promise<Organisation> {
  return apiFetch<Organisation>("/organisations/", { method: "POST", body: input });
}

export function updateOrganisation(
  id: UUID,
  patch: Partial<OrganisationInput>,
): Promise<Organisation> {
  return apiFetch<Organisation>(`/organisations/${id}/`, { method: "PATCH", body: patch });
}

/** Moves a draft (or rejected) organisation to under_review. Requires an org admin role. */
export function submitOrganisation(id: UUID): Promise<Organisation> {
  return apiFetch<Organisation>(`/organisations/${id}/submit/`, { method: "POST" });
}

/** Approves or rejects an organisation under review. Restricted to Django staff/admin accounts. */
export function decideOrganisation(
  id: UUID,
  input: { decision: "verified" | "rejected"; reason?: string },
): Promise<Organisation> {
  return apiFetch<Organisation>(`/organisations/${id}/decide/`, { method: "POST", body: input });
}

export function deleteOrganisation(id: UUID): Promise<void> {
  return apiFetch<void>(`/organisations/${id}/`, { method: "DELETE" });
}

export function listMembers(id: UUID): Promise<OrganisationMembership[]> {
  return apiFetch<OrganisationMembership[]>(`/organisations/${id}/members/`);
}

/** Administrators only. */
export function listInvitations(id: UUID): Promise<OrganisationInvitation[]> {
  return apiFetch<OrganisationInvitation[]>(`/organisations/${id}/invitations/`);
}

/** Administrators only. `expires_at` must be in the future. */
export function createInvitation(
  id: UUID,
  input: { email: string; role?: MembershipRole; expires_at: string },
): Promise<OrganisationInvitation> {
  return apiFetch<OrganisationInvitation>(`/organisations/${id}/invitations/`, {
    method: "POST",
    body: input,
  });
}

/** Administrators only: every request to join this organisation. */
export function listOrganisationJoinRequests(id: UUID): Promise<JoinRequest[]> {
  return apiFetch<JoinRequest[]>(`/organisations/${id}/join-requests/`);
}

/** Redeem an invitation token. The invitation must match the caller's email. */
export function acceptInvitation(
  token: string,
): Promise<{ organisation_id: UUID; role: MembershipRole }> {
  return apiFetch<{ organisation_id: UUID; role: MembershipRole }>("/invitations/accept/", {
    method: "POST",
    body: { token },
  });
}

/** The caller's own join requests. */
export function listMyJoinRequests(query: { page?: number } = {}): Promise<Paginated<JoinRequest>> {
  return apiFetch<Paginated<JoinRequest>>("/join-requests/", { query: { ...query } });
}

/** The sector the Miner Hub signs people up in. A code from another sector's company is refused. */
export const MINER_SECTOR = "mining";

export interface JoinRequestInput {
  /** The code or link an organisation administrator shared. */
  join_code: string;
  requested_role?: MembershipRole;
  justification?: string;
  sector?: string;
}

export function createJoinRequest(input: JoinRequestInput): Promise<JoinRequest> {
  return apiFetch<JoinRequest>("/join-requests/", {
    method: "POST",
    body: { sector: MINER_SECTOR, ...input },
  });
}

/** The requester withdraws a request that is still pending. */
export function cancelJoinRequest(id: UUID): Promise<JoinRequest> {
  return apiFetch<JoinRequest>(`/join-requests/${id}/cancel/`, { method: "POST" });
}

export interface JoinCodeLookup {
  organisation: UUID;
  organisation_name: string;
  organisation_type: OrganisationType;
  already_member: boolean;
  pending_request: boolean;
}

/**
 * Name the organisation behind a join code before asking to join it. Open
 * before sign in. A code from a non-mining company answers 409.
 */
export function lookupJoinCode(joinCode: string): Promise<JoinCodeLookup> {
  return apiFetch<JoinCodeLookup>("/join-requests/lookup/", {
    method: "POST",
    body: { join_code: joinCode, sector: MINER_SECTOR },
  });
}

export interface OrganisationJoinCode {
  join_code: string;
  join_url: string;
}

/** Administrators only: the code colleagues use to ask to join. */
export function getJoinCode(id: UUID): Promise<OrganisationJoinCode> {
  return apiFetch<OrganisationJoinCode>(`/organisations/${id}/join-code/`);
}

/** Administrators only. The old code and every link built from it stop working. */
export function rotateJoinCode(id: UUID): Promise<OrganisationJoinCode> {
  return apiFetch<OrganisationJoinCode>(`/organisations/${id}/join-code/rotate/`, {
    method: "POST",
  });
}

// --- member management (administrators only; the owner cannot be changed) ---

export function updateMember(
  id: UUID,
  membershipId: UUID,
  patch: { role?: MembershipRole; title?: string },
): Promise<OrganisationMembership> {
  return apiFetch<OrganisationMembership>(`/organisations/${id}/members/${membershipId}/`, {
    method: "PATCH",
    body: patch,
  });
}

export function suspendMember(id: UUID, membershipId: UUID): Promise<OrganisationMembership> {
  return apiFetch<OrganisationMembership>(`/organisations/${id}/members/${membershipId}/suspend/`, {
    method: "POST",
  });
}

export function activateMember(id: UUID, membershipId: UUID): Promise<OrganisationMembership> {
  return apiFetch<OrganisationMembership>(`/organisations/${id}/members/${membershipId}/activate/`, {
    method: "POST",
  });
}

export function removeMember(id: UUID, membershipId: UUID): Promise<void> {
  return apiFetch<void>(`/organisations/${id}/members/${membershipId}/remove/`, {
    method: "DELETE",
  });
}

export function revokeInvitation(id: UUID, invitationId: UUID): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/organisations/${id}/invitations/${invitationId}/revoke/`, {
    method: "POST",
  });
}

/** Administrators of the target organisation only. */
export function decideJoinRequest(
  id: UUID,
  input: { decision: "approved" | "rejected"; notes?: string },
): Promise<JoinRequest> {
  return apiFetch<JoinRequest>(`/join-requests/${id}/decide/`, { method: "POST", body: input });
}

export type TimelineStageState = "complete" | "current" | "attention" | "failed" | "upcoming";

export interface TimelineStage {
  key: string;
  title: string;
  description: string;
  state: TimelineStageState;
  at: string | null;
  detail: string;
}

export interface TimelineActivity {
  id: string;
  event_type: string;
  message: string;
  actor: string;
  at: string;
}

export interface OrganisationTimeline {
  status: VerificationStatus;
  application_status: string | null;
  application_reference: string | null;
  documents: { total: number; verified: number; awaiting: number; attention: number };
  sites: { verified: number; total: number };
  stages: TimelineStage[];
  activity: TimelineActivity[];
}

/** Verification stages and a member-safe activity feed. Readable by any active member. */
export function getOrganisationTimeline(id: UUID): Promise<OrganisationTimeline> {
  return apiFetch<OrganisationTimeline>(`/organisations/${id}/timeline/`);
}
