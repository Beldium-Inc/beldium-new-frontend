import { apiFetch } from "./client";
import type { Paginated, UUID } from "./types";

export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled";

export interface Invoice {
  id: UUID;
  seller_organisation: UUID;
  buyer_organisation: UUID;
  transaction_reference: string;
  amount: number;
  currency: string;
  advance_percent: number;
  status: InvoiceStatus;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  amount_paid: number;
  amount_outstanding: number;
  created_at: string;
  updated_at: string;
}

export function listInvoices(): Promise<Paginated<Invoice> | Invoice[]> {
  return apiFetch("/finance/invoices/");
}

export type PaymentMethod = "bank_transfer" | "letter_of_credit" | "escrow" | "card" | "cash";

export interface Payment {
  id: UUID;
  invoice: UUID;
  amount: number;
  method: PaymentMethod;
  status: string;
  received_at: string | null;
  created_at: string;
}

export function listPayments(): Promise<Paginated<Payment> | Payment[]> {
  return apiFetch("/finance/payments/");
}
