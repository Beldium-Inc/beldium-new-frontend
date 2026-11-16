import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  changeSetting,
  createRoleAssignment,
  decideRoleAssignment,
  endRoleAssignment,
  listAuditLog,
  listQualityRoles,
  listQualitySettings,
  listRoleAssignments,
  listSettingChanges,
  type AuditLogQuery,
  type NewRoleAssignment,
  type RoleAssignmentQuery,
  type SettingValue,
} from "./quality-admin";
import { useHasTokens } from "./queries";

export const qualityAdminKeys = {
  roles: ["quality", "roles"] as const,
  assignments: (query: RoleAssignmentQuery) => ["quality", "role-assignments", query] as const,
  auditLog: (query: AuditLogQuery) => ["quality", "audit-log", query] as const,
  settings: ["quality", "settings"] as const,
  settingChanges: (key: string, page: number) =>
    ["quality", "settings", key, "changes", page] as const,
};

export function useQualityRoles(enabled = true) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityAdminKeys.roles,
    queryFn: ({ signal }) => listQualityRoles(signal),
    enabled: enabled && hasTokens,
    staleTime: 10 * 60_000,
  });
}

export function useRoleAssignments(query: RoleAssignmentQuery, enabled = true) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityAdminKeys.assignments(query),
    queryFn: ({ signal }) => listRoleAssignments(query, signal),
    enabled: enabled && hasTokens,
    placeholderData: keepPreviousData,
  });
}

function useInvalidateAssignments() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["quality", "role-assignments"] });
}

export function useCreateRoleAssignment() {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: (input: NewRoleAssignment) => createRoleAssignment(input),
    onSuccess: invalidate,
  });
}

export function useDecideRoleAssignment() {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: (input: { id: string; decision: "approve" | "reject"; reason?: string }) =>
      decideRoleAssignment(input.id, {
        decision: input.decision,
        ...(input.reason ? { reason: input.reason } : {}),
      }),
    onSuccess: invalidate,
  });
}

export function useEndRoleAssignment() {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: (input: { id: string; reason: string }) =>
      endRoleAssignment(input.id, input.reason),
    onSuccess: invalidate,
  });
}

export function useAuditLog(query: AuditLogQuery, enabled = true) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityAdminKeys.auditLog(query),
    queryFn: ({ signal }) => listAuditLog(query, signal),
    enabled: enabled && hasTokens,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useQualitySettings(enabled = true) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityAdminKeys.settings,
    queryFn: ({ signal }) => listQualitySettings(signal),
    enabled: enabled && hasTokens,
    retry: false,
  });
}

export function useSettingChanges(key: string | null, page = 1) {
  const hasTokens = useHasTokens();
  return useQuery({
    queryKey: qualityAdminKeys.settingChanges(key ?? "", page),
    queryFn: ({ signal }) => listSettingChanges(key as string, page, signal),
    enabled: hasTokens && Boolean(key),
  });
}

export function useChangeSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      key: string;
      value: SettingValue;
      effective_from: string;
      reason: string;
    }) =>
      changeSetting(input.key, {
        value: input.value,
        effective_from: input.effective_from,
        reason: input.reason,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qualityAdminKeys.settings }),
  });
}
