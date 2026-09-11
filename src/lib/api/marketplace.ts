import { apiFetch } from "./client";
import type { Paginated, UUID } from "./types";

// The Marketplace register: offtaker/buyer/OEM onboarding applications, the
// miner directory, RFQs and their aggregation workflow, orders and the
// notification feed. Mirrors `beldium-backend/marketplace/serializers.py`
// field-for-field, so the shapes below are the backend's, not a re-spelling.

const BASE = "/marketplace";

export type MarketplaceRole = "operator" | "buyer" | "offtaker" | "oem";

export type ApplicantType = "buyer" | "offtaker" | "oem";

export type MarketplaceApplicationStatus =
  | "pending"
  | "under_review"
  | "info_requested"
  | "flagged"
  | "escalated"
  | "verified"
  | "restricted"
  | "rejected";

export type ScreenResult = "clear" | "review" | "hit";

export interface MarketplaceListQuery {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface MarketplaceRiskFactor {
  label: string;
  weight: number;
  note: string;
}

export interface OwnershipEntry {
  name: string;
  pct: number;
  type: string;
  country: string;
  pep: boolean;
}

export interface Representative {
  name: string;
  role: string;
  email: string;
  phone: string;
  id_verified: boolean;
}

export interface ApplicationProfile {
  headline: string;
  commodities: string[];
  annual_demand_tonnes?: number;
  annual_supply_tonnes?: number;
  markets: string[];
  years_trading: number;
  turnover_usd: number;
  banking: string;
  logistics: string;
}

export type MarketplaceDocumentStatus = "verified" | "pending" | "expired";

export interface MarketplaceDocument {
  id: UUID;
  name: string;
  kind: string;
  uploaded_at: string;
  status: MarketplaceDocumentStatus;
  expires_on: string | null;
}

export interface ApplicationLimits {
  proposed_single_txn_usd: number;
  proposed_monthly_usd: number;
  approved_single_txn_usd: number;
  approved_monthly_usd: number;
  tenor_days: number;
}

export interface MarketplaceNonConformity {
  id: UUID;
  title: string;
  severity: "minor" | "major" | "critical";
  raised_at: string;
  status: "open" | "remediation" | "closed";
  note: string;
}

export interface MarketplaceAuditEntry {
  id: UUID;
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface MarketplaceApplication {
  id: UUID;
  reference: string;
  entity_name: string;
  applicant_type: ApplicantType;
  country: string;
  jurisdiction: string;
  registration_no: string;
  vat_no: string;
  incorporated_on: string | null;
  website: string;
  submitted_at: string | null;
  status: MarketplaceApplicationStatus;
  risk_score: number;
  risk_band: "low" | "medium" | "high";
  risk_factors: MarketplaceRiskFactor[];
  sanctions_screen: ScreenResult;
  pep_screen: ScreenResult;
  ownership: OwnershipEntry[];
  representatives: Representative[];
  profile: ApplicationProfile;
  documents: MarketplaceDocument[];
  limits: ApplicationLimits;
  non_conformities: MarketplaceNonConformity[];
  audit: MarketplaceAuditEntry[];
  notes: string[];
  created_at: string;
  updated_at: string;
}

export function listMarketplaceApplications(
  query: MarketplaceListQuery = {},
): Promise<Paginated<MarketplaceApplication>> {
  return apiFetch<Paginated<MarketplaceApplication>>(`${BASE}/applications/`, { query });
}

export function getMarketplaceApplication(id: UUID): Promise<MarketplaceApplication> {
  return apiFetch<MarketplaceApplication>(`${BASE}/applications/${id}/`);
}

export type OperatorActionKind = "verify" | "reject" | "request_info" | "flag" | "escalate";

/** One desk verdict. The backend derives `status` and the audit line from `action`. */
export function decideMarketplaceApplication(
  id: UUID,
  input: { action: OperatorActionKind; note?: string | undefined },
): Promise<MarketplaceApplication> {
  return apiFetch<MarketplaceApplication>(`${BASE}/applications/${id}/decide/`, {
    method: "POST",
    body: input,
  });
}

export function updateApplicationLimits(
  id: UUID,
  input: { approved_single_txn_usd: number; approved_monthly_usd: number },
): Promise<MarketplaceApplication> {
  return apiFetch<MarketplaceApplication>(`${BASE}/applications/${id}/limits/`, {
    method: "POST",
    body: input,
  });
}

export function addNonConformity(
  id: UUID,
  input: { title: string; severity: "minor" | "major" | "critical"; note?: string | undefined },
): Promise<MarketplaceNonConformity> {
  return apiFetch<MarketplaceNonConformity>(`${BASE}/applications/${id}/non-conformities/`, {
    method: "POST",
    body: input,
  });
}

/** Steps a finding forward one stage: open -> remediation -> closed. */
export function advanceNonConformity(id: UUID, ncId: UUID): Promise<MarketplaceNonConformity> {
  return apiFetch<MarketplaceNonConformity>(
    `${BASE}/applications/${id}/non-conformities/${ncId}/advance/`,
    { method: "POST" },
  );
}

// --- miners -------------------------------------------------------------

export type MinerCompliance = "verified" | "under_review" | "restricted";
export type NotificationChannel = "sms" | "email" | "in_app";

export interface Miner {
  id: UUID;
  name: string;
  country: string;
  region: string;
  commodity: string;
  capacity_tpa: number;
  available_tonnes: number;
  grade: string;
  compliance: MinerCompliance;
  esg_score: number;
  logistics: string;
  channels: NotificationChannel[];
  phone: string;
  email: string;
}

export function listMiners(query: MarketplaceListQuery = {}): Promise<Paginated<Miner>> {
  return apiFetch<Paginated<Miner>>(`${BASE}/miners/`, { query });
}

// --- RFQs -----------------------------------------------------------------

export type AllocationState = "invited" | "offered" | "accepted" | "declined";

export interface Allocation {
  miner: UUID;
  tonnes: number;
  state: AllocationState;
  price_usd_per_tonne: number;
}

export type RfqNotificationStatus = "queued" | "sent" | "delivered" | "responded";

export interface RfqNotification {
  id: UUID;
  miner: UUID;
  channel: NotificationChannel;
  status: RfqNotificationStatus;
  at: string;
  preview: string;
}

export type RfqStatus =
  "draft" | "matching" | "notified" | "aggregating" | "accepted" | "contracted";

export interface TransactionServices {
  logistics?: string;
  insurance?: string;
  quality?: string;
  finance?: string;
  confirmed: boolean;
}

export type FinanceStatus = "not_started" | "submitted" | "in_review" | "indicative_offer";

export interface FinanceReadinessItem {
  label: string;
  ok: boolean;
  note: string;
}

export interface FinancePackage {
  total_commitment_usd: number;
  buyer_contribution_usd: number;
  required_usd: number;
  instrument: string;
  tenor_months: number;
  status: FinanceStatus;
  readiness: FinanceReadinessItem[];
}

export interface Rfq {
  id: UUID;
  reference: string;
  commodity: string;
  grade: string;
  volume_tonnes: number;
  incoterm: string;
  destination: string;
  delivery_window: string;
  target_price_usd: number;
  created_by: MarketplaceRole;
  created_by_name: string;
  created_at: string;
  status: RfqStatus;
  allocations: Allocation[];
  notifications: RfqNotification[];
  services: TransactionServices | null;
  finance: FinancePackage | null;
}

export function listRfqs(query: MarketplaceListQuery = {}): Promise<Paginated<Rfq>> {
  return apiFetch<Paginated<Rfq>>(`${BASE}/rfqs/`, { query });
}

export function getRfq(id: UUID): Promise<Rfq> {
  return apiFetch<Rfq>(`${BASE}/rfqs/${id}/`);
}

export interface NewRfqInput {
  commodity: string;
  grade: string;
  volume_tonnes: number;
  incoterm: string;
  destination: string;
  delivery_window: string;
  target_price_usd: number;
}

export function createRfq(input: NewRfqInput): Promise<Rfq> {
  return apiFetch<Rfq>(`${BASE}/rfqs/`, { method: "POST", body: input });
}

/**
 * Roll verified miner capacity up to the requested volume, worst-fit
 * excluded. The allocation logic (which miners, at what price) lives
 * server-side so it always runs against the live miner directory.
 */
export function autoAggregateRfq(id: UUID): Promise<Rfq> {
  return apiFetch<Rfq>(`${BASE}/rfqs/${id}/auto-aggregate/`, { method: "POST" });
}

export function setRfqAllocation(
  id: UUID,
  input: { miner: UUID; tonnes?: number | undefined; state?: AllocationState | undefined },
): Promise<Rfq> {
  return apiFetch<Rfq>(`${BASE}/rfqs/${id}/allocations/`, { method: "PATCH", body: input });
}

/** Sends the invitation to every allocated (or, unallocated, every verified) miner on its preferred channels. */
export function dispatchRfqNotifications(id: UUID): Promise<Rfq> {
  return apiFetch<Rfq>(`${BASE}/rfqs/${id}/dispatch/`, { method: "POST" });
}

export function acceptRfqAggregation(id: UUID): Promise<Rfq> {
  return apiFetch<Rfq>(`${BASE}/rfqs/${id}/accept/`, { method: "POST" });
}

export function saveRfqServices(id: UUID, services: TransactionServices): Promise<Rfq> {
  return apiFetch<Rfq>(`${BASE}/rfqs/${id}/services/`, { method: "POST", body: services });
}

export function submitRfqFinance(id: UUID, pkg: FinancePackage): Promise<Rfq> {
  return apiFetch<Rfq>(`${BASE}/rfqs/${id}/finance/`, { method: "POST", body: pkg });
}

// --- orders -----------------------------------------------------------------

export type OrderStage = "contract_drafting" | "signed" | "in_transit" | "delivered" | "settled";

export interface MarketplaceOrder {
  id: UUID;
  reference: string;
  counterparty: string;
  commodity: string;
  tonnes: number;
  value_usd: number;
  stage: OrderStage;
  updated_at: string;
}

export function listOrders(query: MarketplaceListQuery = {}): Promise<Paginated<MarketplaceOrder>> {
  return apiFetch<Paginated<MarketplaceOrder>>(`${BASE}/orders/`, { query });
}

// --- notifications ------------------------------------------------------------

export interface MarketplaceNotification {
  id: UUID;
  audience: MarketplaceRole | "all";
  title: string;
  body: string;
  channel: NotificationChannel;
  at: string;
  read_at: string | null;
}

export function listMarketplaceNotifications(
  query: MarketplaceListQuery = {},
): Promise<Paginated<MarketplaceNotification>> {
  return apiFetch<Paginated<MarketplaceNotification>>(`${BASE}/notifications/`, { query });
}

export function markMarketplaceNotificationRead(id: UUID): Promise<MarketplaceNotification> {
  return apiFetch<MarketplaceNotification>(`${BASE}/notifications/${id}/mark-read/`, {
    method: "POST",
  });
}

// --- capabilities / dashboard -------------------------------------------------

export interface MarketplaceCapabilities {
  role: MarketplaceRole | null;
  can_review: boolean;
  can_decide: boolean;
  is_staff: boolean;
}

export function fetchMarketplaceCapabilities(
  signal?: AbortSignal,
): Promise<MarketplaceCapabilities> {
  return apiFetch<MarketplaceCapabilities>(`${BASE}/me/`, { signal });
}
