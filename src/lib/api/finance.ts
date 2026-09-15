import { apiFetch } from "./client";
import type { Paginated, UUID } from "./types";

// Settlement/invoicing domain. Mirrors `beldium-backend/finance/serializers.py`.

const BASE = "/finance";

export type InvoiceStatus =
  | "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "disputed" | "cancelled";

export type PaymentMethod =
  | "bank_transfer" | "letter_of_credit" | "escrow" | "card" | "cash" | "other";

export type PaymentStatus = "pending" | "cleared" | "failed" | "reversed";

export interface Payment {
  id: UUID;
  invoice: UUID;
  reference: string;
  amount: string;
  currency: string;
  method: PaymentMethod;
  external_reference: string;
  status: PaymentStatus;
  received_at: string | null;
  recorded_by: UUID | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: UUID;
  reference: string;
  seller_organisation: UUID;
  seller_organisation_name: string;
  buyer_organisation: UUID;
  buyer_organisation_name: string;
  transaction_reference: string;
  description: string;
  amount: string;
  currency: string;
  advance_percent: number;
  status: InvoiceStatus;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  notes: string;
  amount_paid: string;
  amount_outstanding: string;
  payments: Payment[];
  created_at: string;
  updated_at: string;
}

export interface FinanceListQuery {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export function listInvoices(query: FinanceListQuery = {}): Promise<Paginated<Invoice>> {
  return apiFetch<Paginated<Invoice>>(`${BASE}/invoices/`, { query });
}

export function getInvoice(id: UUID): Promise<Invoice> {
  return apiFetch<Invoice>(`${BASE}/invoices/${id}/`);
}

export interface NewInvoiceInput {
  seller_organisation: UUID;
  buyer_organisation: UUID;
  transaction_reference?: string | undefined;
  description?: string | undefined;
  amount: string | number;
  currency?: string | undefined;
  advance_percent?: number | undefined;
  due_at?: string | undefined;
  notes?: string | undefined;
}

export function createInvoice(input: NewInvoiceInput): Promise<Invoice> {
  return apiFetch<Invoice>(`${BASE}/invoices/`, { method: "POST", body: input });
}

export function updateInvoice(id: UUID, patch: Partial<Invoice>): Promise<Invoice> {
  return apiFetch<Invoice>(`${BASE}/invoices/${id}/`, { method: "PATCH", body: patch });
}

export function listPayments(query: FinanceListQuery = {}): Promise<Paginated<Payment>> {
  return apiFetch<Paginated<Payment>>(`${BASE}/payments/`, { query });
}

export interface NewPaymentInput {
  invoice: UUID;
  amount: string | number;
  currency?: string | undefined;
  method?: PaymentMethod | undefined;
  external_reference?: string | undefined;
  notes?: string | undefined;
}

export function recordPayment(input: NewPaymentInput): Promise<Payment> {
  return apiFetch<Payment>(`${BASE}/payments/`, { method: "POST", body: input });
}
