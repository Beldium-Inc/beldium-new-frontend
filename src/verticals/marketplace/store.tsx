import { createContext, useContext, useMemo, type ReactNode } from "react";

import { ApiError } from "@/lib/api/errors";
import type * as Api from "@/lib/api/marketplace";
import {
  useAcceptRfqAggregation,
  useAddNonConformity,
  useAdvanceNonConformity,
  useAutoAggregateRfq,
  useCreateRfq,
  useDecideMarketplaceApplication,
  useDispatchRfqNotifications,
  useMarketplaceApplications,
  useMarketplaceNotifications,
  useMarketplaceOrders,
  useMarkMarketplaceNotificationRead,
  useMiners,
  useRfqs,
  useSaveRfqServices,
  useSetRfqAllocation,
  useSubmitRfqFinance,
  useUpdateApplicationLimits,
} from "@/lib/api/marketplace-queries";
import { useCurrentUser } from "@/lib/api/queries";
import {
  type AppStatus,
  type Application,
  type ApplicantType,
  type FinancePackage,
  type Miner,
  type Notification,
  type NonConformity,
  type OrderRow,
  type Rfq,
  type Role,
  type TransactionServices,
} from "./demo-data";

export const ROLE_LABEL: Record<Role, string> = {
  operator: "Compliance Operator",
  buyer: "Buyer",
  offtaker: "Offtaker",
  oem: "OEM",
};

export const ROLE_PERSONA: Record<Role, { name: string; org: string }> = {
  operator: { name: "A. Mensah", org: "Beldium Compliance Desk" },
  buyer: { name: "M. Chandra", org: "Coastal Bulk Buyers Pte Ltd" },
  offtaker: { name: "C. Béraud", org: "Meridian Offtake Partners SA" },
  oem: { name: "E. Sandberg", org: "Nordvolt Energy AB" },
};

export type OperatorAction = "verify" | "reject" | "request_info" | "flag" | "escalate";

type State = {
  role: Role | null;
  applications: Application[];
  miners: Miner[];
  rfqs: Rfq[];
  orders: OrderRow[];
  notifications: Notification[];
};

type Ctx = {
  state: State;
  hydrated: boolean;
  logout: () => void;
  applyOperatorAction: (id: string, action: OperatorAction, note: string) => void;
  updateLimits: (id: string, single: number, monthly: number) => void;
  addNonConformity: (
    id: string,
    title: string,
    severity: "Minor" | "Major" | "Critical",
    note: string,
  ) => void;
  advanceNonConformity: (appId: string, ncId: string) => void;
  createRfq: (input: {
    commodity: string;
    grade: string;
    volumeTonnes: number;
    incoterm: string;
    destination: string;
    deliveryWindow: string;
    targetPriceUsd: number;
  }) => Promise<string>;
  autoAggregate: (rfqId: string) => void;
  toggleAllocation: (rfqId: string, minerId: string) => void;
  setAllocationTonnes: (rfqId: string, minerId: string, tonnes: number) => void;
  dispatchNotifications: (rfqId: string) => void;
  acceptAggregation: (rfqId: string) => void;
  saveServices: (rfqId: string, services: TransactionServices) => void;
  submitFinance: (rfqId: string, pkg: FinancePackage) => void;
  markAllRead: () => void;

  error: ApiError | null;
};

const DemoContext = createContext<Ctx | null>(null);

const EMPTY_LIST = { results: [] };

// --- API row -> view shape adapters ------------------------------------------

const APPLICANT_TYPE: Record<Api.ApplicantType, ApplicantType> = {
  buyer: "Buyer",
  offtaker: "Offtaker",
  oem: "OEM",
};

const RISK_BAND: Record<Api.MarketplaceApplication["risk_band"], Application["riskBand"]> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const NC_SEVERITY: Record<Api.MarketplaceNonConformity["severity"], NonConformity["severity"]> = {
  minor: "Minor",
  major: "Major",
  critical: "Critical",
};

function toDocItem(row: Api.MarketplaceDocument): Application["documents"][number] {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    uploadedAt: row.uploaded_at,
    status: row.status,
    ...(row.expires_on ? { expires: row.expires_on } : {}),
  };
}

function toNonConformity(row: Api.MarketplaceNonConformity): NonConformity {
  return {
    id: row.id,
    title: row.title,
    severity: NC_SEVERITY[row.severity],
    raisedAt: row.raised_at,
    status: row.status,
    note: row.note,
  };
}

function toApplication(row: Api.MarketplaceApplication): Application {
  return {
    id: row.id,
    entityName: row.entity_name,
    type: APPLICANT_TYPE[row.applicant_type],
    country: row.country,
    jurisdiction: row.jurisdiction,
    registrationNo: row.registration_no,
    vatNo: row.vat_no,
    incorporated: row.incorporated_on ?? "",
    website: row.website,
    submittedAt: row.submitted_at ?? "",
    status: row.status as AppStatus,
    riskScore: row.risk_score,
    riskBand: RISK_BAND[row.risk_band],
    riskFactors: row.risk_factors,
    sanctionsScreen: row.sanctions_screen,
    pepScreen: row.pep_screen,
    ownership: row.ownership.map((o) => ({
      name: o.name,
      pct: o.pct,
      type: o.type,
      country: o.country,
      pep: o.pep,
    })),
    reps: row.representatives.map((r) => ({
      name: r.name,
      role: r.role,
      email: r.email,
      phone: r.phone,
      idVerified: r.id_verified,
    })),
    profile: {
      headline: row.profile.headline,
      commodities: row.profile.commodities,
      ...(row.profile.annual_demand_tonnes !== undefined
        ? { annualDemandTonnes: row.profile.annual_demand_tonnes }
        : {}),
      ...(row.profile.annual_supply_tonnes !== undefined
        ? { annualSupplyTonnes: row.profile.annual_supply_tonnes }
        : {}),
      markets: row.profile.markets,
      yearsTrading: row.profile.years_trading,
      turnoverUsd: row.profile.turnover_usd,
      banking: row.profile.banking,
      logistics: row.profile.logistics,
    },
    documents: row.documents.map(toDocItem),
    limits: {
      proposedSingleTxnUsd: row.limits.proposed_single_txn_usd,
      proposedMonthlyUsd: row.limits.proposed_monthly_usd,
      approvedSingleTxnUsd: row.limits.approved_single_txn_usd,
      approvedMonthlyUsd: row.limits.approved_monthly_usd,
      tenorDays: row.limits.tenor_days,
    },
    nonConformities: row.non_conformities.map(toNonConformity),
    audit: row.audit.map((a) => ({
      id: a.id,
      at: a.at,
      actor: a.actor,
      action: a.action,
      detail: a.detail,
    })),
    notes: row.notes,
  };
}

function toMiner(row: Api.Miner): Miner {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    region: row.region,
    commodity: row.commodity,
    capacityTpa: row.capacity_tpa,
    availableTonnes: row.available_tonnes,
    grade: row.grade,
    compliance: row.compliance,
    esgScore: row.esg_score,
    logistics: row.logistics,
    channels: row.channels,
    phone: row.phone,
    email: row.email,
  };
}

function toRfq(row: Api.Rfq): Rfq {
  return {
    id: row.id,
    reference: row.reference,
    commodity: row.commodity,
    grade: row.grade,
    volumeTonnes: row.volume_tonnes,
    incoterm: row.incoterm,
    destination: row.destination,
    deliveryWindow: row.delivery_window,
    targetPriceUsd: row.target_price_usd,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    status: row.status,
    allocations: row.allocations.map((a) => ({
      minerId: a.miner,
      tonnes: a.tonnes,
      state: a.state,
      priceUsdPerTonne: a.price_usd_per_tonne,
    })),
    notifications: row.notifications.map((n) => ({
      id: n.id,
      minerId: n.miner,
      minerName: "",
      channel: n.channel,
      status: n.status,
      at: n.at,
      preview: n.preview,
    })),
    ...(row.services ? { services: row.services } : {}),
    ...(row.finance
      ? {
          finance: {
            totalCommitmentUsd: row.finance.total_commitment_usd,
            buyerContributionUsd: row.finance.buyer_contribution_usd,
            requiredUsd: row.finance.required_usd,
            instrument: row.finance.instrument,
            tenorMonths: row.finance.tenor_months,
            status: row.finance.status,
            readiness: row.finance.readiness,
          },
        }
      : {}),
  };
}

function toOrderRow(row: Api.MarketplaceOrder): OrderRow {
  const stage: OrderRow["stage"] =
    row.stage === "contract_drafting"
      ? "contract drafting"
      : row.stage === "in_transit"
        ? "in transit"
        : row.stage;
  return {
    id: row.id,
    reference: row.reference,
    counterparty: row.counterparty,
    commodity: row.commodity,
    tonnes: row.tonnes,
    valueUsd: row.value_usd,
    stage,
    updatedAt: row.updated_at,
  };
}

function toNotification(row: Api.MarketplaceNotification): Notification {
  return {
    id: row.id,
    audience: row.audience,
    title: row.title,
    body: row.body,
    channel: row.channel,
    at: row.at,
    read: Boolean(row.read_at),
  };
}

export function DemoProvider({
  children,
  role,
  onSignOut,
}: {
  children: ReactNode;
  /** Seeded from the shared session, this dashboard no longer signs anyone in. */
  role: Role;
  onSignOut: () => void;
}) {
  const currentUser = useCurrentUser();
  const applicationsQuery = useMarketplaceApplications();
  const minersQuery = useMiners();
  const rfqsQuery = useRfqs();
  const ordersQuery = useMarketplaceOrders();
  const notificationsQuery = useMarketplaceNotifications();

  const decideFor = useDecideMarketplaceApplication();
  const updateLimitsFor = useUpdateApplicationLimits();
  const addNonConformityFor = useAddNonConformity();
  const advanceNonConformityFor = useAdvanceNonConformity();
  const createRfqFor = useCreateRfq();
  const autoAggregateFor = useAutoAggregateRfq();
  const setAllocationFor = useSetRfqAllocation();
  const dispatchFor = useDispatchRfqNotifications();
  const acceptAggregationFor = useAcceptRfqAggregation();
  const saveServicesFor = useSaveRfqServices();
  const submitFinanceFor = useSubmitRfqFinance();
  const markReadFor = useMarkMarketplaceNotificationRead();

  const applicationsRaw = (applicationsQuery.data ?? EMPTY_LIST).results;
  const minersRaw = (minersQuery.data ?? EMPTY_LIST).results;
  const rfqsRaw = (rfqsQuery.data ?? EMPTY_LIST).results;
  const ordersRaw = (ordersQuery.data ?? EMPTY_LIST).results;
  const notificationsRaw = (notificationsQuery.data ?? EMPTY_LIST).results;

  const applications = useMemo(() => applicationsRaw.map(toApplication), [applicationsRaw]);
  const miners = useMemo(() => minersRaw.map(toMiner), [minersRaw]);
  const rfqs = useMemo(() => rfqsRaw.map(toRfq), [rfqsRaw]);
  const orders = useMemo(() => ordersRaw.map(toOrderRow), [ordersRaw]);
  const notifications = useMemo(() => notificationsRaw.map(toNotification), [notificationsRaw]);

  const queries = [
    currentUser,
    applicationsQuery,
    minersQuery,
    rfqsQuery,
    ordersQuery,
    notificationsQuery,
  ];
  const isLoading = queries.some((q) => q.isPending);
  const firstError = queries.map((q) => q.error).find(Boolean) ?? null;

  const state: State = { role, applications, miners, rfqs, orders, notifications };

  const value: Ctx = {
    state,
    hydrated: !isLoading,
    logout: onSignOut,

    applyOperatorAction: (id, action, note) => {
      void decideFor.mutateAsync({ id, action, note });
    },

    updateLimits: (id, single, monthly) => {
      void updateLimitsFor.mutateAsync({ id, single, monthly });
    },

    addNonConformity: (id, title, severity, note) => {
      const apiSeverity =
        severity === "Minor" ? "minor" : severity === "Major" ? "major" : "critical";
      void addNonConformityFor.mutateAsync({ id, title, severity: apiSeverity, note });
    },

    advanceNonConformity: (appId, ncId) => {
      void advanceNonConformityFor.mutateAsync({ id: appId, ncId });
    },

    createRfq: async (input) => {
      const rfq = await createRfqFor.mutateAsync({
        commodity: input.commodity,
        grade: input.grade,
        volume_tonnes: input.volumeTonnes,
        incoterm: input.incoterm,
        destination: input.destination,
        delivery_window: input.deliveryWindow,
        target_price_usd: input.targetPriceUsd,
      });
      return rfq.id;
    },

    autoAggregate: (rfqId) => {
      void autoAggregateFor.mutateAsync(rfqId);
    },

    toggleAllocation: (rfqId, minerId) => {
      const rfq = rfqsRaw.find((r) => r.id === rfqId);
      const current = rfq?.allocations.find((a) => a.miner === minerId);
      const nextState = current?.state === "accepted" ? "offered" : "accepted";
      void setAllocationFor.mutateAsync({ id: rfqId, miner: minerId, state: nextState });
    },

    setAllocationTonnes: (rfqId, minerId, tonnes) => {
      void setAllocationFor.mutateAsync({ id: rfqId, miner: minerId, tonnes });
    },

    dispatchNotifications: (rfqId) => {
      void dispatchFor.mutateAsync(rfqId);
    },

    acceptAggregation: (rfqId) => {
      void acceptAggregationFor.mutateAsync(rfqId);
    },

    saveServices: (rfqId, services) => {
      void saveServicesFor.mutateAsync({ id: rfqId, services });
    },

    submitFinance: (rfqId, pkg) => {
      void submitFinanceFor.mutateAsync({
        id: rfqId,
        pkg: {
          total_commitment_usd: pkg.totalCommitmentUsd,
          buyer_contribution_usd: pkg.buyerContributionUsd,
          required_usd: pkg.requiredUsd,
          instrument: pkg.instrument,
          tenor_months: pkg.tenorMonths,
          status: pkg.status,
          readiness: pkg.readiness,
        },
      });
    },

    markAllRead: () => {
      for (const row of notificationsRaw) {
        if (!row.read_at) void markReadFor.mutateAsync(row.id);
      }
    },

    error: firstError instanceof ApiError ? firstError : null,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}

export const fmtUsd = (n: number) =>
  n >= 1e9
    ? `$${(n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 1)}bn`
    : n >= 1e6
      ? `$${(n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1)}m`
      : n >= 1e3
        ? `$${(n / 1e3).toFixed(0)}k`
        : `$${n}`;

export const fmtTonnes = (n: number) => `${n.toLocaleString("en-US")} t`;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
