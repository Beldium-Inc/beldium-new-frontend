import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useHasTokens } from "./queries";
import type { UUID } from "./types";
import {
  createApplication,
  createEquipment,
  createInventoryItem,
  createLicence,
  createMineSite,
  createProduction,
  fetchChecklist,
  fetchDashboard,
  fetchMe,
  getMineSite,
  listApplications,
  listDocuments,
  listEquipment,
  listExpiringLicences,
  listInfoRequests,
  listInventory,
  listLicences,
  listMineSites,
  listNonConformities,
  listProduction,
  respondToInfoRequest,
  submitCorrectiveEvidence,
  uploadDocument,
  type ApplicationInput,
  type EquipmentInput,
  type InventoryItemInput,
  type MineSiteInput,
  type ProductionRecordInput,
} from "./mining";

export const miningKeys = {
  dashboard: ["mining", "dashboard"] as const,
  me: ["mining", "me"] as const,
  checklist: ["mining", "checklist"] as const,
  sites: ["mining", "sites"] as const,
  equipment: ["mining", "equipment"] as const,
  production: ["mining", "production"] as const,
  inventory: ["mining", "inventory"] as const,
  documents: ["mining", "documents"] as const,
  licences: ["mining", "licences"] as const,
  expiringLicences: ["mining", "licences", "expiring"] as const,
  applications: ["mining", "applications"] as const,
  nonConformities: ["mining", "non-conformities"] as const,
  infoRequests: ["mining", "info-requests"] as const,
};

export function useMiningDashboard() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.dashboard,
    queryFn: ({ signal }) => fetchDashboard(signal),
    enabled: hasTokens,
  });
}

export function useMiningMe() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.me,
    queryFn: ({ signal }) => fetchMe(signal),
    enabled: hasTokens,
  });
}

export function useMiningChecklist() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.checklist,
    queryFn: ({ signal }) => fetchChecklist(signal),
    enabled: hasTokens,
  });
}

export function useMineSites() {
  const hasTokens = useHasTokens();
  return useQuery({ queryKey: miningKeys.sites, queryFn: listMineSites, enabled: hasTokens });
}

/** Site detail, including the ten review sections and the reviewer's verdict on each. */
export function useMineSite(id: UUID | null) {
  return useQuery({
    queryKey: [...miningKeys.sites, "detail", id ?? "none"],
    queryFn: () => getMineSite(id as UUID),
    enabled: Boolean(id),
  });
}

export function useCreateMineSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MineSiteInput) => createMineSite(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: miningKeys.sites }),
  });
}

export function useEquipment() {
  const hasTokens = useHasTokens();
  return useQuery({ queryKey: miningKeys.equipment, queryFn: listEquipment, enabled: hasTokens });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EquipmentInput) => createEquipment(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: miningKeys.equipment }),
  });
}

export function useProduction() {
  const hasTokens = useHasTokens();
  return useQuery({ queryKey: miningKeys.production, queryFn: listProduction, enabled: hasTokens });
}

export function useCreateProduction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductionRecordInput) => createProduction(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: miningKeys.production }),
  });
}

export function useInventory() {
  const hasTokens = useHasTokens();
  return useQuery({ queryKey: miningKeys.inventory, queryFn: listInventory, enabled: hasTokens });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InventoryItemInput) => createInventoryItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: miningKeys.inventory }),
  });
}

export function useMiningDocuments() {
  const hasTokens = useHasTokens();
  return useQuery({ queryKey: miningKeys.documents, queryFn: listDocuments, enabled: hasTokens });
}

export function useUploadMiningDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: miningKeys.documents }),
  });
}

export function useLicences() {
  const hasTokens = useHasTokens();
  return useQuery({ queryKey: miningKeys.licences, queryFn: listLicences, enabled: hasTokens });
}

export function useExpiringLicences() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.expiringLicences,
    queryFn: listExpiringLicences,
    enabled: hasTokens,
  });
}

export function useCreateLicence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLicence,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: miningKeys.licences });
      void queryClient.invalidateQueries({ queryKey: miningKeys.expiringLicences });
    },
  });
}

export function useMiningApplications() {
  const hasTokens = useHasTokens();
  return useQuery({ queryKey: miningKeys.applications, queryFn: listApplications, enabled: hasTokens });
}

export function useCreateMiningApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ApplicationInput) => createApplication(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: miningKeys.applications }),
  });
}

export function useNonConformities() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: miningKeys.nonConformities,
    queryFn: listNonConformities,
    enabled: hasTokens,
  });
}

export function useSubmitCorrectiveEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { nonConformityId: UUID; message: string; file?: File }) =>
      submitCorrectiveEvidence(input.nonConformityId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: miningKeys.nonConformities }),
  });
}

export function useInfoRequests() {
  const hasTokens = useHasTokens();
  return useQuery({ queryKey: miningKeys.infoRequests, queryFn: listInfoRequests, enabled: hasTokens });
}

export function useRespondToInfoRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: UUID; message: string }) => respondToInfoRequest(input.id, input.message),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: miningKeys.infoRequests }),
  });
}
