// The Miner Portal vertical. Almost everything here is served by the same
// register as `./mining.ts` — sites, equipment, applications, non-conformities,
// documents and info requests are scoped server-side to the caller's own
// organisation, so this file re-exports those functions/types unchanged
// rather than re-spelling them.
//
// Production and inventory are new: the backend is adding
// `/mining/production/` and `/mining/inventory/` viewsets in parallel
// (beldium-backend). The shapes below are our best-known guess at that
// contract and may need reconciling once the backend lands.

import { apiFetch } from "./client";
import type { Paginated, UUID } from "./types";

export {
  // reads
  fetchMiningCapabilities,
  fetchMiningDashboard,
  listMineSites,
  getMineSite,
  listMiningNonConformities,
  listEquipment,
  listMiningApplications,
  listInfoRequests,
  listMiningDocuments,
  listOrganisationProfiles,
  // writes
  createMiningApplication,
  updateApplication,
  createMiningNonConformity,
  submitMiningNonConformityEvidence,
  respondToInfoRequest,
  createInfoRequest,
  uploadMiningDocument,
  updateMineSite,
} from "./mining";

export type {
  MiningAudience,
  MiningCapabilities,
  MiningDashboard,
  MineSite,
  MineSiteDetail,
  MineSiteStatus,
  MineSiteRisk,
  MiningNonConformity,
  NonConformitySeverity,
  NonConformityStatus,
  CorrectiveSubmission,
  Equipment,
  EquipmentStatus,
  Application,
  MiningApplicationStatus,
  InfoRequest,
  InfoRequestStatus,
  Priority,
  DocumentRecord,
  MiningDocumentStatus,
  OrganisationProfile,
  MiningListQuery,
} from "./mining";

const BASE = "/mining";

// --- production ---------------------------------------------------------------
// Guessed contract: fields site, period_start, period_end, commodity, tonnage,
// grade, notes — CRUD viewset at /mining/production/.

export interface ProductionRecord {
  id: UUID;
  site: UUID;
  period_start: string;
  period_end: string;
  commodity: string;
  tonnage: number;
  grade: number | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface MiningListQueryLite {
  page?: number;
  page_size?: number;
  site?: UUID;
  [key: string]: string | number | boolean | null | undefined;
}

export function listProductionRecords(
  query: MiningListQueryLite = {},
): Promise<Paginated<ProductionRecord>> {
  return apiFetch<Paginated<ProductionRecord>>(`${BASE}/production/`, { query });
}

export function createProductionRecord(
  input: Partial<ProductionRecord> & { site: UUID; period_start: string; period_end: string },
): Promise<ProductionRecord> {
  return apiFetch<ProductionRecord>(`${BASE}/production/`, { method: "POST", body: input });
}

export function updateProductionRecord(
  id: UUID,
  patch: Partial<ProductionRecord>,
): Promise<ProductionRecord> {
  return apiFetch<ProductionRecord>(`${BASE}/production/${id}/`, { method: "PATCH", body: patch });
}

// --- inventory -----------------------------------------------------------------
// Guessed contract: fields site, category, name, quantity, unit, threshold —
// CRUD viewset at /mining/inventory/.

export interface InventoryItem {
  id: UUID;
  site: UUID;
  category: string;
  name: string;
  quantity: number;
  unit: string;
  threshold: number | null;
  created_at: string;
  updated_at: string;
}

export function listInventoryItems(
  query: MiningListQueryLite = {},
): Promise<Paginated<InventoryItem>> {
  return apiFetch<Paginated<InventoryItem>>(`${BASE}/inventory/`, { query });
}

export function createInventoryItem(
  input: Partial<InventoryItem> & { site: UUID; name: string; category: string },
): Promise<InventoryItem> {
  return apiFetch<InventoryItem>(`${BASE}/inventory/`, { method: "POST", body: input });
}

export function updateInventoryItem(
  id: UUID,
  patch: Partial<InventoryItem>,
): Promise<InventoryItem> {
  return apiFetch<InventoryItem>(`${BASE}/inventory/${id}/`, { method: "PATCH", body: patch });
}
