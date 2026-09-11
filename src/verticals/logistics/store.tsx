import * as React from "react";

import { ApiError } from "@/lib/api/errors";
import type * as Api from "@/lib/api/logistics";
import {
  useApplicationConditions,
  useCreateInformationRequest,
  useDecideApplication,
  useLogisticsApplications,
  useLogisticsAudit,
  useLogisticsCompanies,
  useLogisticsDashboard,
  useLogisticsDocuments,
  useLogisticsDrivers,
  useLogisticsMe,
  useLogisticsNotifications,
  useLogisticsRequests,
  useLogisticsRestrictions,
  useLogisticsVehicles,
  useMarkNotificationRead,
  useReviewDocument,
  useRespondToRequest,
  useAddDocumentNote,
  useStartReview,
} from "@/lib/api/logistics-queries";
import { useCurrentUser } from "@/lib/api/queries";
import {
  documentDownloadUrl,
  type LogisticsDomainKey,
} from "@/lib/api/logistics";
import type {
  AuditEntry,
  CheckSection,
  CheckStatus,
  Company,
  ComplianceDocument,
  CompanyStatus,
  DocStatus,
  Driver,
  ExpiringDoc,
  InfoRequest,
  Notification,
  RiskBand,
  Role,
  Vehicle,
} from "./mock-data";

export type Session = {
  role: Role;
  person: string;
  title: string;
  org: string;
  email: string;
};

export type Decision = "Approved" | "Conditionally Approved" | "Rejected" | "More Info Requested";

const ROLE_TITLE: Record<Role, string> = {
  operator: "Compliance Operator",
  partner: "Logistics Partner",
  regulator: "Regulatory Oversight Officer",
  admin: "Platform Administrator",
};

const DOMAIN_LABEL: Record<LogisticsDomainKey, string> = {
  corporate: "Corporate Verification",
  regulatory: "Regulatory Licensing",
  fleet: "Fleet Compliance",
  driver: "Driver Compliance",
  insurance: "Insurance Cover",
  hs: "Health & Safety",
  operational: "Operational Capability",
  mineral: "Mineral Transport",
  data: "Data & Platform",
};

const DOMAIN_DESCRIPTION: Record<LogisticsDomainKey, string> = {
  corporate: "Legal entity, ownership and tax standing.",
  regulatory: "Federal and state transport authorisations.",
  fleet: "Vehicle registration, roadworthiness and telematics.",
  driver: "Licensing, medicals and competency training.",
  insurance: "Motor, goods-in-transit and liability cover.",
  hs: "HSE governance, incidents and training culture.",
  operational: "Journey management, depots and service delivery.",
  mineral: "Solid-minerals haulage authorisation and custody controls.",
  data: "NDPR attestation and platform integration readiness.",
};

const DOMAIN_ORDER: LogisticsDomainKey[] = [
  "corporate", "regulatory", "fleet", "driver", "insurance", "hs", "operational", "mineral", "data",
];

const CHECK_STATUS: Record<Api.DomainReviewStatus, CheckStatus> = {
  pending: "pending",
  passed: "passed",
  attention: "attention",
  failed: "failed",
};

const DOC_STATUS: Record<Api.EvidenceStatus, DocStatus> = {
  pending: "pending",
  verified: "verified",
  rejected: "rejected",
};

const APPLICATION_STATUS_LABEL: Record<Api.LogisticsApplicationStatus, CompanyStatus> = {
  draft: "Pending Review",
  submitted: "Pending Review",
  under_review: "Under Review",
  awaiting_information: "Awaiting Information",
  conditionally_approved: "Conditionally Approved",
  approved: "Approved",
  rejected: "Rejected",
};

const CREDENTIAL_STATUS: Record<Api.CredentialValidity, Vehicle["status"]> = {
  current: "Compliant",
  expiring: "Attention",
  expired: "Non-compliant",
};

function riskBandLabel(band: Api.LogisticsApplication["risk"]["risk_band"] | null | undefined): RiskBand {
  if (band === "high") return "High";
  if (band === "medium") return "Medium";
  return "Low";
}

function toVehicle(row: Api.Vehicle): Vehicle {
  return {
    id: row.id,
    registration: row.registration,
    type: row.vehicle_type,
    vin: row.vin,
    make: row.make,
    model: row.model,
    year: row.year,
    capacity: `${row.capacity} ${row.capacity_unit}`,
    ownership: row.ownership === "owned" ? "Owned" : row.ownership === "leased" ? "Leased" : "Contracted",
    insurer: row.insurer,
    insuranceExpiry: row.insurance_expiry,
    roadworthinessExpiry: row.roadworthiness_expiry,
    gps: row.gps_status === "active" ? "Active" : row.gps_status === "intermittent" ? "Intermittent" : "Inactive",
    status: row.is_active ? CREDENTIAL_STATUS[row.credential_status] : "Non-compliant",
    location: row.location,
  };
}

function toDriver(row: Api.Driver, vehicleReg: string): Driver {
  return {
    id: row.id,
    name: row.full_name,
    licence: row.licence_number,
    licenceClass: row.licence_class,
    licenceExpiry: row.licence_expiry,
    nationalId: row.national_id,
    experience: `${row.years_experience} years`,
    assignedVehicle: vehicleReg,
    training: row.training,
    medicalExpiry: row.medical_expiry,
    status: row.is_active ? CREDENTIAL_STATUS[row.credential_status] : "Non-compliant",
  };
}

function toDocument(row: Api.LogisticsDocument): ComplianceDocument {
  return {
    id: row.id,
    name: row.title,
    category: DOMAIN_LABEL[row.domain],
    type: (row.original_name.split(".").pop() ?? "FILE").toUpperCase(),
    issuer: row.issuer,
    reference: row.reference,
    issued: row.issued_on ?? "-",
    expires: row.expires_on ?? "-",
    size: "",
    uploadedBy: "",
    uploadedAt: row.created_at.slice(0, 10),
    status: DOC_STATUS[row.status],
    notes: [],
  };
}

function toCheckSections(
  application: Api.LogisticsApplication | undefined,
  documents: Api.LogisticsDocument[],
): CheckSection[] {
  const sections = application?.sections ?? [];
  return DOMAIN_ORDER.map((key) => {
    const section = sections.find((s) => s.key === key);
    return {
      key,
      label: DOMAIN_LABEL[key],
      description: DOMAIN_DESCRIPTION[key],
      status: section ? CHECK_STATUS[section.status] : "pending",
      score: section?.score ?? 0,
      items: [],
      documentIds: documents.filter((d) => d.domain === key).map((d) => d.id),
    };
  });
}

function toAuditEntry(row: Api.LogisticsAuditEvent): AuditEntry {
  return {
    id: row.id,
    at: row.created_at.slice(0, 16).replace("T", " "),
    actor: row.actor_id ?? "Beldium Platform",
    role: row.actor_id ? "" : "System",
    action: row.event_type.replace(/^logistics\./, "").replace(/_/g, " "),
    target: "",
    outcome: "",
  };
}

function toInfoRequest(row: Api.InformationRequest, companyId: string, companyName: string): InfoRequest {
  const latest = row.responses[row.responses.length - 1];
  return {
    id: row.id,
    companyId,
    company: companyName,
    reason: row.reason,
    message: row.message,
    items: row.items,
    raisedBy: "",
    raisedAt: row.created_at.slice(0, 10),
    due: row.due_date,
    status: row.status === "open" ? "Open" : row.status === "responded" ? "Responded" : "Closed",
    ...(latest
      ? { response: { at: latest.created_at.slice(0, 10), message: latest.message, files: latest.documents } }
      : {}),
  };
}

function toNotification(row: Api.Notification): Notification {
  return {
    id: row.id,
    audience: ["operator", "partner", "regulator", "admin"],
    title: row.title,
    body: row.body,
    at: row.created_at.slice(0, 16).replace("T", " "),
    tone: "info",
    read: Boolean(row.read_at),
  };
}

interface Ctx {
  session: Session | null;
  hydrated: boolean;
  signOut: () => void;

  companies: Company[];
  /**
   * The signed-in partner's own company. Reads are already scoped to the
   * caller (organisation membership or an explicit access grant), so for a
   * `partner` session this is simply the one company the API hands back.
   */
  myCompany: Company | null;
  requests: InfoRequest[];
  notifications: Notification[];
  audit: AuditEntry[];
  /** Every current document across the register expiring within 90 days, worst-first. */
  expiringDocuments: ExpiringDoc[];
  reviewNotes: { id: string; author: string; at: string; text: string }[];
  decisions: Record<string, { decision: Decision; at: string; summary: string; by: string }>;

  setDocumentStatus: (companyId: string, docId: string, status: DocStatus) => void;
  addDocumentNote: (companyId: string, docId: string, text: string) => void;
  addReviewNote: (text: string) => void;
  assignReviewer: (companyId: string, reviewer: string) => void;
  startReview: (companyId: string) => void;
  createRequest: (companyId: string, reason: string, message: string, items: string[]) => void;
  respondToRequest: (requestId: string, message: string, files: string[]) => void;
  recordDecision: (companyId: string, decision: Decision, summary: string) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;

  isLoading: boolean;
  error: ApiError | null;
}

const AppContext = React.createContext<Ctx | null>(null);

const EMPTY_LIST = { results: [] };

export function AppStateProvider({
  children,
  role,
  onSignOut,
}: {
  children: React.ReactNode;
  /** Seeded from the shared session, this dashboard no longer signs anyone in. */
  role: Role;
  onSignOut: () => void;
}) {
  const currentUser = useCurrentUser();
  const me = useLogisticsMe();
  const dashboard = useLogisticsDashboard();
  const companiesQuery = useLogisticsCompanies();
  const applicationsQuery = useLogisticsApplications();
  const vehiclesQuery = useLogisticsVehicles();
  const driversQuery = useLogisticsDrivers();
  const documentsQuery = useLogisticsDocuments();
  const requestsQuery = useLogisticsRequests();
  const restrictionsQuery = useLogisticsRestrictions();
  const notificationsQuery = useLogisticsNotifications();
  const auditQuery = useLogisticsAudit();

  const startReviewFor = useStartReview();
  const decideFor = useDecideApplication();
  const createRequestFor = useCreateInformationRequest();
  const respondFor = useRespondToRequest();
  const reviewDocumentFor = useReviewDocument();
  const addDocumentNoteFor = useAddDocumentNote();
  const markReadFor = useMarkNotificationRead();

  // Silence unused-hook warnings until a screen wires condition detail reads;
  // the endpoint is exposed through logistics-queries for that later use.
  void useApplicationConditions;

  const session = React.useMemo<Session | null>(() => {
    const account = currentUser.data;
    if (!account) return null;
    const name = [account.first_name, account.last_name].filter(Boolean).join(" ") || account.email;
    return { role, person: name, title: ROLE_TITLE[role], org: "Beldium Logistics Compliance", email: account.email };
  }, [currentUser.data, role]);

  const companiesRaw = (companiesQuery.data ?? EMPTY_LIST).results;
  const applicationsRaw = (applicationsQuery.data ?? EMPTY_LIST).results;
  const vehiclesRaw = (vehiclesQuery.data ?? EMPTY_LIST).results;
  const driversRaw = (driversQuery.data ?? EMPTY_LIST).results;
  const documentsRaw = (documentsQuery.data ?? EMPTY_LIST).results;
  const requestsRaw = (requestsQuery.data ?? EMPTY_LIST).results;
  const notificationsRaw = (notificationsQuery.data ?? EMPTY_LIST).results;
  const auditRaw = auditQuery.data?.events ?? [];

  // Every screen addresses a company by its human reference (the old mock's
  // `id`), while the API keys everything off a uuid; this is the one place
  // that bridge is built.
  const uuidByReference = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of companiesRaw) map.set(row.reference, row.id);
    return map;
  }, [companiesRaw]);

  const applicationByCompanyUuid = React.useMemo(() => {
    const map = new Map<string, Api.LogisticsApplication>();
    for (const row of applicationsRaw) map.set(row.company, row);
    return map;
  }, [applicationsRaw]);

  const applicationUuidToCompanyUuid = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of applicationsRaw) map.set(row.id, row.company);
    return map;
  }, [applicationsRaw]);

  const dashboardByCompanyUuid = React.useMemo(() => {
    const map = new Map<string, Api.LogisticsDashboardCompany>();
    for (const row of dashboard.data?.companies ?? []) map.set(row.company_id, row);
    return map;
  }, [dashboard.data]);

  const companies = React.useMemo<Company[]>(() => {
    return companiesRaw.map((row) => {
      const application = applicationByCompanyUuid.get(row.id);
      const vehicles = vehiclesRaw.filter((v) => v.company === row.id).map(toVehicle);
      const vehicleRegById = new Map(vehiclesRaw.filter((v) => v.company === row.id).map((v) => [v.id, v.registration]));
      const drivers = driversRaw
        .filter((d) => d.company === row.id)
        .map((d) => toDriver(d, d.assigned_vehicle ? (vehicleRegById.get(d.assigned_vehicle) ?? "") : ""));
      const documents = application
        ? documentsRaw.filter((doc) => doc.application === application.id)
        : [];
      const dashboardRow = dashboardByCompanyUuid.get(row.id);
      const baseStatus = application ? APPLICATION_STATUS_LABEL[application.status] : "Pending Review";
      const status: CompanyStatus =
        (baseStatus === "Approved" || baseStatus === "Conditionally Approved") &&
        (dashboardRow?.expiring_documents ?? 0) > 0
          ? "Expiring Documents"
          : baseStatus;
      return {
        id: row.reference,
        name: row.name,
        regId: row.reference,
        rcNumber: row.registration_number,
        location: "",
        state: "",
        country: "Nigeria",
        incorporated: row.incorporated_on ?? "",
        fleetSize: vehicles.length,
        driverCount: drivers.length,
        status,
        risk: riskBandLabel(application?.risk?.risk_band),
        riskScore: application?.risk?.compliance_score ?? 0,
        submitted: application?.submitted_at?.slice(0, 10) ?? "",
        reviewer: application?.reviewer ?? "Unassigned",
        lastActivity: row.updated_at.slice(0, 10),
        contactName: row.contact_name,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        website: "",
        employees: row.employees,
        annualTonnage: `${row.annual_tonnage} t`,
        services: row.services,
        operatingLocations: [],
        scores: {
          fleet: application?.sections.find((s) => s.key === "fleet")?.score ?? 0,
          drivers: application?.sections.find((s) => s.key === "driver")?.score ?? 0,
          insurance: application?.sections.find((s) => s.key === "insurance")?.score ?? 0,
          safety: application?.sections.find((s) => s.key === "hs")?.score ?? 0,
          mineral: application?.sections.find((s) => s.key === "mineral")?.score ?? 0,
        },
        checks: toCheckSections(application, documents),
        documents: documents.map(toDocument),
        vehicles,
        drivers,
        activity: [],
      };
    });
  }, [companiesRaw, applicationByCompanyUuid, vehiclesRaw, driversRaw, documentsRaw, dashboardByCompanyUuid]);

  const companyNameByUuid = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of companiesRaw) map.set(row.id, row.name);
    return map;
  }, [companiesRaw]);

  const companyReferenceByUuid = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of companiesRaw) map.set(row.id, row.reference);
    return map;
  }, [companiesRaw]);

  const requests = React.useMemo<InfoRequest[]>(
    () =>
      requestsRaw.map((row) => {
        const companyUuid = applicationUuidToCompanyUuid.get(row.application);
        const companyId = (companyUuid && companyReferenceByUuid.get(companyUuid)) ?? row.application;
        const companyName = (companyUuid && companyNameByUuid.get(companyUuid)) ?? "";
        return toInfoRequest(row, companyId, companyName);
      }),
    [requestsRaw, applicationUuidToCompanyUuid, companyReferenceByUuid, companyNameByUuid],
  );

  const notifications = React.useMemo(() => notificationsRaw.map(toNotification), [notificationsRaw]);
  const audit = React.useMemo(() => auditRaw.map(toAuditEntry), [auditRaw]);

  const expiringDocuments = React.useMemo<ExpiringDoc[]>(() => {
    const today = Date.now();
    const rows: ExpiringDoc[] = [];
    for (const company of companies) {
      for (const doc of company.documents) {
        if (doc.expires === "-" || doc.status === "rejected") continue;
        const days = Math.round((new Date(doc.expires).getTime() - today) / 864e5);
        if (Number.isNaN(days) || days > 90) continue;
        rows.push({
          id: `${company.id}-${doc.id}`,
          company: company.name,
          companyId: company.id,
          document: doc.name,
          category: doc.category,
          expires: doc.expires,
          daysLeft: days,
          severity: days <= 10 ? "critical" : days <= 30 ? "warning" : "watch",
        });
      }
    }
    return rows.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [companies]);

  const decisions = React.useMemo(() => {
    const map: Record<string, { decision: Decision; at: string; summary: string; by: string }> = {};
    for (const row of applicationsRaw) {
      if (!["approved", "conditionally_approved", "rejected"].includes(row.status)) continue;
      const companyId = companyReferenceByUuid.get(row.company) ?? row.company;
      map[companyId] = {
        decision:
          row.status === "approved"
            ? "Approved"
            : row.status === "conditionally_approved"
              ? "Conditionally Approved"
              : "Rejected",
        at: row.reviewed_at?.slice(0, 16).replace("T", " ") ?? "",
        summary: row.rationale,
        by: "",
      };
    }
    return map;
  }, [applicationsRaw, companyReferenceByUuid]);

  const queries = [
    currentUser, me, dashboard, companiesQuery, applicationsQuery, vehiclesQuery,
    driversQuery, documentsQuery, requestsQuery, restrictionsQuery, notificationsQuery, auditQuery,
  ];
  const isLoading = queries.some((q) => q.isPending);
  const firstError = queries.map((q) => q.error).find(Boolean) ?? null;

  const applicationIdForCompany = React.useCallback(
    (companyId: string) => {
      const uuid = uuidByReference.get(companyId);
      return uuid ? applicationByCompanyUuid.get(uuid)?.id ?? null : null;
    },
    [uuidByReference, applicationByCompanyUuid],
  );

  const findRequest = React.useCallback(
    (requestId: string) => requestsRaw.find((r) => r.id === requestId),
    [requestsRaw],
  );

  const value: Ctx = {
    session,
    hydrated: !isLoading,
    signOut: onSignOut,

    companies,
    myCompany: companies[0] ?? null,
    requests,
    notifications,
    audit,
    expiringDocuments,
    reviewNotes: [],
    decisions,

    setDocumentStatus: (_companyId, docId, status) => {
      if (status !== "verified" && status !== "rejected") return;
      void reviewDocumentFor.mutateAsync({ id: docId, status, notes: "" });
    },
    addDocumentNote: (_companyId, docId, text) => {
      void addDocumentNoteFor.mutateAsync({ id: docId, body: text });
    },
    addReviewNote: () => {},
    assignReviewer: () => {
      // The API assigns reviewers by user id, not the display name this
      // screen currently collects; wire a user picker before enabling this.
    },
    startReview: (companyId) => {
      const id = applicationIdForCompany(companyId);
      if (!id) return;
      void startReviewFor.mutateAsync(id);
    },
    createRequest: (companyId, reason, message, items) => {
      const id = applicationIdForCompany(companyId);
      if (!id) return;
      const due = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
      void createRequestFor.mutateAsync({ id, reason, message, items, due_date: due });
    },
    respondToRequest: (requestId, message) => {
      const request = findRequest(requestId);
      if (!request) return;
      void respondFor.mutateAsync({ id: requestId, message, documents: [] });
    },
    recordDecision: (companyId, decision, summary) => {
      const id = applicationIdForCompany(companyId);
      if (!id) return;
      if (decision === "More Info Requested") return;
      const status =
        decision === "Approved" ? "approved" : decision === "Conditionally Approved" ? "conditionally_approved" : "rejected";
      void decideFor.mutateAsync({ id, status, rationale: summary });
    },
    markNotificationRead: (id) => void markReadFor.mutateAsync(id),
    markAllRead: () => {
      for (const row of notificationsRaw) {
        if (!row.read_at) void markReadFor.mutateAsync(row.id);
      }
    },

    isLoading,
    error: firstError instanceof ApiError ? firstError : null,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppStateProvider");
  return ctx;
}

export function useCompany(id: string) {
  const { companies } = useApp();
  return companies.find((c) => c.id === id);
}

export { documentDownloadUrl };
