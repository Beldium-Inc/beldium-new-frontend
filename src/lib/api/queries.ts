import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
import {
  createComplianceApplication,
  createPersonnel,
  deletePersonnel,
  fetchDashboard,
  getComplianceApplication,
  listComplianceApplications,
  listDocumentRequirements,
  listActivity,
  listDocuments,
  listMessages,
  listPersonnel,
  markMessagesRead,
  postMessage,
  saveSection,
  submitApplication,
  updatePersonnel,
  uploadDocument,
  type PersonnelInput,
  type SectionData,
  type SectionSlug,
} from "./compliance";
import { readTokens, subscribeTokens, bindCrossTabSync } from "./tokens";
import type { MembershipRole, UUID } from "./types";
import { useSyncExternalStore } from "react";

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
  applications: ["compliance", "list"] as const,
  application: (id: UUID) => ["compliance", "detail", id] as const,
  personnel: (id: UUID) => ["compliance", id, "personnel"] as const,
  documents: (id: UUID) => ["compliance", id, "documents"] as const,
  documentRequirements: (id: UUID) => ["compliance", id, "document-requirements"] as const,
  messages: (id: UUID) => ["compliance", id, "messages"] as const,
  dashboard: ["compliance", "dashboard"] as const,
  activity: (id: UUID) => ["compliance", id, "activity"] as const,
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
    // The register changes rarely; don't refetch it on every keystroke-driven remount.
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

// ---------------------------------------------------------------------------
// Compliance
//
// Every write returns the whole application, so mutations seed the detail cache
// from the response rather than invalidating and refetching. Section saves also
// touch the dashboard (progress) and, for the organisation section, the
// organisation record itself, so those are invalidated.
// ---------------------------------------------------------------------------

export function useComplianceApplications(options: { enabled?: boolean } = {}) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: queryKeys.applications,
    queryFn: () => listComplianceApplications(),
    enabled: (options.enabled ?? true) && hasTokens,
  });
}

export function useComplianceApplication(id: UUID | null) {
  return useQuery({
    queryKey: queryKeys.application(id ?? "none"),
    queryFn: () => getComplianceApplication(id as UUID),
    enabled: Boolean(id),
  });
}

export function useCreateComplianceApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (organisation: UUID) => createComplianceApplication(organisation),
    onSuccess: (application) => {
      queryClient.setQueryData(queryKeys.application(application.id), application);
      void queryClient.invalidateQueries({ queryKey: queryKeys.applications });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/**
 * One hook for all seven sections: the slug picks the endpoint and, through
 * `SectionData`, the payload type the caller must supply.
 */
export function useSaveSection<S extends SectionSlug>(id: UUID | null, section: S) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SectionData[S]) => saveSection(id as UUID, section, data),
    onSuccess: (application) => {
      queryClient.setQueryData(queryKeys.application(application.id), application);
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      // The organisation section writes through to the Organisation record.
      if (section === "organisation") {
        void queryClient.invalidateQueries({ queryKey: ["organisations"] });
      }
    },
  });
}

export function useApplicationPersonnel(id: UUID | null) {
  return useQuery({
    queryKey: queryKeys.personnel(id ?? "none"),
    queryFn: () => listPersonnel(id as UUID),
    enabled: Boolean(id),
  });
}

export function useCreatePersonnel(id: UUID | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PersonnelInput) => createPersonnel(id as UUID, input),
    onSuccess: () => invalidateApplication(queryClient, id),
  });
}

export function useUpdatePersonnel(id: UUID | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { personnelId: UUID; patch: Partial<PersonnelInput> }) =>
      updatePersonnel(id as UUID, input.personnelId, input.patch),
    onSuccess: () => invalidateApplication(queryClient, id),
  });
}

export function useDeletePersonnel(id: UUID | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (personnelId: UUID) => deletePersonnel(id as UUID, personnelId),
    onSuccess: () => invalidateApplication(queryClient, id),
  });
}

export function useApplicationDocuments(id: UUID | null) {
  return useQuery({
    queryKey: queryKeys.documents(id ?? "none"),
    queryFn: () => listDocuments(id as UUID),
    enabled: Boolean(id),
  });
}

export function useDocumentRequirements(id: UUID | null) {
  return useQuery({
    queryKey: queryKeys.documentRequirements(id ?? "none"),
    queryFn: () => listDocumentRequirements(id as UUID),
    enabled: Boolean(id),
  });
}

export function useUploadDocument(id: UUID | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { document_type: string; file: File; title?: string }) =>
      uploadDocument(id as UUID, input),
    onSuccess: () => {
      invalidateApplication(queryClient, id);
      if (id) void queryClient.invalidateQueries({ queryKey: queryKeys.documentRequirements(id) });
    },
  });
}

export function useSubmitApplication(id: UUID | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => submitApplication(id as UUID),
    onSuccess: (application) => {
      queryClient.setQueryData(queryKeys.application(application.id), application);
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: ["organisations"] });
    },
  });
}

export function useApplicationMessages(id: UUID | null) {
  return useQuery({
    queryKey: queryKeys.messages(id ?? "none"),
    queryFn: () => listMessages(id as UUID),
    enabled: Boolean(id),
  });
}

export function usePostMessage(id: UUID | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => postMessage(id as UUID, body),
    onSuccess: () => {
      if (id) void queryClient.invalidateQueries({ queryKey: queryKeys.messages(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useMarkMessagesRead(id: UUID | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markMessagesRead(id as UUID),
    onSuccess: () => {
      if (id) void queryClient.invalidateQueries({ queryKey: queryKeys.messages(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDashboard(options: { enabled?: boolean } = {}) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => fetchDashboard(signal),
    enabled: (options.enabled ?? true) && hasTokens,
  });
}

/** Personnel and document writes change `progress`, so the parent is stale too. */
function invalidateApplication(
  queryClient: ReturnType<typeof useQueryClient>,
  id: UUID | null,
): void {
  if (!id) return;
  void queryClient.invalidateQueries({ queryKey: queryKeys.application(id) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.personnel(id) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.documents(id) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.activity(id) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
}

export function useApplicationActivity(id: UUID | null) {
  return useQuery({
    queryKey: queryKeys.activity(id ?? "none"),
    queryFn: () => listActivity(id as UUID),
    enabled: Boolean(id),
  });
}
