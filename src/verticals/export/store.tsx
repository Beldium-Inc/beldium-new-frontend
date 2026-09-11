import * as React from "react";

import { ApiError } from "@/lib/api/errors";
import {
  useAddShipmentAuditNote,
  useClaimShipment,
  useCreateShipment,
  useDecideExportShipment,
  useExportCapabilities,
  useExporters,
  useMonitoringEvents,
  useRaiseExportNonConformity,
  useReviewExportDocument,
  useSetChecklistItemState,
  useShipments,
  useUpdateExportNonConformity,
} from "@/lib/api/export-queries";
import type {
  Exporter as ApiExporter,
  ExportDocStatus,
  MonitoringEvent as ApiMonitoringEvent,
  Shipment as ApiShipment,
} from "@/lib/api/export";
import { useCurrentUser } from "@/lib/api/queries";
import {
  type AuditEntry,
  type ChecklistItem,
  type Exporter,
  type MonitoringEvent,
  type NonConformity,
  type Role,
  type Shipment,
} from "./mock-data";

type State = {
  shipments: Shipment[];
  exporters: Exporter[];
  events: MonitoringEvent[];
};

export type SessionUser = {
  id: string;
  name: string;
  role: Role;
  title: string;
  org: string;
  initials: string;
  exporterId?: string;
};

const ROLE_TITLE: Record<Role, string> = {
  operator: "Compliance Partner / Operator",
  exporter: "Export Manager",
  regulator: "Regulatory Oversight User",
};

const ROLE_ORG: Record<Role, string> = {
  operator: "Beldium Compliance Services",
  exporter: "Registered exporter",
  regulator: "Solid Minerals Oversight Desk",
};

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  return (parts[0]![0]! + (parts[1]?.[0] ?? "")).toUpperCase();
}

function toViewExporter(e: ApiExporter): Exporter {
  return {
    id: e.id,
    name: e.name,
    rcNumber: e.rc_number,
    state: e.state,
    contact: e.contact_name,
    email: e.contact_email,
    phone: e.contact_phone,
    minerals: e.minerals,
    verification: e.verification,
    complianceScore: e.compliance_score,
    onboarded: e.onboarded_on,
    licences: e.licences.map((l) => ({
      name: l.name,
      ref: l.ref,
      expires: l.expires_on ?? "-",
      status: l.status,
    })),
    kyc: e.kyc,
  };
}

function toViewChecklist(c: ApiShipment["checklist"][number]): ChecklistItem {
  return { id: c.id, label: c.label, section: c.section, state: c.state, detail: c.detail };
}

function toViewNonConformity(n: ApiShipment["non_conformities"][number]): NonConformity {
  return {
    id: n.id,
    title: n.title,
    severity: n.severity,
    section: n.section,
    raisedBy: n.raised_by,
    raisedAt: n.raised_at,
    status: n.status,
    detail: n.detail,
    response: n.response || undefined,
  };
}

function toViewAudit(a: ApiShipment["audit"][number]): AuditEntry {
  return { at: a.at, actor: a.actor, role: a.role, action: a.action, detail: a.detail };
}

function toViewShipment(s: ApiShipment): Shipment {
  return {
    id: s.id,
    reference: s.reference,
    exporterId: s.exporter,
    mineral: s.mineral,
    hsCode: s.hs_code,
    grade: s.grade,
    quantity: s.quantity,
    destination: s.destination,
    buyer: s.buyer,
    port: s.port,
    incoterm: s.incoterm,
    valueUsd: s.value_usd,
    etd: s.etd,
    submitted: s.submitted_on,
    status: s.status,
    riskScore: s.risk_score,
    riskBand: s.risk_band,
    riskFactors: s.risk_factors,
    sections: s.sections,
    documents: s.documents.map((d) => ({
      id: d.id,
      name: d.name,
      category: d.category,
      issuer: d.issuer,
      reference: d.reference,
      issued: d.issued_on,
      expires: d.expires_on ?? undefined,
      status: d.status,
      mandatory: d.mandatory,
      notes: d.notes,
    })),
    checklist: s.checklist.map(toViewChecklist),
    nonConformities: s.non_conformities.map(toViewNonConformity),
    audit: s.audit.map(toViewAudit),
    decision: s.decision
      ? {
          outcome: s.decision.outcome,
          by: s.decision.by,
          at: s.decision.at,
          rationale: s.decision.rationale,
          conditions: s.decision.conditions || undefined,
        }
      : undefined,
  };
}

function toViewEvent(e: ApiMonitoringEvent): MonitoringEvent {
  return {
    id: e.id,
    at: e.at,
    severity: e.severity,
    title: e.title,
    detail: e.detail,
    shipmentId: e.shipment ?? undefined,
    exporterId: e.exporter ?? undefined,
  };
}

type Ctx = {
  state: State;
  user: SessionUser | null;
  logout: () => void;
  documentAction: (
    shipmentId: string,
    docId: string,
    status: ExportDocStatus,
    action: string,
    comment: string,
  ) => void;
  toggleChecklist: (shipmentId: string, itemId: string, state: ChecklistItem["state"]) => void;
  raiseNonConformity: (
    shipmentId: string,
    nc: Pick<NonConformity, "title" | "severity" | "section" | "detail">,
  ) => void;
  updateNonConformity: (
    shipmentId: string,
    ncId: string,
    patch: Partial<Pick<NonConformity, "status" | "response">>,
  ) => void;
  claimShipment: (shipmentId: string) => void;
  decide: (
    shipmentId: string,
    outcome: "cleared" | "conditionally_cleared" | "declined",
    rationale: string,
    conditions?: string,
  ) => void;
  addShipment: (draft: Partial<Shipment> & { mineral: string }) => Promise<string>;
  regulatorAction: (shipmentId: string, action: string, detail: string) => void;
  log: (shipmentId: string, action: string, detail: string) => void;
  /** True until the first read of every list has settled. */
  isLoading: boolean;
  /** The first failure across the loaded queries, or null. */
  error: ApiError | null;
};

const StoreContext = React.createContext<Ctx | null>(null);

const EMPTY_LIST = { results: [] };

export function StoreProvider({
  children,
  role,
  onSignOut,
}: {
  children: React.ReactNode;
  /** Seeded from the shared session - this dashboard no longer signs anyone in. */
  role: Role;
  onSignOut: () => void;
}) {
  const currentUser = useCurrentUser();
  const capabilities = useExportCapabilities();
  const exporters = useExporters();
  const shipments = useShipments();
  const events = useMonitoringEvents();

  const reviewDocumentFor = useReviewExportDocument();
  const setChecklistItemFor = useSetChecklistItemState();
  const raiseNonConformityFor = useRaiseExportNonConformity();
  const updateNonConformityFor = useUpdateExportNonConformity();
  const claimShipmentFor = useClaimShipment();
  const decideShipmentFor = useDecideExportShipment();
  const createShipmentFor = useCreateShipment();
  const addAuditNoteFor = useAddShipmentAuditNote();

  // The browser stores which dashboard the user picked at sign-in, but an
  // account the API only grants oversight to must not be shown the operator's
  // chrome. Choosing the lighter view stays allowed; claiming the heavier one
  // does not — see the equivalent guard in the processing store.
  const audience = capabilities.data?.audience;
  const effectiveRole: Role =
    audience === "regulator" ? "regulator" : audience === "exporter" ? "exporter" : role;

  const user = React.useMemo<SessionUser | null>(() => {
    const account = currentUser.data;
    if (!account) return null;
    const name = [account.first_name, account.last_name].filter(Boolean).join(" ") || account.email;
    return {
      id: account.id,
      name,
      role: effectiveRole,
      title: ROLE_TITLE[effectiveRole],
      org: ROLE_ORG[effectiveRole],
      initials: initialsOf(name),
      exporterId: capabilities.data?.exporter ?? undefined,
    };
  }, [currentUser.data, effectiveRole, capabilities.data?.exporter]);

  const shipmentRows = React.useMemo(
    () => (shipments.data ?? EMPTY_LIST).results.map(toViewShipment),
    [shipments.data],
  );
  const exporterRows = React.useMemo(
    () => (exporters.data ?? EMPTY_LIST).results.map(toViewExporter),
    [exporters.data],
  );
  const eventRows = React.useMemo(() => (events.data ?? EMPTY_LIST).results.map(toViewEvent), [events.data]);

  const state: State = { shipments: shipmentRows, exporters: exporterRows, events: eventRows };

  const queries = [currentUser, capabilities, exporters, shipments, events];
  const isLoading = queries.some((query) => query.isPending);
  const firstError = queries.map((query) => query.error).find(Boolean) ?? null;

  const value: Ctx = {
    state,
    user,
    logout: onSignOut,
    documentAction: (shipmentId, docId, status, action, comment) => {
      void reviewDocumentFor.mutateAsync({ id: docId, status, action, comment });
    },
    toggleChecklist: (shipmentId, itemId, itemState) => {
      void setChecklistItemFor.mutateAsync({ shipmentId, itemId, state: itemState });
    },
    raiseNonConformity: (shipmentId, nc) => {
      void raiseNonConformityFor.mutateAsync({ shipment: shipmentId, ...nc });
    },
    updateNonConformity: (shipmentId, ncId, patch) => {
      void updateNonConformityFor.mutateAsync({ id: ncId, ...patch });
    },
    claimShipment: (shipmentId) => {
      void claimShipmentFor.mutateAsync(shipmentId);
    },
    decide: (shipmentId, outcome, rationale, conditions) => {
      void decideShipmentFor.mutateAsync({ id: shipmentId, outcome, rationale, conditions });
    },
    addShipment: async (draft) => {
      const created = await createShipmentFor.mutateAsync({
        mineral: draft.mineral,
        hs_code: draft.hsCode,
        grade: draft.grade,
        quantity: draft.quantity,
        buyer: draft.buyer,
        destination: draft.destination,
        port: draft.port,
        incoterm: draft.incoterm,
        value_usd: draft.valueUsd,
        etd: draft.etd,
      });
      return created.id;
    },
    regulatorAction: (shipmentId, action, detail) => {
      void addAuditNoteFor.mutateAsync({ shipmentId, action, detail });
    },
    log: (shipmentId, action, detail) => {
      void addAuditNoteFor.mutateAsync({ shipmentId, action, detail });
    },
    isLoading,
    error: firstError instanceof ApiError ? firstError : null,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
