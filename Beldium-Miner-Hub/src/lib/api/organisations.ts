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

export function createJoinRequest(input: {
  organisation: UUID;
  requested_role?: MembershipRole;
  justification?: string;
}): Promise<JoinRequest> {
  return apiFetch<JoinRequest>("/join-requests/", { method: "POST", body: input });
}

/** Administrators of the target organisation only. */
export function decideJoinRequest(
  id: UUID,
  input: { decision: "approved" | "rejected"; notes?: string },
): Promise<JoinRequest> {
  return apiFetch<JoinRequest>(`/join-requests/${id}/decide/`, { method: "POST", body: input });
}
