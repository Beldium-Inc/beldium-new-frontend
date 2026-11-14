import * as React from "react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/errors";
import type * as Api from "@/lib/api/quality";
import {
  useAddCorrectiveAction,
  useAddCustodyEvent,
  useAdvanceCorrectiveAction,
  useAssignApplication,
  useBuyerSpecs,
  useCloseQualityNonConformity,
  useCreateTestRequest,
  useDecideQualityApplication,
  useIssueCertificate,
  useQualityApplications,
  useQualityCapabilities,
  useQualityCertificates,
  useQualityNonConformities,
  useQualitySamples,
  useRaiseNonConformity,
  useRegisterSample,
  useResolveRiskFlag,
  useRevokeCertificate,
  useSetDocumentStatus,
  useUploadQualityApplicationDocument,
  useUpdateTestResult,
  useSubmitQualityReview,
} from "@/lib/api/quality-queries";
import { useCurrentUser } from "@/lib/api/queries";
import { roleMeta } from "./data";
import type {
  Application,
  ApplicationStatus,
  BuyerSpec,
  Certificate,
  CorrectiveAction,
  DocStatus,
  NonConformity,
  ResultVerdict,
  Role,
  Sample,
  SampleStatus,
} from "./types";

function toApplication(row: Api.QualityApplication): Application {
  return {
    id: row.id,
    ref: row.reference,
    submittedAt: row.submitted_at,
    status: row.status,
    assignedTo: row.assigned_to,
    riskScore: row.risk_score,
    organisation: {
      legalName: row.organisation.legal_name,
      tradingName: row.organisation.trading_name,
      registrationNo: row.organisation.registration_no,
      country: row.organisation.country,
      city: row.organisation.city,
      incorporated: row.organisation.incorporated,
      website: row.organisation.website,
      beneficialOwners: row.organisation.beneficial_owners,
      contact: row.organisation.contact,
    },
    capability: {
      leadAssessor: row.capability.lead_assessor,
      credential: row.capability.credential,
      yearsExperience: row.capability.years_experience,
      registry: row.capability.registry,
      registryId: row.capability.registry_id,
      staff: row.capability.staff,
    },
    laboratory: {
      facility: row.laboratory.facility,
      accreditation: row.laboratory.accreditation,
      accreditationBody: row.laboratory.accreditation_body,
      certificateNo: row.laboratory.certificate_no,
      validUntil: row.laboratory.valid_until,
      lastSurveillance: row.laboratory.last_surveillance,
      proficiencyTesting: row.laboratory.proficiency_testing,
      scope: row.laboratory.scope,
    },
    ...(row.organisation.organisation_type
      ? {
          onboarding: {
            organisationType: row.organisation.organisation_type,
            taxIdentifier: row.organisation.tax_identifier ?? "",
            registeredAddress: row.organisation.registered_address ?? "",
            capabilities: row.capability.capabilities ?? [],
            minerals: row.capability.minerals ?? [],
            laboratories: row.laboratory.laboratories ?? [],
            equipment: row.laboratory.equipment ?? [],
            accreditedScope: row.laboratory.accredited_scope ?? "",
            offersSampling: row.capability.sampling?.offers_sampling ?? true,
            coverage: row.capability.sampling?.geographic_coverage ?? [],
            samplingTeams: row.capability.sampling?.field_sampling_teams ?? null,
            sealing: row.capability.sampling?.tamper_evident_sealing ?? "",
            samplingProcedure: row.capability.sampling?.sampling_procedure_summary ?? "",
          },
        }
      : {}),
    documents: row.documents.map((d) => ({
      id: d.id,
      name: d.name,
      category: d.category,
      reference: d.reference,
      issuer: d.issuer,
      issued: d.issued,
      expires: d.expires,
      status: d.status,
      ...(d.note ? { note: d.note } : {}),
      ...(d.conditional_on ? { conditionalOn: d.conditional_on } : {}),
      ...(d.file_id ? { hasFile: true } : {}),
    })),
    riskFlags: row.risk_flags,
    audit: row.audit.map((a) => ({ ...a, role: (a.role || "operator") as Role })),
    ...(row.decision_note ? { decisionNote: row.decision_note } : {}),
  };
}

function toSample(row: Api.Sample): Sample {
  return {
    id: row.id,
    ref: row.reference,
    material: row.material,
    lot: row.lot,
    mineSite: row.mine_site,
    origin: row.origin,
    massKg: row.mass_kg,
    registeredAt: row.registered_at,
    minerOrg: row.miner_org,
    partnerOrg: row.partner_org,
    buyerOrg: row.buyer_org,
    buyerSpecId: row.buyer_spec ?? "",
    status: row.status,
    custody: row.custody.map((c) => ({
      id: c.id,
      at: c.at,
      actor: c.actor,
      location: c.location,
      action: c.action,
      sealIntact: c.seal_intact,
      hash: c.hash,
    })),
    testRequest: row.test_request
      ? {
          id: row.test_request.id,
          requestedAt: row.test_request.requested_at,
          priority: row.test_request.priority,
          methods: row.test_request.methods,
          turnaround: row.test_request.turnaround,
          status: row.test_request.status,
        }
      : null,
    results: row.results,
    qualityReview: row.quality_review,
    audit: row.audit.map((a) => ({ ...a, role: (a.role || "operator") as Role })),
  };
}

function toCertificate(row: Api.Certificate): Certificate {
  return {
    id: row.id,
    ref: row.reference,
    sampleRef: row.sample_reference,
    material: row.material,
    issuedAt: row.issued_at,
    issuedBy: row.issued_by,
    validUntil: row.valid_until,
    status: row.status,
    verificationHash: row.verification_hash,
    scans: row.scans,
  };
}

function toBuyerSpec(row: Api.BuyerSpec): BuyerSpec {
  return {
    id: row.id,
    name: row.name,
    buyerOrg: row.buyer_org,
    material: row.material,
    limits: row.limits.map((l) => ({
      analyte: l.analyte,
      unit: l.unit ?? "",
      min: l.min ?? "",
      max: l.max ?? "",
      method: l.method ?? "",
    })),
  };
}

function toNonConformity(row: Api.QualityNonConformity): NonConformity {
  return {
    id: row.id,
    ref: row.reference,
    title: row.title,
    raisedAt: row.raised_at,
    raisedBy: row.raised_by,
    against: row.against,
    severity: row.severity,
    status: row.status,
    detail: row.detail,
    capa: row.capa,
  };
}

const ROLE_TITLE: Record<Role, string> = {
  operator: "Quality Officer",
  partner: "Technical Manager",
  miner: "Site Compliance Lead",
  buyer: "Procurement Lead",
  regulator: "Federal Minerals Inspectorate",
};

interface State {
  applications: Application[];
  samples: Sample[];
  certificates: Certificate[];
  nonConformities: NonConformity[];
}

interface Ctx {
  ready: boolean;
  user: { role: Role; name: string; title: string; org: string; initials: string } | null;
  role: Role | null;
  /** What the API says this caller may do. Nothing here comes from the sign in page. */
  can: { review: boolean; decide: boolean };
  /** The Q&C role codes the server says this person holds (backend G3). */
  roleCodes: Api.QualityRoleCode[];
  /** True when the access grid lets this person do `action` on `record`. */
  canDo: (record: Api.QualityRecordType, action: Api.QualityAction) => boolean;
  /** Record types this person sees only in a restricted view. */
  restrictedViews: Api.QualityRecordType[];
  state: State;
  logout: () => void;
  /**
   * Action methods resolve to true only after the server accepts the change.
   * Failures are reported to the user and resolve to false, so callers show
   * a success message only when this is true.
   */
  setDocStatus: (appId: string, docId: string, status: DocStatus) => Promise<boolean>;
  /** Resolves true once the file is stored; failures are reported to the user. */
  uploadDocument: (appId: string, docId: string, file: File) => Promise<boolean>;
  resolveFlag: (appId: string, flagId: string) => Promise<boolean>;
  decideApplication: (appId: string, status: ApplicationStatus, note: string) => Promise<boolean>;
  assignApplication: (appId: string) => Promise<boolean>;
  registerSample: (input: {
    material: string;
    lot: string;
    mineSite: string;
    origin: string;
    massKg: number;
    buyerSpecId: string;
  }) => Promise<string | null>;
  addCustody: (
    sampleId: string,
    action: string,
    location: string,
    sealIntact: boolean,
  ) => Promise<boolean>;
  /**
   * `laboratory` is an organisation id. Only the quality desk may send it, and
   * the laboratory must be verified; the API refuses anything else.
   */
  createTestRequest: (
    sampleId: string,
    input: {
      methods: string[];
      priority: "standard" | "expedited";
      turnaround: string;
      laboratory?: string | undefined;
    },
  ) => Promise<boolean>;
  /** The API derives the verdict from the measured value and the spec limit. */
  updateResult: (
    sampleId: string,
    resultId: string,
    input: { value?: string; unit?: string; uncertainty?: string },
  ) => Promise<boolean>;
  submitQualityReview: (sampleId: string, verdict: ResultVerdict, note: string) => Promise<boolean>;
  setSampleStatus: (sampleId: string, status: SampleStatus) => void;
  issueCertificate: (sampleId: string) => Promise<string | null>;
  /** The reason is kept on the server record. Callers must confirm first. */
  revokeCertificate: (certId: string, reason: string) => Promise<boolean>;
  raiseNonConformity: (input: {
    title: string;
    against: string;
    severity: NonConformity["severity"];
    detail: string;
  }) => Promise<boolean>;
  addCorrectiveAction: (ncrId: string, action: Omit<CorrectiveAction, "id">) => Promise<boolean>;
  advanceCorrectiveAction: (ncrId: string, actionId: string) => Promise<boolean>;
  /** The reason is kept on the server record. Callers must confirm first. */
  closeNonConformity: (ncrId: string, reason: string) => Promise<boolean>;

  isLoading: boolean;
  error: ApiError | null;
  retry: () => void;
}

/** Surface a failed API call instead of dropping the rejection on the floor. */
function reportFailure(error: unknown): void {
  toast.error(
    error instanceof ApiError ? error.message : "Something went wrong. Please try again.",
  );
}

/**
 * Run one server call. Resolves true only when the server accepted it; a failure
 * is reported and resolves false.
 */
async function runAction(call: () => Promise<unknown>): Promise<boolean> {
  try {
    await call();
    return true;
  } catch (error) {
    reportFailure(error);
    return false;
  }
}

const BeldiumContext = React.createContext<Ctx | null>(null);

const EMPTY_LIST = { results: [] };

export function BeldiumProvider({
  children,
  onSignOut,
}: {
  children: React.ReactNode;
  onSignOut: () => void;
}) {
  const currentUser = useCurrentUser();
  const capabilities = useQualityCapabilities();
  const applicationsQuery = useQualityApplications();
  const samplesQuery = useQualitySamples();
  const certificatesQuery = useQualityCertificates();
  const nonConformitiesQuery = useQualityNonConformities();

  const setDocStatusFor = useSetDocumentStatus();
  const uploadDocumentFor = useUploadQualityApplicationDocument();
  const resolveFlagFor = useResolveRiskFlag();
  const decideApplicationFor = useDecideQualityApplication();
  const assignApplicationFor = useAssignApplication();
  const registerSampleFor = useRegisterSample();
  const addCustodyFor = useAddCustodyEvent();
  const createTestRequestFor = useCreateTestRequest();
  const updateTestResultFor = useUpdateTestResult();
  const submitQualityReviewFor = useSubmitQualityReview();
  const issueCertificateFor = useIssueCertificate();
  const revokeCertificateFor = useRevokeCertificate();
  const raiseNonConformityFor = useRaiseNonConformity();
  const addCorrectiveActionFor = useAddCorrectiveAction();
  const advanceCorrectiveActionFor = useAdvanceCorrectiveAction();
  const closeNonConformityFor = useCloseQualityNonConformity();

  // The role comes from the server only (task E9). There is no fallback to a
  // role chosen at sign in or kept in the browser: no server role, no access.
  const effectiveRole: Role | null = capabilities.data?.role ?? null;
  const permissions = capabilities.data?.permissions;
  const canDo = React.useCallback(
    (record: Api.QualityRecordType, action: Api.QualityAction) =>
      Boolean(permissions?.[record]?.includes(action)),
    [permissions],
  );

  const user = React.useMemo(() => {
    const account = currentUser.data;
    if (!account || !effectiveRole) return null;
    const name = [account.first_name, account.last_name].filter(Boolean).join(" ") || account.email;
    const parts = name.split(/\s+/).filter(Boolean);
    const initials =
      parts.length === 0 ? "??" : (parts[0]![0]! + (parts[1]?.[0] ?? "")).toUpperCase();
    return {
      role: effectiveRole,
      name,
      title: ROLE_TITLE[effectiveRole],
      org: roleMeta[effectiveRole]?.label ?? "Beldium Quality & Control",
      initials,
    };
  }, [currentUser.data, effectiveRole]);

  const applications = React.useMemo(
    () => (applicationsQuery.data ?? EMPTY_LIST).results.map(toApplication),
    [applicationsQuery.data],
  );
  const samples = React.useMemo(
    () => (samplesQuery.data ?? EMPTY_LIST).results.map(toSample),
    [samplesQuery.data],
  );
  const certificates = React.useMemo(
    () => (certificatesQuery.data ?? EMPTY_LIST).results.map(toCertificate),
    [certificatesQuery.data],
  );
  const nonConformities = React.useMemo(
    () => (nonConformitiesQuery.data ?? EMPTY_LIST).results.map(toNonConformity),
    [nonConformitiesQuery.data],
  );

  const queries = [
    currentUser,
    capabilities,
    applicationsQuery,
    samplesQuery,
    certificatesQuery,
    nonConformitiesQuery,
  ];
  const isLoading = queries.some((query) => query.isPending);
  const firstError = queries.map((query) => query.error).find(Boolean) ?? null;

  const value: Ctx = {
    ready: !isLoading,
    user,
    role: effectiveRole,
    can: {
      review: capabilities.data?.can_review ?? false,
      decide: capabilities.data?.can_decide ?? false,
    },
    roleCodes: capabilities.data?.role_codes ?? [],
    canDo,
    restrictedViews: capabilities.data?.restricted_views ?? [],
    state: { applications, samples, certificates, nonConformities },
    logout: onSignOut,
    uploadDocument: async (appId, docId, file) => {
      try {
        await uploadDocumentFor.mutateAsync({ appId, docId, file });
        return true;
      } catch (error) {
        reportFailure(error);
        return false;
      }
    },
    setDocStatus: (appId, docId, status) =>
      runAction(() => setDocStatusFor.mutateAsync({ appId, docId, status })),
    resolveFlag: (appId, flagId) => runAction(() => resolveFlagFor.mutateAsync({ appId, flagId })),
    decideApplication: (appId, status, note) =>
      runAction(() => decideApplicationFor.mutateAsync({ id: appId, status, note })),
    assignApplication: (appId) => runAction(() => assignApplicationFor.mutateAsync(appId)),
    registerSample: async (input) => {
      try {
        const created = await registerSampleFor.mutateAsync({
          material: input.material,
          lot: input.lot,
          mine_site: input.mineSite,
          origin: input.origin,
          mass_kg: input.massKg,
          buyer_spec: input.buyerSpecId,
        });
        return created.id;
      } catch (error) {
        reportFailure(error);
        return null;
      }
    },
    addCustody: (sampleId, action, location, sealIntact) =>
      runAction(() =>
        addCustodyFor.mutateAsync({ id: sampleId, action, location, seal_intact: sealIntact }),
      ),
    createTestRequest: (sampleId, input) =>
      runAction(() => createTestRequestFor.mutateAsync({ id: sampleId, ...input })),
    updateResult: (sampleId, resultId, input) =>
      runAction(() => updateTestResultFor.mutateAsync({ sampleId, resultId, ...input })),
    submitQualityReview: (sampleId, verdict, note) =>
      runAction(() => submitQualityReviewFor.mutateAsync({ id: sampleId, verdict, note })),
    setSampleStatus: () => {
      // No screen currently drives a bare status change outside the mutations above.
    },
    issueCertificate: async (sampleId) => {
      try {
        const created = await issueCertificateFor.mutateAsync(sampleId);
        return created.id;
      } catch (error) {
        reportFailure(error);
        return null;
      }
    },
    revokeCertificate: (certId, reason) =>
      runAction(() => revokeCertificateFor.mutateAsync({ id: certId, reason })),
    raiseNonConformity: (input) => runAction(() => raiseNonConformityFor.mutateAsync(input)),
    addCorrectiveAction: (ncrId, action) =>
      runAction(() =>
        addCorrectiveActionFor.mutateAsync({
          id: ncrId,
          action: action.action,
          owner: action.owner,
          due: action.due,
        }),
      ),
    advanceCorrectiveAction: (ncrId, actionId) =>
      runAction(() => advanceCorrectiveActionFor.mutateAsync({ ncId: ncrId, actionId })),
    closeNonConformity: (ncrId, reason) =>
      runAction(() => closeNonConformityFor.mutateAsync({ id: ncrId, reason })),

    isLoading,
    error: firstError instanceof ApiError ? firstError : null,
    retry: () => {
      for (const query of queries) void query.refetch();
    },
  };

  return <BeldiumContext.Provider value={value}>{children}</BeldiumContext.Provider>;
}

export function useBeldium() {
  const ctx = React.useContext(BeldiumContext);
  if (!ctx) throw new Error("useBeldium must be used inside BeldiumProvider");
  return ctx;
}

export function useBuyerSpecList(): BuyerSpec[] {
  const query = useBuyerSpecs();
  return React.useMemo(() => (query.data ?? EMPTY_LIST).results.map(toBuyerSpec), [query.data]);
}

export { roleMeta };
