import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import { fetchCurrentUser, updateCurrentUser, type CurrentUserPatch } from "./auth";
import {
  acceptInvitation,
  activateMember,
  cancelJoinRequest,
  createInvitation,
  createJoinRequest,
  createOrganisation,
  decideJoinRequest,
  decideOrganisation,
  getJoinCode,
  getOrganisation,
  getOrganisationTimeline,
  listInvitations,
  listMembers,
  listMyJoinRequests,
  listOrganisationJoinRequests,
  listOrganisations,
  organisationDirectory,
  removeMember,
  revokeInvitation,
  rotateJoinCode,
  submitOrganisation,
  suspendMember,
  updateMember,
  updateOrganisation,
  type JoinRequestInput,
  type OrganisationInput,
  type OrganisationQuery,
} from "./organisations";
import { listMineSites } from "./mining";
import { readTokens, subscribeTokens, bindCrossTabSync } from "./tokens";
import type { MembershipRole, UUID } from "./types";

/**
 * Cache keys. Everything under "auth" is dropped on sign-out; organisation
 * lists are keyed by their query so filters don't collide.
 */
export const queryKeys = {
  currentUser: ["auth", "me"] as const,
  organisations: (query: OrganisationQuery = {}) => ["organisations", "list", query] as const,
  directory: (query: OrganisationQuery = {}) => ["organisations", "directory", query] as const,
  organisation: (id: UUID) => ["organisations", "detail", id] as const,
  timeline: (id: UUID) => ["organisations", id, "timeline"] as const,
  members: (id: UUID) => ["organisations", id, "members"] as const,
  invitations: (id: UUID) => ["organisations", id, "invitations"] as const,
  organisationJoinRequests: (id: UUID) => ["organisations", id, "join-requests"] as const,
  myJoinRequests: ["join-requests", "mine"] as const,
  joinCode: (id: UUID) => ["organisations", id, "join-code"] as const,
};

/**
 * Whether a token pair is present, tracked across tabs. Returns false during
 * SSR and the hydration pass, then settles once localStorage is readable.
 */
export function useHasTokens(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      bindCrossTabSync();
      return subscribeTokens(onChange);
    },
    () => readTokens() !== null,
    () => false,
  );
}

export function useCurrentUser(options: { enabled?: boolean } = {}) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    enabled: (options.enabled ?? true) && hasTokens,
    staleTime: 60_000,
    retry: false,
  });
}

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: CurrentUserPatch) => updateCurrentUser(patch),
    onSuccess: (user) => queryClient.setQueryData(queryKeys.currentUser, user),
  });
}

export function useMyOrganisations(query: OrganisationQuery = {}) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: queryKeys.organisations(query),
    queryFn: () => listOrganisations(query),
    enabled: hasTokens,
  });
}

/**
 * Whether the compliance desk has verified at least one of the caller's mine
 * sites. Together with the organisation's own verification this decides how
 * much of the workspace is open: organisation first, then the full dashboard.
 */
export function useSiteVerified(options: { enabled?: boolean } = {}) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: ["mining", "my-site-verified"] as const,
    queryFn: async () => {
      const page = await listMineSites();
      const sites = Array.isArray(page) ? page : page.results;
      return sites.some((s) => s.status === "operational");
    },
    enabled: hasTokens && (options.enabled ?? true),
    refetchInterval: 30_000,
  });
}

export function useOrganisationTimeline(id: UUID | undefined) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: queryKeys.timeline(id ?? ""),
    queryFn: () => getOrganisationTimeline(id as UUID),
    enabled: hasTokens && Boolean(id),
    refetchInterval: 30_000,
  });
}

export function useOrganisationDirectory(
  query: OrganisationQuery = {},
  options: { enabled?: boolean } = {},
) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: queryKeys.directory(query),
    queryFn: () => organisationDirectory(query),
    enabled: (options.enabled ?? true) && hasTokens,
    staleTime: 30_000,
  });
}

export function useOrganisation(id: UUID | null) {
  return useQuery({
    queryKey: queryKeys.organisation(id ?? "none"),
    queryFn: () => getOrganisation(id as UUID),
    enabled: Boolean(id),
  });
}

export function useOrganisationMembers(id: UUID | null) {
  return useQuery({
    queryKey: queryKeys.members(id ?? "none"),
    queryFn: () => listMembers(id as UUID),
    enabled: Boolean(id),
  });
}

export function useOrganisationInvitations(id: UUID | null) {
  return useQuery({
    queryKey: queryKeys.invitations(id ?? "none"),
    queryFn: () => listInvitations(id as UUID),
    enabled: Boolean(id),
  });
}

export function useOrganisationJoinRequests(id: UUID | null) {
  return useQuery({
    queryKey: queryKeys.organisationJoinRequests(id ?? "none"),
    queryFn: () => listOrganisationJoinRequests(id as UUID),
    enabled: Boolean(id),
  });
}

export function useMyJoinRequests(options: { enabled?: boolean } = {}) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: queryKeys.myJoinRequests,
    queryFn: () => listMyJoinRequests(),
    enabled: (options.enabled ?? true) && hasTokens,
  });
}

export function useCreateOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OrganisationInput) => createOrganisation(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organisations"] }),
  });
}

export function useUpdateOrganisation(id: UUID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<OrganisationInput>) => updateOrganisation(id, patch),
    onSuccess: (organisation) => {
      queryClient.setQueryData(queryKeys.organisation(id), organisation);
      void queryClient.invalidateQueries({ queryKey: ["organisations"] });
    },
  });
}

export function useSubmitOrganisation(id: UUID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => submitOrganisation(id),
    onSuccess: (organisation) => {
      queryClient.setQueryData(queryKeys.organisation(id), organisation);
      void queryClient.invalidateQueries({ queryKey: ["organisations"] });
    },
  });
}

export function useDecideOrganisation(id: UUID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { decision: "verified" | "rejected"; reason?: string }) =>
      decideOrganisation(id, input),
    onSuccess: (organisation) => {
      queryClient.setQueryData(queryKeys.organisation(id), organisation);
      void queryClient.invalidateQueries({ queryKey: ["organisations"] });
    },
  });
}

export function useCreateInvitation(id: UUID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role?: MembershipRole; expires_at: string }) =>
      createInvitation(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invitations(id) }),
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => acceptInvitation(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organisations"] }),
  });
}

export function useCreateJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: JoinRequestInput) => createJoinRequest(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myJoinRequests });
      void queryClient.invalidateQueries({ queryKey: ["miner-setup"] });
    },
  });
}

export function useCancelJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => cancelJoinRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myJoinRequests });
      void queryClient.invalidateQueries({ queryKey: ["miner-setup"] });
    },
  });
}

/** Administrators only. */
export function useJoinCode(id: UUID | null) {
  return useQuery({
    queryKey: queryKeys.joinCode(id ?? "none"),
    queryFn: () => getJoinCode(id as UUID),
    enabled: Boolean(id),
  });
}

export function useRotateJoinCode(id: UUID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => rotateJoinCode(id),
    onSuccess: (data) => queryClient.setQueryData(queryKeys.joinCode(id), data),
  });
}

function useMemberMutation<TArgs>(id: UUID, fn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members(id) }),
  });
}

export function useUpdateMember(id: UUID) {
  return useMemberMutation(id, (input: { membershipId: UUID; role?: MembershipRole; title?: string }) => {
    const { membershipId, ...patch } = input;
    return updateMember(id, membershipId, patch);
  });
}

export function useSuspendMember(id: UUID) {
  return useMemberMutation(id, (membershipId: UUID) => suspendMember(id, membershipId));
}

export function useActivateMember(id: UUID) {
  return useMemberMutation(id, (membershipId: UUID) => activateMember(id, membershipId));
}

export function useRemoveMember(id: UUID) {
  return useMemberMutation(id, (membershipId: UUID) => removeMember(id, membershipId));
}

export function useRevokeInvitation(id: UUID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: UUID) => revokeInvitation(id, invitationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invitations(id) }),
  });
}

export function useDecideJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; decision: "approved" | "rejected"; notes?: string }) =>
      decideJoinRequest(input.id, {
        decision: input.decision,
        ...(input.notes ? { notes: input.notes } : {}),
      }),
    onSuccess: () => {
      // Covers the organisation's request list and its member list.
      void queryClient.invalidateQueries({ queryKey: ["organisations"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myJoinRequests });
    },
  });
}
