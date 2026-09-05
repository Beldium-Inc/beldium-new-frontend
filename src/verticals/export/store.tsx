import * as React from "react";
import {
  DEMO_USERS,
  EXPORTERS,
  MONITORING_EVENTS,
  SHIPMENTS,
  type AuditEntry,
  type ChecklistItem,
  type DemoUser,
  type DocStatus,
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

const STORAGE_KEY = "beldium.export.v1";

const initialState: State = {
  shipments: SHIPMENTS,
  exporters: EXPORTERS,
  events: MONITORING_EVENTS,
};

function now() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

type Ctx = {
  state: State;
  user: DemoUser | null;
  logout: () => void;
  resetDemo: () => void;
  documentAction: (
    shipmentId: string,
    docId: string,
    status: DocStatus,
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
  addShipment: (draft: Partial<Shipment> & { mineral: string }) => string;
  regulatorAction: (shipmentId: string, action: string, detail: string) => void;
  log: (shipmentId: string, action: string, detail: string) => void;
};

const StoreContext = React.createContext<Ctx | null>(null);

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
  const user = DEMO_USERS.find((u) => u.role === role) ?? null;
  const [state, setState] = React.useState<State>(initialState);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...(JSON.parse(raw) as State) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const actorName = user?.name ?? "Demo user";
  const actorRole: Role | "system" = user?.role ?? "system";

  const patchShipment = React.useCallback(
    (id: string, fn: (s: Shipment) => Shipment) =>
      setState((prev) => ({
        ...prev,
        shipments: prev.shipments.map((s) => (s.id === id ? fn(s) : s)),
      })),
    [],
  );

  const appendAudit = (s: Shipment, action: string, detail: string): AuditEntry[] => [
    ...s.audit,
    { at: now(), actor: actorName, role: actorRole, action, detail },
  ];

  const value: Ctx = {
    state,
    user,
    logout: onSignOut,
    resetDemo: () => setState(initialState),
    log: (shipmentId, action, detail) =>
      patchShipment(shipmentId, (s) => ({ ...s, audit: appendAudit(s, action, detail) })),
    documentAction: (shipmentId, docId, status, action, comment) =>
      patchShipment(shipmentId, (s) => {
        const target = s.documents.find((d) => d.id === docId);
        return {
          ...s,
          documents: s.documents.map((d) =>
            d.id === docId
              ? {
                  ...d,
                  status,
                  notes: [...d.notes, { at: now(), by: actorName, action, comment }],
                }
              : d,
          ),
          audit: appendAudit(s, action, `${target?.name ?? docId}${comment ? `: ${comment}` : ""}`),
        };
      }),
    toggleChecklist: (shipmentId, itemId, itemState) =>
      patchShipment(shipmentId, (s) => {
        const item = s.checklist.find((c) => c.id === itemId);
        return {
          ...s,
          checklist: s.checklist.map((c) => (c.id === itemId ? { ...c, state: itemState } : c)),
          audit: appendAudit(
            s,
            "Checklist updated",
            `${item?.label ?? itemId} marked ${itemState.toUpperCase()}`,
          ),
        };
      }),
    raiseNonConformity: (shipmentId, nc) =>
      patchShipment(shipmentId, (s) => ({
        ...s,
        status: s.status === "cleared" ? s.status : "info_requested",
        nonConformities: [
          ...s.nonConformities,
          {
            id: `NC-${s.reference.slice(-4)}-${s.nonConformities.length + 1}`,
            raisedBy: actorName,
            raisedAt: now().slice(0, 10),
            status: "open",
            ...nc,
          },
        ],
        audit: appendAudit(s, "Non-conformity raised", `${nc.title} (${nc.severity})`),
      })),
    updateNonConformity: (shipmentId, ncId, patch) =>
      patchShipment(shipmentId, (s) => ({
        ...s,
        nonConformities: s.nonConformities.map((n) => (n.id === ncId ? { ...n, ...patch } : n)),
        audit: appendAudit(s, "Non-conformity updated", `${ncId} → ${patch.status ?? "response added"}`),
      })),
    claimShipment: (shipmentId) =>
      patchShipment(shipmentId, (s) => ({
        ...s,
        status: s.status === "submitted" ? "in_review" : s.status,
        sections: {
          ...s.sections,
          overview: (s.sections.overview ?? []).map((f) =>
            f.label === "Assigned reviewer" ? { label: f.label, value: actorName } : f,
          ),
        },
        audit: appendAudit(s, "Review started", `Assigned to ${actorName}`),
      })),
    decide: (shipmentId, outcome, rationale, conditions) =>
      patchShipment(shipmentId, (s) => ({
        ...s,
        status: outcome,
        decision: { outcome, by: actorName, at: now(), rationale, conditions },
        audit: appendAudit(
          s,
          "Compliance decision",
          `${outcome.replace(/_/g, " ")}: ${rationale.slice(0, 90)}`,
        ),
      })),
    addShipment: (draft) => {
      const seq = 500 + state.shipments.length;
      const id = `SHP-2026-0${seq}`;
      const exporterId = user?.exporterId ?? "EXP-1042";
      const exporter = state.exporters.find((e) => e.id === exporterId);
      const base: Shipment = {
        id,
        reference: `BEL/NEW/0${seq}`,
        exporterId,
        mineral: draft.mineral,
        hsCode: draft.hsCode ?? "-",
        grade: draft.grade ?? "-",
        quantity: draft.quantity ?? "-",
        destination: draft.destination ?? "-",
        buyer: draft.buyer ?? "-",
        port: draft.port ?? "Apapa Port, Lagos",
        incoterm: draft.incoterm ?? "FOB",
        valueUsd: draft.valueUsd ?? 0,
        etd: draft.etd ?? "-",
        submitted: now().slice(0, 10),
        status: "submitted",
        riskScore: 45,
        riskBand: "medium",
        riskFactors: [
          { label: "New submission", weight: 20, note: "No operator review performed yet." },
          {
            label: "Exporter track record",
            weight: 15,
            note: `Compliance score ${exporter?.complianceScore ?? "-"}.`,
          },
          { label: "Document completeness", weight: 10, note: "Mandatory document set not yet uploaded." },
        ],
        sections: {
          overview: [
            { label: "Consignment reference", value: `BEL/NEW/0${seq}` },
            { label: "Compliance stage", value: "Awaiting operator pickup" },
            { label: "Days to ETD", value: draft.etd ?? "-" },
            { label: "Assigned reviewer", value: "Unassigned", flag: "warn" },
            { label: "Beldium record type", value: "Compliance verification record (not a government permit)" },
          ],
          exporter: [
            { label: "Exporter", value: exporter?.name ?? "-" },
            { label: "RC number", value: exporter?.rcNumber ?? "-" },
            { label: "Verification state", value: exporter?.verification ?? "-" },
            { label: "Compliance score", value: `${exporter?.complianceScore ?? "-"} / 100` },
          ],
          product: [
            { label: "Commodity", value: draft.mineral },
            { label: "HS code", value: draft.hsCode ?? "-" },
            { label: "Grade / spec", value: draft.grade ?? "-" },
            { label: "Packaging", value: draft.sections?.product?.[3]?.value ?? "To be declared" },
          ],
          quantity: [
            { label: "Declared net weight", value: draft.quantity ?? "-" },
            { label: "Weighbridge total", value: "Not supplied", flag: "warn" },
            { label: "Reconciliation status", value: "Pending" },
          ],
          financial: [
            { label: "Invoice value", value: `USD ${(draft.valueUsd ?? 0).toLocaleString()}` },
            { label: "Incoterm", value: draft.incoterm ?? "FOB" },
            { label: "NXP form", value: "Not opened", flag: "warn" },
          ],
          logistics: [
            { label: "Loading port", value: draft.port ?? "-" },
            { label: "Destination", value: draft.destination ?? "-" },
            { label: "Buyer", value: draft.buyer ?? "-" },
            { label: "ETD", value: draft.etd ?? "-" },
          ],
          regulatory: [
            { label: "Beldium record status", value: "Not started" },
            { label: "Mineral export permit", value: "To be supplied", flag: "warn" },
          ],
        },
        documents: [
          {
            id: "D1",
            name: "Commercial Invoice",
            category: "Financial",
            issuer: exporter?.name ?? "Exporter",
            reference: "-",
            issued: now().slice(0, 10),
            status: "pending",
            mandatory: true,
            notes: [],
          },
          {
            id: "D2",
            name: "Packing List",
            category: "Logistics",
            issuer: exporter?.name ?? "Exporter",
            reference: "-",
            issued: now().slice(0, 10),
            status: "pending",
            mandatory: true,
            notes: [],
          },
          {
            id: "D3",
            name: "Independent Assay Certificate",
            category: "Quality",
            issuer: "To be appointed",
            reference: "-",
            issued: "-",
            status: "pending",
            mandatory: true,
            notes: [],
          },
          {
            id: "D4",
            name: "Mineral Export Permit",
            category: "Regulatory",
            issuer: "Mines Inspectorate",
            reference: "-",
            issued: "-",
            status: "pending",
            mandatory: true,
            notes: [],
          },
        ],
        checklist: [
          { id: "C1", label: "Exporter verification current", section: "exporter", state: "open", detail: "To be confirmed by operator." },
          { id: "C2", label: "All mandatory documents verified", section: "documents", state: "open", detail: "0 of 4 verified." },
          { id: "C3", label: "Independent assay on file", section: "quality", state: "open", detail: "Not supplied." },
          { id: "C4", label: "Quantity reconciled to weighbridge", section: "quantity", state: "open", detail: "Not supplied." },
          { id: "C5", label: "Export permit valid through ETD", section: "regulatory", state: "open", detail: "Not supplied." },
        ],
        nonConformities: [],
        audit: [
          { at: now(), actor: actorName, role: actorRole, action: "Shipment submitted", detail: "Created from the exporter portal." },
          { at: now(), actor: "Beldium Engine", role: "system", action: "Risk scored", detail: "Provisional score 45 (medium)." },
        ],
      };
      setState((prev) => ({
        ...prev,
        shipments: [base, ...prev.shipments],
        events: [
          {
            id: `EV-${900 + prev.events.length}`,
            at: now(),
            severity: "info",
            title: "New consignment submitted",
            detail: `${base.reference} submitted by ${exporter?.name ?? "exporter"}, awaiting operator pickup.`,
            shipmentId: base.id,
          },
          ...prev.events,
        ],
      }));
      return id;
    },
    regulatorAction: (shipmentId, action, detail) =>
      patchShipment(shipmentId, (s) => ({ ...s, audit: appendAudit(s, action, detail) })),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
