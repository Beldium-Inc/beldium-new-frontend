import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  LIFECYCLE_STAGES,
  ecosystemSeed,
  stageIndexOf,
  stageLabel,
  type MaterialBatch,
  type StageId,
} from "./ecosystem-data";
import {
  emptyApplication,
  operationalSeed,
  seedEquipment,
  seedSites,
  seedState,
  submittedActivity,
  type Account,
  type ApplicationData,
  type CorrectiveAction,
  type InformationRequest,
  type MinerState,
  type OrgStatus,
} from "./miner-data";

const STORAGE_KEY = "beldium-miner-hub:v1";

type Ctx = {
  state: MinerState;
  hydrated: boolean;
  update: (fn: (draft: MinerState) => MinerState) => void;
  reset: () => void;
  registerAccount: (a: Omit<Account, "emailVerified" | "phoneVerified">) => void;
  verifyEmail: () => void;
  verifyPhone: () => void;
  signIn: (email: string) => void;
  signOut: () => void;
  saveApplication: (fn: (draft: ApplicationData) => ApplicationData) => void;
  submitApplication: () => void;
  setOrgStatus: (s: OrgStatus) => void;
  answerRequest: (id: string, note: string, fileName: string | null) => void;
  addActionEvidence: (id: string, note: string, fileName: string | null) => void;
  updateAction: (id: string, patch: Partial<CorrectiveAction>) => void;
  updateApplication: (fn: (draft: ApplicationData) => ApplicationData) => void;
  updateAccount: (patch: Partial<Account>) => void;
  markNotificationsRead: () => void;
  setActionStatus: (id: string, status: CorrectiveAction["status"]) => void;
  resetAll: () => void;
  acceptRfq: (rfqId: string, quantity: number) => void;
  declineRfq: (rfqId: string) => void;
  allocateBatch: (transactionId: string, batchId: string) => void;
  advanceTransaction: (transactionId: string) => void;
  recordSettlement: (transactionId: string) => void;
};


function stamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function applyStageEffects(
  tx: MinerState["transactions"][number],
  stage: StageId,
  at: string,
  batches: MaterialBatch[],
) {
  const own = batches.filter((b) => b.transactionId === tx.id);
  const setBatchStage = (s: MaterialBatch["stage"], location: string) =>
    own.forEach((b) => {
      b.stage = s;
      b.location = location;
      b.updatedAt = at;
    });

  switch (stage) {
    case "sample_requested":
      tx.sample.requestedAt = at;
      tx.sample.status = "requested";
      break;
    case "sample_logistics":
      tx.logistics = [
        ...tx.logistics,
        {
          id: `mv-${tx.id}-s`,
          kind: "sample",
          carrier: "SwiftLab Couriers",
          vehicle: "LC-0001",
          driver: "Assigned courier",
          from: "Mine site",
          to: tx.sample.laboratory,
          tonnes: 0.05,
          assignedAt: at,
          pickedUpAt: null,
          arrivedAt: null,
          status: "assigned",
        },
      ];
      break;
    case "sample_collected":
      tx.sample.collectedAt = at;
      tx.sample.status = "in_transit";
      tx.logistics = tx.logistics.map((m) => (m.kind === "sample" ? { ...m, pickedUpAt: at, status: "in_transit" } : m));
      break;
    case "lab_received":
      tx.sample.labReceivedAt = at;
      tx.sample.status = "at_lab";
      tx.logistics = tx.logistics.map((m) => (m.kind === "sample" ? { ...m, arrivedAt: at, status: "delivered" } : m));
      break;
    case "testing":
      tx.sample.status = "testing";
      break;
    case "results_published":
      tx.sample.status = "published";
      tx.sample.publishedAt = at;
      tx.sample.resultGrade = tx.sample.resultGrade ?? Number((own[0]?.grade ?? 23).toFixed(2));
      tx.sample.moisture = tx.sample.moisture ?? 6.4;
      break;
    case "buyer_quality_acceptance":
      tx.sample.status = "accepted";
      tx.sample.buyerAcceptedAt = at;
      break;
    case "bulk_logistics":
      tx.logistics = [
        ...tx.logistics,
        {
          id: `mv-${tx.id}-b`,
          kind: "bulk",
          carrier: "TransZam Bulk Haulage",
          vehicle: "Assigned convoy",
          driver: "Lead driver",
          from: "Mine site",
          to: tx.warehouse?.facility ?? "Consolidation warehouse",
          tonnes: tx.aggregatedTonnes,
          assignedAt: at,
          pickedUpAt: null,
          arrivedAt: null,
          status: "assigned",
        },
      ];
      break;
    case "material_picked_up":
      tx.logistics = tx.logistics.map((m) => (m.kind === "bulk" ? { ...m, pickedUpAt: at, status: "in_transit" } : m));
      break;
    case "in_transit":
      setBatchStage("in_transit", "In transit to warehouse");
      break;
    case "warehouse_received":
      tx.warehouse = {
        facility: tx.warehouse?.facility ?? "Kapiri Consolidation Warehouse",
        lot: tx.warehouse?.lot ?? `LOT-${tx.reference.slice(-4)}`,
        receivedAt: at,
        tonnesReceived: tx.aggregatedTonnes,
      };
      tx.logistics = tx.logistics.map((m) => (m.kind === "bulk" ? { ...m, arrivedAt: at, status: "delivered" } : m));
      setBatchStage("warehouse", tx.warehouse.facility);
      break;
    case "processing_started":
      tx.processing = {
        facility: tx.processing?.facility ?? "Kapiri Concentrator",
        method: tx.processing?.method ?? "Flotation",
        startedAt: at,
        completedAt: null,
        inputTonnes: tx.warehouse?.tonnesReceived ?? tx.aggregatedTonnes,
        outputTonnes: null,
        recovery: null,
        postGrade: null,
      };
      setBatchStage("processing", tx.processing.facility);
      break;
    case "processing_completed":
      if (tx.processing) tx.processing.completedAt = at;
      break;
    case "output_recorded":
      if (tx.processing) {
        tx.processing.outputTonnes = Math.round(tx.processing.inputTonnes * 0.96);
        tx.processing.recovery = 92.4;
      }
      break;
    case "post_processing_quality":
      if (tx.processing) tx.processing.postGrade = tx.sample.resultGrade ?? 23;
      break;
    case "export_compliance":
      tx.exportRecord.complianceStatus = "in_review";
      break;
    case "export_ready":
      tx.exportRecord.complianceStatus = "cleared";
      tx.exportRecord.readyAt = at;
      setBatchStage("export_ready", `${tx.exportRecord.port} - bonded bay`);
      break;
    case "shipped":
      tx.exportRecord.shippedAt = at;
      tx.exportRecord.vessel = tx.exportRecord.vessel === "TBC" ? "MV Beldium Carrier" : tx.exportRecord.vessel;
      setBatchStage("shipped", `Vessel to ${tx.destination}`);
      break;
    case "buyer_destination":
      tx.payment.status = "pending";
      break;
    case "delivered":
      tx.exportRecord.deliveredAt = at;
      setBatchStage("delivered", `${tx.destination} - delivered to buyer`);
      break;
    case "payment_settlement":
      tx.payment.status = "paid";
      tx.payment.paidAt = at;
      break;
    default:
      break;
  }
}

const MinerContext = createContext<Ctx | null>(null);

function load(): MinerState {
  if (typeof window === "undefined") return seedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    return { ...seedState(), ...(JSON.parse(raw) as MinerState) };
  } catch {
    return seedState();
  }
}

export function MinerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MinerState>(() => seedState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const update = useCallback((fn: (draft: MinerState) => MinerState) => {
    setState((prev) => fn(structuredClone(prev)));
  }, []);

  const value = useMemo<Ctx>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      state,
      hydrated,
      update,
      reset: () => {
        window.localStorage.removeItem(STORAGE_KEY);
        setState(seedState());
      },
      registerAccount: (a) =>
        update((d) => {
          d.account = { ...a, emailVerified: false, phoneVerified: false };
          d.application = emptyApplication(a.organisationName);
          d.orgStatus = "draft";
          return d;
        }),
      verifyEmail: () =>
        update((d) => {
          if (d.account) d.account.emailVerified = true;
          return d;
        }),
      verifyPhone: () =>
        update((d) => {
          if (d.account) d.account.phoneVerified = true;
          return d;
        }),
      signIn: (email) =>
        update((d) => {
          const fresh = !d.account;
          if (fresh) {
            d.account = {
              fullName: "Demo Miner",
              email,
              phone: "+260 97 000 0000",
              role: "org_admin",
              organisationName: "Zambezi Minerals Ltd",
              emailVerified: true,
              phoneVerified: true,
            };
          }
          if (fresh) {
            // Demo sign-in lands on a populated organisation that is already under review.
            d.orgStatus = "under_review";
            d.application = { ...d.application, sites: seedSites, equipment: seedEquipment };
            const ops = operationalSeed();
            d.production = ops.production;
            d.inventory = ops.inventory;
            d.compliance = ops.compliance;
            d.correctiveActions = ops.correctiveActions;
            d.members = ops.members.map((m) =>
              m.id === "m1" ? { ...m, name: d.account?.fullName || "You", email: d.account?.email || "" } : m,
            );
            d.informationRequests = ops.informationRequests;
            d.notifications = ops.notifications;
            const eco = ecosystemSeed();
            d.rfqs = eco.rfqs;
            d.transactions = eco.transactions;
            d.batches = eco.batches;
            d.ecosystemEvents = eco.ecosystemEvents;
            d.activity = submittedActivity(d.account?.organisationName || "Your organisation");
          }
          d.signedIn = true;
          return d;
        }),
      signOut: () =>
        update((d) => {
          d.signedIn = false;
          return d;
        }),
      saveApplication: (fn) =>
        update((d) => {
          d.application = fn(d.application);
          return d;
        }),
      submitApplication: () =>
        update((d) => {
          const orgName = d.application.org.legalName || d.account?.organisationName || "Your organisation";
          d.orgStatus = "under_review";
          d.application.declaration.signedOn = today;
          if (d.application.sites.length === 0) d.application.sites = seedSites;
          if (d.application.equipment.length === 0) d.application.equipment = seedEquipment;
          const ops = operationalSeed();
          d.production = ops.production;
          d.inventory = ops.inventory;
          d.compliance = ops.compliance;
          d.correctiveActions = ops.correctiveActions;
          d.members = ops.members.map((m) =>
            m.id === "m1" ? { ...m, name: d.account?.fullName || "You", email: d.account?.email || "" } : m,
          );
          d.informationRequests = ops.informationRequests;
          d.notifications = ops.notifications;
          const eco = ecosystemSeed();
          d.rfqs = eco.rfqs;
          d.transactions = eco.transactions;
          d.batches = eco.batches;
          d.ecosystemEvents = eco.ecosystemEvents;
          d.activity = submittedActivity(orgName);
          d.signedIn = false;
          return d;
        }),
      setOrgStatus: (s) =>
        update((d) => {
          d.orgStatus = s;
          if (s === "verified") {
            d.timeline = d.timeline.map((t) => ({ ...t, state: "complete", at: t.at ?? today }));
            d.activity = [
              { id: `a-${Date.now()}`, at: today, actor: "Beldium review team", message: "Verification approved - full miner access granted.", kind: "review" },
              ...d.activity,
            ];
          }
          return d;
        }),
      answerRequest: (id, note, fileName) =>
        update((d) => {
          d.informationRequests = d.informationRequests.map((r: InformationRequest) =>
            r.id === id
              ? {
                  ...r,
                  status: "answered",
                  responses: [...r.responses, { id: `res-${Date.now()}`, at: today, note, fileName }],
                }
              : r,
          );
          d.activity = [
            { id: `a-${Date.now()}`, at: today, actor: d.account?.fullName || "You", message: `Evidence submitted for ${d.informationRequests.find((r) => r.id === id)?.reference ?? "request"}.`, kind: "response" },
            ...d.activity,
          ];
          return d;
        }),
      addActionEvidence: (id, note, fileName) =>
        update((d) => {
          d.correctiveActions = d.correctiveActions.map((a) =>
            a.id === id
              ? { ...a, status: "submitted", evidence: [...a.evidence, { id: `ev-${Date.now()}`, at: today, note, fileName }] }
              : a,
          );
          return d;
        }),
      updateApplication: (fn) =>
        update((d) => {
          d.application = fn(d.application);
          return d;
        }),
      updateAccount: (patch) =>
        update((d) => {
          if (d.account) d.account = { ...d.account, ...patch };
          return d;
        }),
      markNotificationsRead: () =>
        update((d) => {
          d.notifications = d.notifications.map((n) => ({ ...n, read: true }));
          return d;
        }),
      setActionStatus: (id, status) =>
        update((d) => {
          d.correctiveActions = d.correctiveActions.map((a) => (a.id === id ? { ...a, status } : a));
          return d;
        }),
      resetAll: () => {
        window.localStorage.removeItem(STORAGE_KEY);
        setState(seedState());
      },
      acceptRfq: (rfqId, quantity) =>
        update((d) => {
          const rfq = d.rfqs.find((r) => r.id === rfqId);
          if (!rfq || rfq.status !== "open") return d;
          const qty = Math.max(1, Math.min(quantity, rfq.quantityRequested));
          rfq.status = qty < rfq.quantityRequested ? "partially_accepted" : "accepted";
          rfq.committedQuantity = qty;
          rfq.decidedAt = stamp();
          const seq = 4600 + d.transactions.length;
          d.transactions = [
            {
              id: `tx-${seq}`,
              reference: `TX-2026-${seq}`,
              rfqId: rfq.id,
              buyer: rfq.buyer,
              buyerCountry: rfq.buyerCountry,
              mineral: rfq.mineral,
              gradeSpec: rfq.gradeSpec,
              committedTonnes: qty,
              aggregatedTonnes: 0,
              unitPriceUsd: rfq.indicativePriceUsd,
              incoterm: rfq.incoterm,
              destination: rfq.destination,
              createdAt: stamp(),
              stage: "accepted",
              stageLog: { rfq_received: rfq.receivedAt, accepted: stamp() },
              batchIds: [],
              sample: {
                reference: `SMP-${seq}-A`,
                laboratory: "Ndola Assay Laboratories",
                requestedAt: null,
                collectedAt: null,
                labReceivedAt: null,
                resultGrade: null,
                moisture: null,
                publishedAt: null,
                buyerAcceptedAt: null,
                status: "requested",
              },
              logistics: [],
              warehouse: null,
              processing: null,
              exportRecord: {
                permitRef: `EXP-2026-${1200 + d.transactions.length}`,
                complianceStatus: "not_started",
                readyAt: null,
                port: rfq.incoterm.replace(/^\w+\s/, ""),
                vessel: "TBC",
                shippedAt: null,
                eta: null,
                deliveredAt: null,
              },
              payment: {
                invoiceRef: `INV-${seq}`,
                amountUsd: qty * rfq.indicativePriceUsd,
                advancePct: 30,
                dueAt: rfq.respondBy,
                paidAt: null,
                status: "not_due",
              },
            },
            ...d.transactions,
          ];
          d.ecosystemEvents = [
            {
              id: `ev-${Date.now()}`,
              at: stamp(),
              domain: "marketplace",
              message: `${rfq.status === "accepted" ? "Accepted" : "Partially accepted"} ${rfq.reference} - ${qty.toLocaleString("en-US")} t committed to ${rfq.buyer}.`,
              reference: `TX-2026-${seq}`,
            },
            ...d.ecosystemEvents,
          ];
          return d;
        }),
      declineRfq: (rfqId) =>
        update((d) => {
          const rfq = d.rfqs.find((r) => r.id === rfqId);
          if (!rfq) return d;
          rfq.status = "declined";
          rfq.decidedAt = stamp();
          d.ecosystemEvents = [
            { id: `ev-${Date.now()}`, at: stamp(), domain: "marketplace", message: `Declined ${rfq.reference} from ${rfq.buyer}.`, reference: rfq.reference },
            ...d.ecosystemEvents,
          ];
          return d;
        }),
      allocateBatch: (transactionId, batchId) =>
        update((d) => {
          const tx = d.transactions.find((x) => x.id === transactionId);
          const batch = d.batches.find((b) => b.id === batchId);
          if (!tx || !batch || batch.transactionId) return d;
          batch.transactionId = tx.id;
          batch.stage = "allocated";
          batch.updatedAt = stamp();
          tx.batchIds = [...tx.batchIds, batch.id];
          tx.aggregatedTonnes = Math.min(tx.committedTonnes, tx.aggregatedTonnes + batch.tonnes);
          if (stageIndexOf(tx.stage) < stageIndexOf("aggregation")) {
            tx.stage = "aggregation";
            tx.stageLog.aggregation = stamp();
          }
          d.ecosystemEvents = [
            { id: `ev-${Date.now()}`, at: stamp(), domain: "marketplace", message: `${batch.reference} (${batch.tonnes.toLocaleString("en-US")} t) aggregated against ${tx.reference}.`, reference: tx.reference },
            ...d.ecosystemEvents,
          ];
          return d;
        }),
      advanceTransaction: (transactionId) =>
        update((d) => {
          const tx = d.transactions.find((x) => x.id === transactionId);
          if (!tx) return d;
          const next = LIFECYCLE_STAGES[stageIndexOf(tx.stage) + 1];
          if (!next) return d;
          const at = stamp();
          tx.stage = next.id as StageId;
          tx.stageLog[next.id as StageId] = at;
          applyStageEffects(tx, next.id as StageId, at, d.batches);
          d.ecosystemEvents = [
            { id: `ev-${Date.now()}`, at, domain: next.domain, message: `${stageLabel(next.id as StageId)} recorded for ${tx.reference} (${tx.buyer}).`, reference: tx.reference },
            ...d.ecosystemEvents,
          ];
          return d;
        }),
      recordSettlement: (transactionId) =>
        update((d) => {
          const tx = d.transactions.find((x) => x.id === transactionId);
          if (!tx) return d;
          tx.payment.status = "paid";
          tx.payment.paidAt = stamp();
          tx.stage = "payment_settlement";
          tx.stageLog.payment_settlement = stamp();
          d.ecosystemEvents = [
            { id: `ev-${Date.now()}`, at: stamp(), domain: "finance", message: `Settlement recorded for ${tx.payment.invoiceRef} (USD ${Math.round(tx.payment.amountUsd).toLocaleString("en-US")}).`, reference: tx.reference },
            ...d.ecosystemEvents,
          ];
          return d;
        }),
      updateAction: (id, patch) =>
        update((d) => {
          d.correctiveActions = d.correctiveActions.map((a) => (a.id === id ? { ...a, ...patch } : a));
          return d;
        }),
    };
  }, [state, hydrated, update]);

  return <MinerContext.Provider value={value}>{children}</MinerContext.Provider>;
}

export function useMiner() {
  const ctx = useContext(MinerContext);
  if (!ctx) throw new Error("useMiner must be used inside MinerProvider");
  return ctx;
}
