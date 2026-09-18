import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import { fetchCurrentUser, updateCurrentUser, type CurrentUserPatch } from "./auth";
import {
  acceptInvitation,
  createInvitation,
  createJoinRequest,
  createOrganisation,
  decideJoinRequest,
  getOrganisation,
  listInvitations,
  listMembers,
  listMyJoinRequests,
  listOrganisationJoinRequests,
  listOrganisations,
  organisationDirectory,
  updateOrganisation,
  type OrganisationInput,
  type OrganisationQuery,
} from "./organisations";
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
  members: (id: UUID) => ["organisations", id, "members"] as const,
  invitations: (id: UUID) => ["organisations", id, "invitations"] as const,
  organisationJoinRequests: (id: UUID) => ["organisations", id, "join-requests"] as const,
  myJoinRequests: ["join-requests", "mine"] as const,
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
    mutationFn: (input: {
      organisation: UUID;
      requested_role?: MembershipRole;
      justification?: string;
    }) => createJoinRequest(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.myJoinRequests }),
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
      void queryClient.invalidateQueries({ queryKey: ["organisations"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myJoinRequests });
    },
  });
}
