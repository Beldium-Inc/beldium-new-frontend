// The Marketplace dashboard's own vocabulary: camelCase view shapes the
// screens render against. The store adapts the API's snake_case rows
// (`@/lib/api/marketplace`) into these on every read.

export type Role = "operator" | "buyer" | "offtaker" | "oem";

export type ApplicantType = "Buyer" | "Offtaker" | "OEM";

export type AppStatus =
  | "pending"
  | "under_review"
  | "info_requested"
  | "flagged"
  | "escalated"
  | "verified"
  | "restricted"
  | "rejected";

export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
};

export type NonConformity = {
  id: string;
  title: string;
  severity: "Minor" | "Major" | "Critical";
  raisedAt: string;
  status: "open" | "remediation" | "closed";
  note: string;
};

export type DocItem = {
  id: string;
  name: string;
  kind: string;
  uploadedAt: string;
  status: "verified" | "pending" | "expired";
  expires?: string;
};

export type Application = {
  id: string;
  entityName: string;
  type: ApplicantType;
  country: string;
  jurisdiction: string;
  registrationNo: string;
  vatNo: string;
  incorporated: string;
  website: string;
  submittedAt: string;
  status: AppStatus;
  riskScore: number;
  riskBand: "Low" | "Medium" | "High";
  riskFactors: { label: string; weight: number; note: string }[];
  sanctionsScreen: "clear" | "review" | "hit";
  pepScreen: "clear" | "review" | "hit";
  ownership: { name: string; pct: number; type: string; country: string; pep: boolean }[];
  reps: { name: string; role: string; email: string; phone: string; idVerified: boolean }[];
  profile: {
    headline: string;
    commodities: string[];
    annualDemandTonnes?: number;
    annualSupplyTonnes?: number;
    markets: string[];
    yearsTrading: number;
    turnoverUsd: number;
    banking: string;
    logistics: string;
  };
  documents: DocItem[];
  limits: {
    proposedSingleTxnUsd: number;
    proposedMonthlyUsd: number;
    approvedSingleTxnUsd: number;
    approvedMonthlyUsd: number;
    tenorDays: number;
  };
  nonConformities: NonConformity[];
  audit: AuditEntry[];
  notes: string[];
};

export type Miner = {
  id: string;
  name: string;
  country: string;
  region: string;
  commodity: string;
  capacityTpa: number;
  availableTonnes: number;
  grade: string;
  compliance: "verified" | "under_review" | "restricted";
  esgScore: number;
  logistics: string;
  channels: ("sms" | "email" | "in_app")[];
  phone: string;
  email: string;
};

export type RfqNotification = {
  id: string;
  minerId: string;
  minerName: string;
  channel: "sms" | "email" | "in_app";
  status: "queued" | "sent" | "delivered" | "responded";
  at: string;
  preview: string;
};

export type Allocation = {
  minerId: string;
  tonnes: number;
  state: "invited" | "offered" | "accepted" | "declined";
  priceUsdPerTonne: number;
};

export type Rfq = {
  id: string;
  reference: string;
  commodity: string;
  grade: string;
  volumeTonnes: number;
  incoterm: string;
  destination: string;
  deliveryWindow: string;
  targetPriceUsd: number;
  createdBy: Role;
  createdByName: string;
  createdAt: string;
  status: "draft" | "matching" | "notified" | "aggregating" | "accepted" | "contracted";
  allocations: Allocation[];
  notifications: RfqNotification[];
  services?: TransactionServices;
  finance?: FinancePackage;
};

export type TransactionServices = {
  logistics?: string;
  insurance?: string;
  quality?: string;
  finance?: string;
  confirmed: boolean;
};

export type FinancePackage = {
  totalCommitmentUsd: number;
  buyerContributionUsd: number;
  requiredUsd: number;
  instrument: string;
  tenorMonths: number;
  status: "not_started" | "submitted" | "in_review" | "indicative_offer";
  readiness: { label: string; ok: boolean; note: string }[];
};

export type OrderRow = {
  id: string;
  reference: string;
  counterparty: string;
  commodity: string;
  tonnes: number;
  valueUsd: number;
  stage: "contract drafting" | "signed" | "in transit" | "delivered" | "settled";
  updatedAt: string;
};

export type Notification = {
  id: string;
  audience: Role | "all";
  title: string;
  body: string;
  channel: "sms" | "email" | "in_app";
  at: string;
  read: boolean;
};
