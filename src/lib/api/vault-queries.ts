import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addVaultVersion,
  approveVaultDocument,
  fetchVaultSectors,
  getVaultDocument,
  listVaultDocuments,
  uploadVaultDocument,
  verifyVaultDocument,
  type VaultListQuery,
  type VaultUploadInput,
} from "./vault";
import { useHasTokens } from "./queries";
import type { UUID } from "./types";

export const vaultKeys = {
  root: ["vault"] as const,
  sectors: ["vault", "sectors"] as const,
  documents: (query: VaultListQuery) => ["vault", "documents", query] as const,
  document: (id: UUID) => ["vault", "document", id] as const,
};

export function useVaultSectors() {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: vaultKeys.sectors,
    queryFn: ({ signal }) => fetchVaultSectors(signal),
    enabled: hasTokens,
    staleTime: 30_000,
  });
}

export function useVaultDocuments(query: VaultListQuery) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: vaultKeys.documents(query),
    queryFn: () => listVaultDocuments(query),
    enabled: hasTokens,
    staleTime: 15_000,
  });
}

export function useVaultDocument(id: UUID | null) {
  return useQuery({
    queryKey: vaultKeys.document(id ?? "none"),
    queryFn: () => getVaultDocument(id as UUID),
    enabled: Boolean(id),
  });
}

function useVaultMutation<TInput, TOutput>(fn: (input: TInput) => Promise<TOutput>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vaultKeys.root });
    },
  });
}

export function useUploadVaultDocument() {
  return useVaultMutation((input: VaultUploadInput) => uploadVaultDocument(input));
}

export function useAddVaultVersion() {
  return useVaultMutation((input: { id: UUID; file: File; note: string }) =>
    addVaultVersion(input.id, input.file, input.note),
  );
}

export function useApproveVaultDocument() {
  return useVaultMutation((input: { id: UUID; note: string }) =>
    approveVaultDocument(input.id, input.note),
  );
}

export function useVerifyVaultDocument() {
  return useVaultMutation((id: UUID) => verifyVaultDocument(id));
}
