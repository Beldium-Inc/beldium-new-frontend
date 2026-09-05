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

const now = new Date("2026-08-24T08:00:00Z");
const iso = (dayOffset: number, h = 9) =>
  new Date(now.getTime() - dayOffset * 86400000 + h * 3600000).toISOString();

const baseDocs = (prefix: string): DocItem[] => [
  { id: `${prefix}-d1`, name: "Certificate of incorporation.pdf", kind: "Corporate", uploadedAt: iso(12), status: "verified" },
  { id: `${prefix}-d2`, name: "Shareholder register.pdf", kind: "Ownership", uploadedAt: iso(12), status: "verified" },
  { id: `${prefix}-d3`, name: "Board resolution - authorised reps.pdf", kind: "Authority", uploadedAt: iso(11), status: "pending" },
  { id: `${prefix}-d4`, name: "Audited financials FY2025.pdf", kind: "Financial", uploadedAt: iso(10), status: "verified" },
  { id: `${prefix}-d5`, name: "AML / KYC questionnaire.pdf", kind: "Compliance", uploadedAt: iso(9), status: "pending", expires: "2027-01-31" },
];

export const seedApplications: Application[] = [
  {
    id: "APP-2041",
    entityName: "Meridian Offtake Partners SA",
    type: "Offtaker",
    country: "Switzerland",
    jurisdiction: "Geneva, CH",
    registrationNo: "CHE-441.882.107",
    vatNo: "CHE-441882107 MWST",
    incorporated: "2014-03-18",
    website: "meridian-offtake.example",
    submittedAt: iso(2),
    status: "pending",
    riskScore: 38,
    riskBand: "Medium",
    riskFactors: [
      { label: "Jurisdiction risk", weight: 8, note: "Low-risk FATF member state." },
      { label: "Ownership transparency", weight: 12, note: "One nominee holder pending look-through." },
      { label: "Volume vs. turnover", weight: 10, note: "Requested limits at 1.4x declared turnover." },
      { label: "Adverse media", weight: 8, note: "Two neutral trade-press mentions." },
    ],
    sanctionsScreen: "clear",
    pepScreen: "review",
    ownership: [
      { name: "Meridian Holdings BV", pct: 62, type: "Corporate", country: "Netherlands", pep: false },
      { name: "L. Anders Køhl", pct: 23, type: "Individual", country: "Denmark", pep: false },
      { name: "Nominee: Fiduciaire Lac SA", pct: 15, type: "Nominee", country: "Switzerland", pep: true },
    ],
    reps: [
      { name: "Claire Béraud", role: "Head of Trading", email: "c.beraud@meridian-offtake.example", phone: "+41 22 555 0114", idVerified: true },
      { name: "Tomas Reiner", role: "CFO", email: "t.reiner@meridian-offtake.example", phone: "+41 22 555 0118", idVerified: false },
    ],
    profile: {
      headline: "Long-term offtake of battery-grade concentrates for European cathode plants.",
      commodities: ["Manganese ore", "Copper concentrate"],
      annualDemandTonnes: 1200000,
      markets: ["EU", "UK", "Turkey"],
      yearsTrading: 11,
      turnoverUsd: 430000000,
      banking: "Banque Cantonale: confirmed reference letter",
      logistics: "Contracted with Rotterdam bulk terminal",
    },
    documents: baseDocs("APP-2041"),
    limits: {
      proposedSingleTxnUsd: 250000000,
      proposedMonthlyUsd: 600000000,
      approvedSingleTxnUsd: 0,
      approvedMonthlyUsd: 0,
      tenorDays: 90,
    },
    nonConformities: [],
    audit: [
      { id: "a1", at: iso(2), actor: "System", action: "Application received", detail: "Offtaker onboarding form submitted via portal." },
      { id: "a2", at: iso(2, 11), actor: "System", action: "Screening run", detail: "Sanctions: clear. PEP: review (1 nominee match)." },
    ],
    notes: [],
  },
  {
    id: "APP-2038",
    entityName: "Anhui Precision Cells Ltd",
    type: "OEM",
    country: "China",
    jurisdiction: "Hefei, CN",
    registrationNo: "91340100MA2X1QJ4",
    vatNo: "340100MA2X1QJ4",
    incorporated: "2009-11-02",
    website: "apcells.example",
    submittedAt: iso(4),
    status: "under_review",
    riskScore: 54,
    riskBand: "Medium",
    riskFactors: [
      { label: "Jurisdiction risk", weight: 18, note: "Enhanced due diligence jurisdiction." },
      { label: "Supply chain traceability", weight: 14, note: "Tier-2 supplier list incomplete." },
      { label: "Sanctioned-party proximity", weight: 12, note: "No direct match; one indirect 6% holder under review." },
      { label: "Document freshness", weight: 10, note: "Financials older than 12 months." },
    ],
    sanctionsScreen: "review",
    pepScreen: "clear",
    ownership: [
      { name: "Anhui Industrial Group", pct: 55, type: "Corporate", country: "China", pep: false },
      { name: "Wei Lan", pct: 39, type: "Individual", country: "China", pep: false },
      { name: "Pacific Rim Ventures LP", pct: 6, type: "Fund", country: "Cayman Islands", pep: false },
    ],
    reps: [
      { name: "Wei Lan", role: "Chairman", email: "wl@apcells.example", phone: "+86 551 6788 0021", idVerified: true },
      { name: "Grace Hou", role: "Procurement Director", email: "g.hou@apcells.example", phone: "+86 551 6788 0044", idVerified: true },
    ],
    profile: {
      headline: "Cell manufacturer sourcing manganese and graphite for 18 GWh of capacity.",
      commodities: ["Manganese ore", "Graphite"],
      annualDemandTonnes: 480000,
      markets: ["CN", "SEA", "EU"],
      yearsTrading: 17,
      turnoverUsd: 1250000000,
      banking: "ICBC: reference pending",
      logistics: "Own inland fleet + Shanghai port allocation",
    },
    documents: [
      ...baseDocs("APP-2038"),
      { id: "APP-2038-d6", name: "Tier-2 supplier map.xlsx", kind: "Supply chain", uploadedAt: iso(4), status: "expired" },
    ],
    limits: {
      proposedSingleTxnUsd: 120000000,
      proposedMonthlyUsd: 300000000,
      approvedSingleTxnUsd: 0,
      approvedMonthlyUsd: 0,
      tenorDays: 60,
    },
    nonConformities: [
      {
        id: "NC-118",
        title: "Incomplete tier-2 supplier disclosure",
        severity: "Major",
        raisedAt: iso(3),
        status: "open",
        note: "Applicant to provide full tier-2 smelter list with OECD conformance statements.",
      },
    ],
    audit: [
      { id: "b1", at: iso(4), actor: "System", action: "Application received", detail: "OEM onboarding submitted." },
      { id: "b2", at: iso(3, 10), actor: "A. Mensah (Compliance)", action: "Moved to under review", detail: "Assigned to enhanced due diligence queue." },
      { id: "b3", at: iso(3, 14), actor: "A. Mensah (Compliance)", action: "Non-conformity raised", detail: "NC-118: tier-2 supplier disclosure." },
    ],
    notes: ["EDD required before any limit above $50m."],
  },
  {
    id: "APP-2033",
    entityName: "Sahel Metals Trading FZE",
    type: "Buyer",
    country: "United Arab Emirates",
    jurisdiction: "Sharjah, AE",
    registrationNo: "SAIF-11-0392",
    vatNo: "1004422119800003",
    incorporated: "2019-06-24",
    website: "sahelmetals.example",
    submittedAt: iso(6),
    status: "flagged",
    riskScore: 71,
    riskBand: "High",
    riskFactors: [
      { label: "Beneficial owner opacity", weight: 22, note: "Two layers of holding companies, one unverified." },
      { label: "Adverse media", weight: 18, note: "Reported customs dispute 2024." },
      { label: "Free-zone structure", weight: 16, note: "Limited public filing obligations." },
      { label: "Short trading history", weight: 15, note: "Trading since 2019, thin audited record." },
    ],
    sanctionsScreen: "review",
    pepScreen: "review",
    ownership: [
      { name: "Almas Global Holdings", pct: 70, type: "Corporate", country: "Mauritius", pep: false },
      { name: "K. Traoré", pct: 30, type: "Individual", country: "Mali", pep: true },
    ],
    reps: [
      { name: "K. Traoré", role: "Managing Director", email: "kt@sahelmetals.example", phone: "+971 6 555 8120", idVerified: false },
    ],
    profile: {
      headline: "Spot buyer of manganese and chrome ore for South Asian re-sale.",
      commodities: ["Manganese ore", "Chrome ore"],
      annualDemandTonnes: 260000,
      markets: ["IN", "AE", "OM"],
      yearsTrading: 6,
      turnoverUsd: 85000000,
      banking: "Reference letter not provided",
      logistics: "Third-party forwarder, not disclosed",
    },
    documents: baseDocs("APP-2033").map((d, i) =>
      i === 4 ? { ...d, status: "expired" as const } : d,
    ),
    limits: {
      proposedSingleTxnUsd: 40000000,
      proposedMonthlyUsd: 90000000,
      approvedSingleTxnUsd: 0,
      approvedMonthlyUsd: 0,
      tenorDays: 30,
    },
    nonConformities: [
      {
        id: "NC-104",
        title: "Beneficial owner verification failure",
        severity: "Critical",
        raisedAt: iso(5),
        status: "remediation",
        note: "Certified UBO register for Almas Global Holdings outstanding.",
      },
      {
        id: "NC-109",
        title: "Expired AML questionnaire",
        severity: "Minor",
        raisedAt: iso(5),
        status: "open",
        note: "Questionnaire dated 2024; refresh required.",
      },
    ],
    audit: [
      { id: "c1", at: iso(6), actor: "System", action: "Application received", detail: "Buyer onboarding submitted." },
      { id: "c2", at: iso(5, 12), actor: "R. Okonjo (Compliance)", action: "Flagged", detail: "UBO chain opaque; escalation candidate." },
    ],
    notes: [],
  },
  {
    id: "APP-2029",
    entityName: "Nordvolt Energy AB",
    type: "OEM",
    country: "Sweden",
    jurisdiction: "Västerås, SE",
    registrationNo: "556982-1147",
    vatNo: "SE556982114701",
    incorporated: "2016-01-11",
    website: "nordvolt.example",
    submittedAt: iso(14),
    status: "verified",
    riskScore: 19,
    riskBand: "Low",
    riskFactors: [
      { label: "Jurisdiction risk", weight: 4, note: "Low-risk jurisdiction." },
      { label: "Ownership transparency", weight: 5, note: "Listed parent, full look-through." },
      { label: "Financial strength", weight: 6, note: "Investment-grade rated parent." },
      { label: "Document freshness", weight: 4, note: "All documents current." },
    ],
    sanctionsScreen: "clear",
    pepScreen: "clear",
    ownership: [
      { name: "Nordvolt Group AB (publ)", pct: 88, type: "Listed corporate", country: "Sweden", pep: false },
      { name: "Employee trust", pct: 12, type: "Trust", country: "Sweden", pep: false },
    ],
    reps: [
      { name: "Elin Sandberg", role: "VP Supply", email: "e.sandberg@nordvolt.example", phone: "+46 21 555 4410", idVerified: true },
      { name: "Petter Aas", role: "Group Treasurer", email: "p.aas@nordvolt.example", phone: "+46 21 555 4418", idVerified: true },
    ],
    profile: {
      headline: "Gigafactory operator with committed manganese offtake to 2032.",
      commodities: ["Manganese ore", "Nickel sulphate"],
      annualDemandTonnes: 900000,
      markets: ["EU", "NO"],
      yearsTrading: 10,
      turnoverUsd: 2100000000,
      banking: "SEB: confirmed",
      logistics: "Rail + Gothenburg deep water berth",
    },
    documents: baseDocs("APP-2029").map((d) => ({ ...d, status: "verified" as const })),
    limits: {
      proposedSingleTxnUsd: 300000000,
      proposedMonthlyUsd: 700000000,
      approvedSingleTxnUsd: 300000000,
      approvedMonthlyUsd: 700000000,
      tenorDays: 120,
    },
    nonConformities: [],
    audit: [
      { id: "d1", at: iso(14), actor: "System", action: "Application received", detail: "OEM onboarding submitted." },
      { id: "d2", at: iso(12), actor: "A. Mensah (Compliance)", action: "Verified", detail: "Full KYC pack accepted; limits approved." },
    ],
    notes: [],
  },
  {
    id: "APP-2026",
    entityName: "Coastal Bulk Buyers Pte Ltd",
    type: "Buyer",
    country: "Singapore",
    jurisdiction: "Singapore, SG",
    registrationNo: "201733921K",
    vatNo: "GST-201733921K",
    incorporated: "2017-08-30",
    website: "coastalbulk.example",
    submittedAt: iso(9),
    status: "info_requested",
    riskScore: 44,
    riskBand: "Medium",
    riskFactors: [
      { label: "Jurisdiction risk", weight: 6, note: "Low-risk jurisdiction." },
      { label: "Document completeness", weight: 16, note: "Board resolution unsigned." },
      { label: "Counterparty concentration", weight: 12, note: "78% of volume with one end-buyer." },
      { label: "Limit request", weight: 10, note: "Aligned with turnover." },
    ],
    sanctionsScreen: "clear",
    pepScreen: "clear",
    ownership: [
      { name: "Chandra Family Office", pct: 60, type: "Corporate", country: "Singapore", pep: false },
      { name: "M. Chandra", pct: 40, type: "Individual", country: "Singapore", pep: false },
    ],
    reps: [
      { name: "M. Chandra", role: "Director", email: "mc@coastalbulk.example", phone: "+65 6555 2201", idVerified: true },
    ],
    profile: {
      headline: "Regional buyer for Indian and Vietnamese ferroalloy smelters.",
      commodities: ["Manganese ore"],
      annualDemandTonnes: 340000,
      markets: ["IN", "VN", "SG"],
      yearsTrading: 8,
      turnoverUsd: 210000000,
      banking: "DBS: confirmed",
      logistics: "Chartered handysize programme",
    },
    documents: baseDocs("APP-2026"),
    limits: {
      proposedSingleTxnUsd: 60000000,
      proposedMonthlyUsd: 150000000,
      approvedSingleTxnUsd: 0,
      approvedMonthlyUsd: 0,
      tenorDays: 45,
    },
    nonConformities: [
      {
        id: "NC-121",
        title: "Unsigned board resolution",
        severity: "Minor",
        raisedAt: iso(7),
        status: "remediation",
        note: "Signed and dated resolution naming authorised representatives required.",
      },
    ],
    audit: [
      { id: "e1", at: iso(9), actor: "System", action: "Application received", detail: "Buyer onboarding submitted." },
      { id: "e2", at: iso(7), actor: "R. Okonjo (Compliance)", action: "Information requested", detail: "Signed board resolution requested from applicant." },
    ],
    notes: [],
  },
  {
    id: "APP-2018",
    entityName: "Transandino Comercio Ltda",
    type: "Offtaker",
    country: "Brazil",
    jurisdiction: "São Paulo, BR",
    registrationNo: "24.118.902/0001-55",
    vatNo: "IE 116.442.889",
    incorporated: "2012-02-15",
    website: "transandino.example",
    submittedAt: iso(21),
    status: "restricted",
    riskScore: 63,
    riskBand: "High",
    riskFactors: [
      { label: "Litigation history", weight: 20, note: "Two open commercial disputes." },
      { label: "Ownership transparency", weight: 14, note: "Full look-through available." },
      { label: "Payment behaviour", weight: 18, note: "Two late settlements on prior platform trades." },
      { label: "Jurisdiction risk", weight: 11, note: "Medium-risk jurisdiction." },
    ],
    sanctionsScreen: "clear",
    pepScreen: "clear",
    ownership: [
      { name: "R. Duarte", pct: 51, type: "Individual", country: "Brazil", pep: false },
      { name: "Andino Participações SA", pct: 49, type: "Corporate", country: "Brazil", pep: false },
    ],
    reps: [
      { name: "R. Duarte", role: "Socio-Administrador", email: "rd@transandino.example", phone: "+55 11 5555 7710", idVerified: true },
    ],
    profile: {
      headline: "Offtaker for South American ferroalloy producers.",
      commodities: ["Manganese ore", "Silicon"],
      annualDemandTonnes: 180000,
      markets: ["BR", "AR", "CL"],
      yearsTrading: 13,
      turnoverUsd: 95000000,
      banking: "Itaú: confirmed",
      logistics: "Santos port allocation",
    },
    documents: baseDocs("APP-2018"),
    limits: {
      proposedSingleTxnUsd: 30000000,
      proposedMonthlyUsd: 60000000,
      approvedSingleTxnUsd: 5000000,
      approvedMonthlyUsd: 10000000,
      tenorDays: 15,
    },
    nonConformities: [
      {
        id: "NC-088",
        title: "Repeated late settlement",
        severity: "Major",
        raisedAt: iso(18),
        status: "closed",
        note: "Cash-in-advance restriction applied; limits reduced.",
      },
    ],
    audit: [
      { id: "f1", at: iso(21), actor: "System", action: "Application received", detail: "Offtaker onboarding submitted." },
      { id: "f2", at: iso(18), actor: "A. Mensah (Compliance)", action: "Restricted", detail: "Trading permitted on prepayment only; limits capped at $5m." },
    ],
    notes: [],
  },
];

export const seedMiners: Miner[] = [
  { id: "MIN-01", name: "Kalahari Manganese Corp", country: "South Africa", region: "Northern Cape", commodity: "Manganese ore", capacityTpa: 420000, availableTonnes: 300000, grade: "37% Mn", compliance: "verified", esgScore: 78, logistics: "Rail to Port Elizabeth", channels: ["sms", "email", "in_app"], phone: "+27 53 555 0102", email: "trade@kalahari-mn.example" },
  { id: "MIN-02", name: "Nchwaning Resources", country: "South Africa", region: "Kuruman", commodity: "Manganese ore", capacityTpa: 260000, availableTonnes: 220000, grade: "44% Mn", compliance: "verified", esgScore: 81, logistics: "Road to Saldanha", channels: ["email", "in_app"], phone: "+27 53 555 0119", email: "sales@nchwaning.example" },
  { id: "MIN-03", name: "Gabon Moanda Mining SA", country: "Gabon", region: "Haut-Ogooué", commodity: "Manganese ore", capacityTpa: 310000, availableTonnes: 180000, grade: "45% Mn", compliance: "verified", esgScore: 74, logistics: "Transgabonais rail", channels: ["sms", "email"], phone: "+241 11 555 044", email: "export@moanda-mining.example" },
  { id: "MIN-04", name: "Ghana Nsuta Minerals", country: "Ghana", region: "Western", commodity: "Manganese ore", capacityTpa: 180000, availableTonnes: 150000, grade: "32% Mn", compliance: "verified", esgScore: 69, logistics: "Takoradi port", channels: ["sms", "in_app"], phone: "+233 31 555 218", email: "ops@nsuta-minerals.example" },
  { id: "MIN-05", name: "Otjozondu Mining Ltd", country: "Namibia", region: "Otjozondjupa", commodity: "Manganese ore", capacityTpa: 140000, availableTonnes: 120000, grade: "38% Mn", compliance: "verified", esgScore: 72, logistics: "Walvis Bay", channels: ["email", "in_app"], phone: "+264 61 555 337", email: "sales@otjozondu.example" },
  { id: "MIN-06", name: "Bahia Ferro Andina", country: "Brazil", region: "Bahia", commodity: "Manganese ore", capacityTpa: 120000, availableTonnes: 90000, grade: "40% Mn", compliance: "under_review", esgScore: 61, logistics: "Ilhéus port", channels: ["email"], phone: "+55 73 5555 118", email: "comercial@bahiaferro.example" },
  { id: "MIN-07", name: "Sarawak Highlands Mining", country: "Malaysia", region: "Sarawak", commodity: "Manganese ore", capacityTpa: 90000, availableTonnes: 60000, grade: "34% Mn", compliance: "restricted", esgScore: 48, logistics: "Kuching port", channels: ["sms", "email"], phone: "+60 82 555 771", email: "info@sarawakhm.example" },
  { id: "MIN-08", name: "Andes Manganeso SpA", country: "Chile", region: "Coquimbo", commodity: "Manganese ore", capacityTpa: 110000, availableTonnes: 80000, grade: "36% Mn", compliance: "verified", esgScore: 76, logistics: "Coquimbo port", channels: ["sms", "email", "in_app"], phone: "+56 51 555 902", email: "ventas@andesmn.example" },
];

export const seedRfqs: Rfq[] = [
  {
    id: "RFQ-4402",
    reference: "RFQ-4402",
    commodity: "Manganese ore",
    grade: "≥ 36% Mn",
    volumeTonnes: 240000,
    incoterm: "CIF",
    destination: "Rotterdam, NL",
    deliveryWindow: "Q4 2026: Q1 2027",
    targetPriceUsd: 528,
    createdBy: "buyer",
    createdByName: "Coastal Bulk Buyers Pte Ltd",
    createdAt: iso(11),
    status: "contracted",
    allocations: [
      { minerId: "MIN-02", tonnes: 140000, state: "accepted", priceUsdPerTonne: 531 },
      { minerId: "MIN-05", tonnes: 100000, state: "accepted", priceUsdPerTonne: 524 },
    ],
    notifications: [],
  },
];

export const seedOrders: OrderRow[] = [
  { id: "ORD-9911", reference: "ORD-9911", counterparty: "Nchwaning Resources", commodity: "Manganese ore", tonnes: 140000, valueUsd: 74340000, stage: "in transit", updatedAt: iso(1) },
  { id: "ORD-9908", reference: "ORD-9908", counterparty: "Otjozondu Mining Ltd", commodity: "Manganese ore", tonnes: 100000, valueUsd: 52400000, stage: "signed", updatedAt: iso(3) },
  { id: "ORD-9890", reference: "ORD-9890", counterparty: "Kalahari Manganese Corp", commodity: "Manganese ore", tonnes: 60000, valueUsd: 31200000, stage: "settled", updatedAt: iso(16) },
];

export const seedNotifications: Notification[] = [
  { id: "N-1", audience: "operator", title: "New Offtaker application", body: "Meridian Offtake Partners SA submitted onboarding for review.", channel: "in_app", at: iso(2), read: false },
  { id: "N-2", audience: "operator", title: "Critical non-conformity", body: "NC-104 open on Sahel Metals Trading FZE | UBO verification failure.", channel: "in_app", at: iso(5), read: false },
  { id: "N-3", audience: "offtaker", title: "Compliance status update", body: "Your application APP-2041 is in the review queue. Expected decision in 2 business days.", channel: "email", at: iso(2), read: false },
  { id: "N-4", audience: "buyer", title: "Shipment update ORD-9911", body: "Vessel MV Corella departed Saldanha Bay. ETA Rotterdam 14 Sep.", channel: "sms", at: iso(1), read: false },
  { id: "N-5", audience: "oem", title: "Supplier document expiring", body: "Tier-2 supplier map for Anhui Precision Cells expired | re-upload required.", channel: "in_app", at: iso(3), read: true },
];
