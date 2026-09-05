import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  APPLICATIONS,
  BATCHES,
  INCIDENTS,
  INCOMING,
  INSPECTIONS,
  MONITORING_ALERTS,
  NON_CONFORMITIES,
  RELEASE_REQUESTS,
  AUDIT_HISTORY,
  type ApplicationSummary,
  type Batch,
  type Incident,
  type IncomingShipment,
  type InspectionRecord,
  type MonitoringAlert,
  type NonConformity,
  type ReleaseRequest,
  type ReviewStatus,
  type RoleId,
} from "./data";


export interface Decision {
  appId: string;
  status: ReviewStatus;
  reason: string;
  decidedAt: string;
  decidedBy: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
}

interface DemoState {
  roleId: RoleId | null;
  signOut: () => void;

  applications: ApplicationSummary[];
  decisions: Record<string, Decision>;
  recordDecision: (appId: string, status: ReviewStatus, reason: string, actor: string) => void;

  nonConformities: NonConformity[];
  addNonConformity: (nc: Omit<NonConformity, "id" | "raised" | "status">, actor: string) => string;

  inspections: InspectionRecord[];
  inspectionRequired: Record<string, { inspector: string; date: string; note: string }>;
  requireInspection: (appId: string, facility: string, inspector: string, date: string, note: string, actor: string) => void;

  alerts: MonitoringAlert[];
  acknowledged: string[];
  acknowledgeAlert: (id: string, actor: string) => void;

  batches: Batch[];
  incoming: IncomingShipment[];
  receiveShipment: (id: string, actualTonnes: number, bay: string, actor: string) => { variance: number; flagged: boolean };

  releases: ReleaseRequest[];
  decideRelease: (id: string, authorise: boolean, reason: string, actor: string) => void;
  createRelease: (r: Omit<ReleaseRequest, "id" | "status" | "requested">, actor: string) => string;

  incidents: Incident[];
  reportIncident: (i: Omit<Incident, "id" | "status">, actor: string) => string;

  audit: AuditEntry[];
}

const DemoContext = createContext<DemoState | null>(null);

const now = () => new Date().toISOString().slice(0, 16).replace("T", " ");
const rid = (p: string) => `${p}-${Math.floor(1000 + Math.random() * 8999)}`;

export function DemoProvider({
  children,
  role,
  onSignOut,
}: {
  children: ReactNode;
  /** Seeded from the shared session, this dashboard no longer signs anyone in. */
  role: RoleId;
  onSignOut: () => void;
}) {
  const roleId = role;
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [nonConformities, setNonConformities] = useState<NonConformity[]>(NON_CONFORMITIES);
  const [inspections, setInspections] = useState<InspectionRecord[]>(INSPECTIONS);
  const [inspectionRequired, setInspectionRequired] = useState<
    Record<string, { inspector: string; date: string; note: string }>
  >({});
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [batches, setBatches] = useState<Batch[]>(BATCHES);
  const [incoming, setIncoming] = useState<IncomingShipment[]>(INCOMING);
  const [releases, setReleases] = useState<ReleaseRequest[]>(RELEASE_REQUESTS);
  const [incidents, setIncidents] = useState<Incident[]>(INCIDENTS);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>(MONITORING_ALERTS);
  const [audit, setAudit] = useState<AuditEntry[]>(AUDIT_HISTORY);

  const log = useCallback((actor: string, action: string, entity: string) => {
    setAudit((prev) => [{ id: rid("AUD"), timestamp: now(), actor, action, entity }, ...prev]);
  }, []);

  const signOut = onSignOut;

  const recordDecision = useCallback(
    (appId: string, status: ReviewStatus, reason: string, actor: string) => {
      setDecisions((prev) => ({
        ...prev,
        [appId]: { appId, status, reason, decidedAt: now(), decidedBy: actor },
      }));
      log(actor, `Recorded decision "${status}" on ${appId}`, appId);
    },
    [log],
  );

  const addNonConformity: DemoState["addNonConformity"] = useCallback(
    (nc, actor) => {
      const id = rid("NC");
      setNonConformities((prev) => [
        { ...nc, id, raised: new Date().toISOString().slice(0, 10), status: "Open" },
        ...prev,
      ]);
      log(actor, `Raised non-conformity ${id} (${nc.severity})`, nc.facility);
      return id;
    },
    [log],
  );

  const requireInspection: DemoState["requireInspection"] = useCallback(
    (appId, facility, inspector, date, note, actor) => {
      setInspectionRequired((prev) => ({ ...prev, [appId]: { inspector, date, note } }));
      const id = rid("INS");
      setInspections((prev) => [
        { id, facility, type: "Pre-registration", inspector: inspector.split(": ")[0] ?? inspector, date, status: "Scheduled", findings: 0 },
        ...prev,
      ]);
      log(actor, `Ordered physical inspection ${id}, assigned to ${inspector}`, appId);
    },
    [log],
  );

  const acknowledgeAlert = useCallback(
    (id: string, actor: string) => {
      setAcknowledged((prev) => (prev.includes(id) ? prev : [...prev, id]));
      log(actor, `Acknowledged monitoring alert ${id}`, id);
    },
    [log],
  );

  const receiveShipment: DemoState["receiveShipment"] = useCallback(
    (id, actualTonnes, bay, actor) => {
      const ship = incoming.find((s) => s.id === id);
      const expected = ship ? parseFloat(ship.expected) : actualTonnes;
      const variance = expected ? ((actualTonnes - expected) / expected) * 100 : 0;
      const flagged = Math.abs(variance) > 0.5;
      const batchId = `SM-RC-${Math.floor(1000 + Math.random() * 8999)}`;
      setBatches((prev) => [
        {
          id: batchId,
          commodity: ship?.commodity ?? "Mineral consignment",
          origin: ship?.supplier ?? "Unknown supplier",
          location: bay,
          tonnes: actualTonnes,
          grade: "Assay pending",
          received: new Date().toISOString().slice(0, 10),
          status: flagged ? "Quarantine" : "Available",
          owner: "Sahel Minerals (own stock)",
        },
        ...prev,
      ]);
      setIncoming((prev) => prev.filter((s) => s.id !== id));
      log(
        actor,
        `Received ${id} as batch ${batchId} (${actualTonnes} t, variance ${variance.toFixed(2)}%)`,
        batchId,
      );
      if (flagged) {
        setAlerts((prev) => [
          {
            id: rid("ALR"),
            facility: "Apapa Mineral Terminal, Block B",
            message: `Weight variance ${variance.toFixed(2)}% on inbound ${id} (tolerance 0.5%)`,
            severity: "warning",
            raised: now(),
            source: "Weighbridge reconciliation",
          },
          ...prev,
        ]);
      }
      return { variance, flagged };
    },
    [incoming, log],
  );

  const decideRelease: DemoState["decideRelease"] = useCallback(
    (id, authorise, reason, actor) => {
      setReleases((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: authorise ? "Authorised" : "Declined", reason } : r,
        ),
      );
      log(actor, `${authorise ? "Authorised" : "Declined"} release ${id}`, id);
    },
    [log],
  );

  const createRelease: DemoState["createRelease"] = useCallback(
    (r, actor) => {
      const id = rid("REL");
      setReleases((prev) => [{ ...r, id, status: "Pending authorisation", requested: now() }, ...prev]);
      log(actor, `Created release request ${id} for batch ${r.batch}`, id);
      return id;
    },
    [log],
  );

  const reportIncident: DemoState["reportIncident"] = useCallback(
    (i, actor) => {
      const id = rid("INC");
      setIncidents((prev) => [{ ...i, id, status: "Open" }, ...prev]);
      log(actor, `Reported ${i.severity.toLowerCase()}-severity incident ${id}`, id);
      return id;
    },
    [log],
  );

  const applications = useMemo(
    () =>
      APPLICATIONS.map((a) => {
        const d = decisions[a.id];
        return d ? { ...a, status: d.status } : a;
      }),
    [decisions],
  );

  const value: DemoState = {
    roleId,
    signOut,
    applications,
    decisions,
    recordDecision,
    nonConformities,
    addNonConformity,
    inspections,
    inspectionRequired,
    requireInspection,
    alerts,
    acknowledged,
    acknowledgeAlert,
    batches,
    incoming,
    receiveShipment,
    releases,
    decideRelease,
    createRelease,
    incidents,
    reportIncident,
    audit,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}
