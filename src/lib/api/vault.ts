import { apiFetch, apiFetchBlob } from "./client";
import { apiUrl } from "./config";
import type { Paginated, UUID } from "./types";

// The document vault: a backup store where partners and the Beldium desk keep
// copies of their records. Nothing in it is ever edited or deleted; a newer
// file is a new version, and each upload waits for a second approver.

const BASE = "/vault";

export type VaultAudience = "desk" | "member";
export type VaultStatus = "awaiting_approval" | "approved";

export interface VaultCategory {
  id: UUID;
  code: string;
  name: string;
  description: string;
  document_count: number;
}

export interface VaultSector {
  sector: string;
  label: string;
  audience: VaultAudience;
  organisation: string;
  can_approve: boolean;
  total: number;
  awaiting_approval: number;
  categories: VaultCategory[];
}

export interface VaultSectors {
  sectors: VaultSector[];
  max_upload_bytes: number;
}

export interface VaultDocument {
  id: UUID;
  reference: string;
  sector: string;
  category: { code: string; name: string };
  organisation: { id: UUID | null; name: string };
  family: UUID;
  version: number;
  is_latest: boolean;
  title: string;
  description: string;
  version_note: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
  sha256: string;
  uploaded_by: string;
  created_at: string;
  status: VaultStatus;
  approved_by: string;
  approved_at: string | null;
  /** The type read from the file's own bytes at upload (backend G7). */
  sniffed_type?: string;
  /** "pending" means no scanner has checked it yet; it is never called clean unscanned. */
  scan_status?: "pending" | "clean" | "infected" | "";
  /** Filed by the Beldium desk for the organisation (decision 3). */
  on_behalf_of_company?: boolean;
  received_from?: ReceivedFrom | "";
  received_date?: string | null;
}

export type ReceivedFrom = "email" | "whatsapp" | "in_person";

export const RECEIVED_FROM_LABELS: Record<ReceivedFrom, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  in_person: "In person",
};

/** How and when the desk received a file it files for an organisation. */
export interface ReceivedNote {
  received_from: ReceivedFrom;
  received_date: string;
}

export interface VaultActivity {
  id: UUID;
  created_at: string;
  actor: string;
  action: "uploaded" | "new_version" | "approved" | "downloaded" | "integrity_checked";
  detail: string;
  reference: string;
  version: number;
}

export interface VaultDocumentDetail {
  document: VaultDocument;
  versions: VaultDocument[];
  can_approve: boolean;
  activity: VaultActivity[];
}

export interface VaultIntegrity {
  intact: boolean;
  recorded_sha256: string;
  computed_sha256: string;
}

export interface VaultListQuery {
  sector: string;
  category?: string;
  status?: VaultStatus | "";
  search?: string;
  page?: number;
  page_size?: number;
}

export interface VaultUploadInput {
  sector: string;
  category: string;
  title: string;
  description?: string;
  file: File;
  /** Desk only: file for this organisation, on its behalf. Needs `received`. */
  organisation?: UUID;
  received?: ReceivedNote;
}

export function fetchVaultSectors(signal?: AbortSignal): Promise<VaultSectors> {
  return apiFetch<VaultSectors>(`${BASE}/sectors/`, { signal });
}

export function listVaultDocuments(query: VaultListQuery): Promise<Paginated<VaultDocument>> {
  return apiFetch<Paginated<VaultDocument>>(`${BASE}/documents/`, { query: { ...query } });
}

export function getVaultDocument(id: UUID): Promise<VaultDocumentDetail> {
  return apiFetch<VaultDocumentDetail>(`${BASE}/documents/${id}/`);
}

export function uploadVaultDocument(input: VaultUploadInput): Promise<VaultDocument> {
  const form = new FormData();
  form.append("sector", input.sector);
  form.append("category", input.category);
  form.append("title", input.title);
  form.append("description", input.description ?? "");
  form.append("file", input.file);
  if (input.organisation) form.append("organisation", input.organisation);
  if (input.received) {
    form.append("received_from", input.received.received_from);
    form.append("received_date", input.received.received_date);
  }
  return apiFetch<VaultDocument>(`${BASE}/documents/`, { method: "POST", body: form });
}

export function addVaultVersion(
  id: UUID,
  file: File,
  note: string,
  received?: ReceivedNote,
): Promise<VaultDocument> {
  const form = new FormData();
  form.append("file", file);
  form.append("note", note);
  if (received) {
    form.append("received_from", received.received_from);
    form.append("received_date", received.received_date);
  }
  return apiFetch<VaultDocument>(`${BASE}/documents/${id}/versions/`, {
    method: "POST",
    body: form,
  });
}

export function approveVaultDocument(id: UUID, note: string): Promise<VaultDocument> {
  return apiFetch<VaultDocument>(`${BASE}/documents/${id}/approve/`, {
    method: "POST",
    body: { note },
  });
}

export function verifyVaultDocument(id: UUID): Promise<VaultIntegrity> {
  return apiFetch<VaultIntegrity>(`${BASE}/documents/${id}/verify/`, { method: "POST" });
}

/** The download route needs the bearer token, so fetch the file and save it locally. */
export async function downloadVaultDocument(doc: VaultDocument): Promise<void> {
  const blob = await apiFetchBlob(apiUrl(`${BASE}/documents/${doc.id}/download/`));
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = doc.original_name || doc.reference;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
