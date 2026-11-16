import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  acceptGovernanceInvitation,
  askGovernanceCopilot,
  closeGovernanceFinding,
  createGovernanceAssessment,
  createGovernanceFinding,
  createGovernanceInvitation,
  createGovernanceMilestone,
  createGovernancePolicy,
  createGovernanceRisk,
  createGovernanceScenario,
  createGovernanceStakeholder,
  decideGovernanceMember,
  escalateGovernanceFinding,
  escalateGovernanceRisk,
  fetchGovernanceAudit,
  fetchGovernanceCompliance,
  fetchGovernanceDashboard,
  fetchGovernanceMe,
  fetchGovernancePeople,
  getGovernancePolicy,
  listGovernanceAssessments,
  listGovernanceDocuments,
  listGovernanceFindings,
  listGovernanceInvitations,
  listGovernanceMembers,
  listGovernanceMilestones,
  listGovernancePolicies,
  listGovernanceReports,
  listGovernanceRisks,
  listGovernanceStakeholders,
  lookupGovernanceInvitation,
  requestGovernanceAccess,
  resendGovernanceInvitation,
  revokeGovernanceInvitation,
  setGovernanceRiskStatus,
  transitionGovernancePolicy,
  updateGovernanceMilestone,
  updateGovernancePolicy,
  updateGovernanceRisk,
  updateGovernanceScenario,
  updateGovernanceStakeholder,
  uploadGovernanceDocument,
  verifyGovernanceFinding,
  type GovernanceCapability,
  type GovernancePolicyAction,
  type GovernancePolicyInput,
  type GovernanceRiskInput,
  type GovernanceRiskStatus,
  type GovernanceSector,
  type GovernanceMilestoneInput,
  type GovernanceScenarioInput,
  type GovernanceStakeholderInput,
} from "./governance";
import type { UUID } from "./types";

// Every governance write invalidates everything under ["governance"]: the
// dashboard, the compliance overview and the lists all read across records,
// so a narrower invalidation would leave one of them stale.

export const governanceKeys = {
  all: ["governance"] as const,
  me: ["governance", "me"] as const,
  people: ["governance", "people"] as const,
  dashboard: (sector: GovernanceSector) => ["governance", "dashboard", sector] as const,
  compliance: ["governance", "compliance"] as const,
  audit: ["governance", "audit"] as const,
  reports: ["governance", "reports"] as const,
  policies: ["governance", "policies"] as const,
  policy: (id: UUID) => ["governance", "policies", id] as const,
  risks: ["governance", "risks"] as const,
  findings: ["governance", "findings"] as const,
  stakeholders: ["governance", "stakeholders"] as const,
  milestones: ["governance", "milestones"] as const,
  assessments: ["governance", "assessments"] as const,
  documents: ["governance", "documents"] as const,
  members: ["governance", "members"] as const,
  invitations: ["governance", "invitations"] as const,
  invitation: (token: string) => ["governance-invitation", token] as const,
};

export function useGovernanceMe(enabled = true) {
  return useQuery({
    queryKey: governanceKeys.me,
    queryFn: ({ signal }) => fetchGovernanceMe(signal),
    enabled,
  });
}

/** True when the signed-in member's role holds the capability. False while loading. */
export function useGovernanceCan(capability: GovernanceCapability): boolean {
  const { data } = useGovernanceMe();
  return Boolean(data?.capabilities[capability]);
}

export const useGovernancePeople = () =>
  useQuery({
    queryKey: governanceKeys.people,
    queryFn: ({ signal }) => fetchGovernancePeople(signal),
  });
export const useGovernanceDashboard = (sector: GovernanceSector) =>
  useQuery({
    queryKey: governanceKeys.dashboard(sector),
    queryFn: ({ signal }) => fetchGovernanceDashboard(sector, signal),
  });
export const useGovernanceCompliance = () =>
  useQuery({
    queryKey: governanceKeys.compliance,
    queryFn: ({ signal }) => fetchGovernanceCompliance(signal),
  });
export const useGovernanceAudit = (enabled: boolean) =>
  useQuery({
    queryKey: governanceKeys.audit,
    queryFn: ({ signal }) => fetchGovernanceAudit(signal),
    enabled,
  });
export const useGovernanceReports = () =>
  useQuery({
    queryKey: governanceKeys.reports,
    queryFn: ({ signal }) => listGovernanceReports(signal),
  });
export const useGovernancePolicies = () =>
  useQuery({
    queryKey: governanceKeys.policies,
    queryFn: ({ signal }) => listGovernancePolicies(signal),
  });
export const useGovernancePolicy = (id: UUID | null) =>
  useQuery({
    queryKey: governanceKeys.policy(id ?? ""),
    queryFn: ({ signal }) => getGovernancePolicy(id!, signal),
    enabled: Boolean(id),
  });
export const useGovernanceRisks = () =>
  useQuery({
    queryKey: governanceKeys.risks,
    queryFn: ({ signal }) => listGovernanceRisks(signal),
  });
export const useGovernanceFindings = () =>
  useQuery({
    queryKey: governanceKeys.findings,
    queryFn: ({ signal }) => listGovernanceFindings(signal),
  });
export const useGovernanceStakeholders = () =>
  useQuery({
    queryKey: governanceKeys.stakeholders,
    queryFn: ({ signal }) => listGovernanceStakeholders(signal),
  });
export const useGovernanceMilestones = () =>
  useQuery({
    queryKey: governanceKeys.milestones,
    queryFn: ({ signal }) => listGovernanceMilestones(signal),
  });
export const useGovernanceAssessments = () =>
  useQuery({
    queryKey: governanceKeys.assessments,
    queryFn: ({ signal }) => listGovernanceAssessments(signal),
  });
export const useGovernanceDocuments = () =>
  useQuery({
    queryKey: governanceKeys.documents,
    queryFn: ({ signal }) => listGovernanceDocuments(signal),
  });
export const useGovernanceMembers = (enabled: boolean) =>
  useQuery({
    queryKey: governanceKeys.members,
    queryFn: ({ signal }) => listGovernanceMembers(signal),
    enabled,
  });
export const useGovernanceInvitations = (enabled: boolean) =>
  useQuery({
    queryKey: governanceKeys.invitations,
    queryFn: ({ signal }) => listGovernanceInvitations(signal),
    enabled,
  });
export const useGovernanceInvitationPreview = (token: string) =>
  useQuery({
    queryKey: governanceKeys.invitation(token),
    queryFn: () => lookupGovernanceInvitation(token),
    enabled: Boolean(token),
    retry: false,
  });

function useGovernanceWrite<Args, Result>(fn: (args: Args) => Promise<Result>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => client.invalidateQueries({ queryKey: governanceKeys.all }),
  });
}

export const useCreateGovernancePolicy = () => useGovernanceWrite(createGovernancePolicy);
export const useUpdateGovernancePolicy = () =>
  useGovernanceWrite(({ id, body }: { id: UUID; body: GovernancePolicyInput }) =>
    updateGovernancePolicy(id, body),
  );
export const useTransitionGovernancePolicy = () =>
  useGovernanceWrite(
    ({ id, action, comment }: { id: UUID; action: GovernancePolicyAction; comment?: string }) =>
      transitionGovernancePolicy(id, action, comment),
  );

export const useCreateGovernanceRisk = () => useGovernanceWrite(createGovernanceRisk);
export const useUpdateGovernanceRisk = () =>
  useGovernanceWrite(({ id, body }: { id: UUID; body: GovernanceRiskInput }) =>
    updateGovernanceRisk(id, body),
  );
export const useEscalateGovernanceRisk = () =>
  useGovernanceWrite(({ id, comment }: { id: UUID; comment: string }) =>
    escalateGovernanceRisk(id, comment),
  );
export const useSetGovernanceRiskStatus = () =>
  useGovernanceWrite(
    ({
      id,
      status,
      comment,
    }: {
      id: UUID;
      status: Exclude<GovernanceRiskStatus, "escalated">;
      comment?: string;
    }) => setGovernanceRiskStatus(id, status, comment),
  );

export const useCreateGovernanceFinding = () => useGovernanceWrite(createGovernanceFinding);
export const useVerifyGovernanceFinding = () =>
  useGovernanceWrite(({ id, comment }: { id: UUID; comment?: string }) =>
    verifyGovernanceFinding(id, comment),
  );
export const useEscalateGovernanceFinding = () =>
  useGovernanceWrite(({ id, comment }: { id: UUID; comment: string }) =>
    escalateGovernanceFinding(id, comment),
  );
export const useCloseGovernanceFinding = () =>
  useGovernanceWrite(({ id, resolution }: { id: UUID; resolution: string }) =>
    closeGovernanceFinding(id, resolution),
  );

export const useCreateGovernanceStakeholder = () => useGovernanceWrite(createGovernanceStakeholder);
export const useUpdateGovernanceStakeholder = () =>
  useGovernanceWrite(({ id, body }: { id: UUID; body: GovernanceStakeholderInput }) =>
    updateGovernanceStakeholder(id, body),
  );

export const useCreateGovernanceMilestone = () => useGovernanceWrite(createGovernanceMilestone);
export const useUpdateGovernanceMilestone = () =>
  useGovernanceWrite(({ id, body }: { id: UUID; body: GovernanceMilestoneInput }) =>
    updateGovernanceMilestone(id, body),
  );

export const useCreateGovernanceAssessment = () => useGovernanceWrite(createGovernanceAssessment);
export const useCreateGovernanceScenario = () => useGovernanceWrite(createGovernanceScenario);
export const useUpdateGovernanceScenario = () =>
  useGovernanceWrite(({ id, body }: { id: UUID; body: GovernanceScenarioInput }) =>
    updateGovernanceScenario(id, body),
  );

export const useUploadGovernanceDocument = () => useGovernanceWrite(uploadGovernanceDocument);
export const useAskGovernanceCopilot = () => useMutation({ mutationFn: askGovernanceCopilot });

export const useDecideGovernanceMember = () =>
  useGovernanceWrite(
    ({ id, ...body }: { id: UUID } & Parameters<typeof decideGovernanceMember>[1]) =>
      decideGovernanceMember(id, body),
  );
export const useCreateGovernanceInvitation = () => useGovernanceWrite(createGovernanceInvitation);
export const useResendGovernanceInvitation = () => useGovernanceWrite(resendGovernanceInvitation);
export const useRevokeGovernanceInvitation = () => useGovernanceWrite(revokeGovernanceInvitation);
export const useAcceptGovernanceInvitation = () => useGovernanceWrite(acceptGovernanceInvitation);
export const useRequestGovernanceAccess = () => useGovernanceWrite(requestGovernanceAccess);
