// Local mock data for the Beldium Export Compliance prototype.
// No backend — everything here is seeded demo content.

export type Role = "operator" | "exporter" | "regulator";

export type DemoUser = {
  id: string;
  name: string;
  role: Role;
  title: string;
  org: string;
  initials: string;
  exporterId?: string;
};

export const DEMO_USERS: DemoUser[] = [
  {
    id: "u-op",
    name: "Adaeze Nwachukwu",
    role: "operator",
    title: "Compliance Partner / Operator",
    org: "Beldium Compliance Services",
    initials: "AN",
  },
  {
    id: "u-ex",
    name: "Tunde Balogun",
    role: "exporter",
    title: "Export Manager",
    org: "Jos Plateau Minerals Ltd",
    initials: "TB",
    exporterId: "EXP-1042",
  },
  {
    id: "u-reg",
    name: "Halima Suleiman",
    role: "regulator",
    title: "Regulatory Oversight User",
    org: "Solid Minerals Oversight Desk",
    initials: "HS",
  },
];

export type DocStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "replacement_requested"
  | "clarification_requested";

export type DocNote = {
  at: string;
  by: string;
  action: string;
  comment: string;
};

export type ShipmentDocument = {
  id: string;
  name: string;
  category: string;
  issuer: string;
  reference: string;
  issued: string;
  expires?: string | undefined;
  status: DocStatus;
  mandatory: boolean;
  notes: DocNote[];
};

export type Exporter = {
  id: string;
  name: string;
  rcNumber: string;
  state: string;
  contact: string;
  email: string;
  phone: string;
  minerals: string[];
  verification: "verified" | "in_review" | "action_required";
  complianceScore: number;
  onboarded: string;
  licences: { name: string; ref: string; expires: string; status: DocStatus }[];
  kyc: { label: string; value: string; ok: boolean }[];
};

export const EXPORTERS: Exporter[] = [
  {
    id: "EXP-1042",
    name: "Jos Plateau Minerals Ltd",
    rcNumber: "RC 1042871",
    state: "Plateau",
    contact: "Tunde Balogun",
    email: "tunde.balogun@josplateauminerals.ng",
    phone: "+234 803 441 2290",
    minerals: ["Tin (Cassiterite)", "Columbite", "Lead–Zinc"],
    verification: "verified",
    complianceScore: 86,
    onboarded: "2024-03-11",
    licences: [
      { name: "Mineral Buying Centre Licence", ref: "MBC/PL/2211", expires: "2026-11-30", status: "verified" },
      { name: "Mineral Export Permit (per-consignment basis)", ref: "MEP/2026/0184", expires: "2026-09-14", status: "verified" },
      { name: "CAC Certificate of Incorporation", ref: "RC 1042871", expires: "—", status: "verified" },
      { name: "Tax Clearance Certificate", ref: "TCC/PL/88213", expires: "2026-12-31", status: "verified" },
    ],
    kyc: [
      { label: "Directors screened (PEP / sanctions)", value: "3 of 3 cleared", ok: true },
      { label: "Beneficial ownership declared", value: "Complete", ok: true },
      { label: "Bank account verified", value: "Zenith Bank ••4471", ok: true },
      { label: "Site visit report", value: "Bukuru yard, 2026-05-02", ok: true },
    ],
  },
  {
    id: "EXP-1077",
    name: "Kaduna Barytes & Industrial Ltd",
    rcNumber: "RC 1077340",
    state: "Kaduna",
    contact: "Grace Okonjo",
    email: "grace@kadunabarytes.ng",
    phone: "+234 806 220 7714",
    minerals: ["Barytes", "Kaolin"],
    verification: "in_review",
    complianceScore: 64,
    onboarded: "2026-06-19",
    licences: [
      { name: "Small Scale Mining Lease", ref: "SSML/24/7712", expires: "2027-02-28", status: "verified" },
      { name: "Mineral Export Permit (per-consignment basis)", ref: "MEP/2026/0233", expires: "2026-08-30", status: "clarification_requested" },
      { name: "CAC Certificate of Incorporation", ref: "RC 1077340", expires: "—", status: "verified" },
      { name: "Tax Clearance Certificate", ref: "TCC/KD/40118", expires: "2026-12-31", status: "pending" },
    ],
    kyc: [
      { label: "Directors screened (PEP / sanctions)", value: "2 of 3 cleared", ok: false },
      { label: "Beneficial ownership declared", value: "Partial — 1 layer missing", ok: false },
      { label: "Bank account verified", value: "GTBank ••9012", ok: true },
      { label: "Site visit report", value: "Not scheduled", ok: false },
    ],
  },
  {
    id: "EXP-1103",
    name: "Ogun Aggregate & Lithium Co.",
    rcNumber: "RC 1103998",
    state: "Ogun",
    contact: "Segun Adeyemi",
    email: "segun@ogunlithium.ng",
    phone: "+234 701 883 5520",
    minerals: ["Lepidolite", "Feldspar"],
    verification: "action_required",
    complianceScore: 41,
    onboarded: "2026-07-04",
    licences: [
      { name: "Small Scale Mining Lease", ref: "SSML/25/1180", expires: "2026-08-25", status: "replacement_requested" },
      { name: "Mineral Export Permit (per-consignment basis)", ref: "—", expires: "—", status: "pending" },
      { name: "CAC Certificate of Incorporation", ref: "RC 1103998", expires: "—", status: "verified" },
      { name: "Tax Clearance Certificate", ref: "—", expires: "—", status: "rejected" },
    ],
    kyc: [
      { label: "Directors screened (PEP / sanctions)", value: "1 of 2 cleared", ok: false },
      { label: "Beneficial ownership declared", value: "Not declared", ok: false },
      { label: "Bank account verified", value: "Pending", ok: false },
      { label: "Site visit report", value: "Not scheduled", ok: false },
    ],
  },
  {
    id: "EXP-1150",
    name: "Nasarawa Gemstone Exports Ltd",
    rcNumber: "RC 1150662",
    state: "Nasarawa",
    contact: "Ibrahim Danlami",
    email: "ibrahim@nasarawagem.ng",
    phone: "+234 809 774 1203",
    minerals: ["Sapphire", "Tourmaline", "Zircon"],
    verification: "verified",
    complianceScore: 78,
    onboarded: "2025-01-22",
    licences: [
      { name: "Mineral Buying Centre Licence", ref: "MBC/NS/3390", expires: "2026-10-05", status: "verified" },
      { name: "Gemstone Dealer Permit", ref: "GDP/2026/0071", expires: "2027-01-19", status: "verified" },
      { name: "CAC Certificate of Incorporation", ref: "RC 1150662", expires: "—", status: "verified" },
      { name: "Tax Clearance Certificate", ref: "TCC/NS/22190", expires: "2026-12-31", status: "verified" },
    ],
    kyc: [
      { label: "Directors screened (PEP / sanctions)", value: "2 of 2 cleared", ok: true },
      { label: "Beneficial ownership declared", value: "Complete", ok: true },
      { label: "Bank account verified", value: "UBA ••3318", ok: true },
      { label: "Site visit report", value: "Lafia lot, 2026-04-16", ok: true },
    ],
  },
];

export const SECTION_KEYS = [
  "overview",
  "exporter",
  "product",
  "source",
  "quality",
  "quantity",
  "documents",
  "financial",
  "customs",
  "inspection",
  "logistics",
  "regulatory",
  "audit",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  overview: "Overview",
  exporter: "Exporter",
  product: "Product",
  source: "Source",
  quality: "Quality",
  quantity: "Quantity",
  documents: "Documents",
  financial: "Financial",
  customs: "Customs",
  inspection: "Inspection",
  logistics: "Logistics",
  regulatory: "Regulatory",
  audit: "Audit Trail",
};

export type Field = { label: string; value: string; flag?: "warn" | "fail" };

export type ChecklistItem = {
  id: string;
  label: string;
  section: SectionKey;
  state: "pass" | "open" | "fail";
  detail: string;
};

export type NonConformity = {
  id: string;
  title: string;
  severity: "minor" | "major" | "critical";
  section: SectionKey;
  raisedBy: string;
  raisedAt: string;
  status: "open" | "responded" | "closed";
  detail: string;
  response?: string | undefined;
};

export type AuditEntry = {
  at: string;
  actor: string;
  role: Role | "system";
  action: string;
  detail: string;
};

export type ShipmentStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "info_requested"
  | "cleared"
  | "conditionally_cleared"
  | "declined";

export type Shipment = {
  id: string;
  reference: string;
  exporterId: string;
  mineral: string;
  hsCode: string;
  grade: string;
  quantity: string;
  destination: string;
  buyer: string;
  port: string;
  incoterm: string;
  valueUsd: number;
  etd: string;
  submitted: string;
  status: ShipmentStatus;
  riskScore: number;
  riskBand: "low" | "medium" | "high";
  riskFactors: { label: string; weight: number; note: string }[];
  sections: Partial<Record<SectionKey, Field[]>>;
  documents: ShipmentDocument[];
  checklist: ChecklistItem[];
  nonConformities: NonConformity[];
  audit: AuditEntry[];
  decision?: {
    outcome: "cleared" | "conditionally_cleared" | "declined";
    by: string;
    at: string;
    rationale: string;
    conditions?: string | undefined;
  };
};

const doc = (
  id: string,
  name: string,
  category: string,
  issuer: string,
  reference: string,
  issued: string,
  status: DocStatus,
  mandatory = true,
  expires?: string,
): ShipmentDocument => ({
  id,
  name,
  category,
  issuer,
  reference,
  issued,
  expires,
  status,
  mandatory,
  notes: [],
});

export const SHIPMENTS: Shipment[] = [
  {
    id: "SHP-2026-0416",
    reference: "BEL/TIN/0416",
    exporterId: "EXP-1042",
    mineral: "Tin ore concentrate (Cassiterite)",
    hsCode: "2609.00.00",
    grade: "70.4% Sn",
    quantity: "24.000 MT",
    destination: "Rotterdam, Netherlands",
    buyer: "Nyrstar Commodities BV",
    port: "Apapa Port, Lagos",
    incoterm: "FOB Apapa",
    valueUsd: 612_400,
    etd: "2026-09-08",
    submitted: "2026-08-14",
    status: "in_review",
    riskScore: 38,
    riskBand: "medium",
    riskFactors: [
      { label: "Assay variance vs. buyer spec", weight: 14, note: "Lab Sn 70.4% vs contract minimum 70.0% — within tolerance but close." },
      { label: "Origin concentration", weight: 12, note: "82% of lot from a single ASM cluster in Barkin Ladi." },
      { label: "Route history", weight: 6, note: "Apapa corridor — 0 incidents on exporter's last 9 consignments." },
      { label: "Exporter track record", weight: 6, note: "Compliance score 86, no open non-conformities in 12 months." },
    ],
    sections: {
      overview: [
        { label: "Consignment reference", value: "BEL/TIN/0416" },
        { label: "Compliance stage", value: "Operator review — documents 6 of 8 verified" },
        { label: "Target vessel", value: "MV Bonny Star, voy. 118E" },
        { label: "Days to ETD", value: "18" },
        { label: "Assigned reviewer", value: "Adaeze Nwachukwu" },
        { label: "Beldium record type", value: "Compliance verification record (not a government permit)" },
      ],
      exporter: [
        { label: "Exporter", value: "Jos Plateau Minerals Ltd" },
        { label: "RC number", value: "RC 1042871" },
        { label: "Verification state", value: "Verified 2026-05-02" },
        { label: "Compliance score", value: "86 / 100" },
        { label: "Open non-conformities", value: "1 (minor)" },
        { label: "Authorised signatory", value: "Tunde Balogun, Export Manager" },
      ],
      product: [
        { label: "Commodity", value: "Tin ore concentrate (Cassiterite)" },
        { label: "HS code", value: "2609.00.00" },
        { label: "Form", value: "Gravity-separated concentrate, -2mm" },
        { label: "Packaging", value: "480 × 50kg woven bags, palletised" },
        { label: "Contract spec", value: "Sn ≥ 70.0%, Fe ≤ 1.5%, moisture ≤ 4.0%" },
        { label: "Dual-use screening", value: "Not applicable" },
      ],
      source: [
        { label: "Primary source", value: "Barkin Ladi ASM cluster, Plateau State" },
        { label: "Mining title", value: "SSML/PL/2114 (Kanu Cooperative)" },
        { label: "Secondary source", value: "Bukuru buying centre stock (18%)" },
        { label: "Chain of custody", value: "Bag-level tags reconciled to weighbridge tickets", flag: "warn" },
        { label: "Community/ESG attestation", value: "Signed 2026-07-30" },
        { label: "Conflict-affected area screening", value: "Cleared" },
      ],
      quality: [
        { label: "Independent assay", value: "SGS Lagos, cert. LG-26-44810" },
        { label: "Sn content", value: "70.4%" },
        { label: "Fe content", value: "1.2%" },
        { label: "Moisture at loading", value: "3.6%" },
        { label: "Radioactivity screen", value: "0.9 µSv/h — below 2.0 threshold" },
        { label: "Sampling method", value: "ISO 12743 lot sampling, 3 sub-lots" },
      ],
      quantity: [
        { label: "Declared net weight", value: "24.000 MT" },
        { label: "Weighbridge total", value: "24.062 MT", flag: "warn" },
        { label: "Variance", value: "+0.26% (tolerance ±0.5%)" },
        { label: "Bag count", value: "480" },
        { label: "Tare deduction", value: "0.062 MT" },
        { label: "Reconciliation status", value: "Awaiting final loadport tally" },
      ],
      financial: [
        { label: "Invoice value", value: "USD 612,400.00" },
        { label: "Unit price", value: "USD 25,516.67 / MT" },
        { label: "Payment terms", value: "70% LC at sight, 30% on final assay" },
        { label: "LC issuing bank", value: "ING Bank N.V., Amsterdam" },
        { label: "NXP form", value: "NXP/2026/LAG/44120 — Zenith Bank" },
        { label: "Repatriation undertaking", value: "On file" },
      ],
      customs: [
        { label: "Declarant", value: "Seaflow Clearing & Forwarding Ltd" },
        { label: "SGD number", value: "C-2026-APA-88214" },
        { label: "Customs office", value: "Apapa Area Command I" },
        { label: "Duty/levy status", value: "Export levy assessed — NGN 1,842,000" },
        { label: "Pre-shipment inspection", value: "Scheduled 2026-08-29" },
        { label: "Prohibited/restricted check", value: "Clear" },
      ],
      inspection: [
        { label: "Inspection body", value: "Cotecna Nigeria" },
        { label: "Yard inspection", value: "Completed 2026-08-12" },
        { label: "Seal number", value: "NG-SEAL-771204" },
        { label: "Photographic evidence", value: "42 images on file" },
        { label: "Stuffing supervision", value: "Pending — booked 2026-09-02" },
        { label: "Findings", value: "2 bags re-stitched, no loss recorded" },
      ],
      logistics: [
        { label: "Container", value: "1 × 20' GP — MSKU 442118-3" },
        { label: "Carrier", value: "Maersk Line" },
        { label: "Booking ref", value: "MAEU-9932441" },
        { label: "Loading port", value: "Apapa Port, Lagos" },
        { label: "Discharge port", value: "Rotterdam" },
        { label: "ETD / ETA", value: "2026-09-08 / 2026-10-02" },
      ],
      regulatory: [
        { label: "Mineral export permit", value: "MEP/2026/0184 — valid to 2026-09-14" },
        { label: "Royalty payment", value: "Receipt MMSD/RY/22118 attached" },
        { label: "Regulatory notification", value: "Oversight desk notified 2026-08-15" },
        { label: "Outstanding regulator requests", value: "1 — origin evidence clarification" },
        { label: "Beldium record status", value: "Draft compliance record (non-governmental)" },
        { label: "Sanctions/embargo screen", value: "Buyer and vessel cleared" },
      ],
    },
    documents: [
      doc("D1", "Commercial Invoice", "Financial", "Jos Plateau Minerals Ltd", "INV-JPM-4416", "2026-08-12", "verified"),
      doc("D2", "Packing List", "Logistics", "Jos Plateau Minerals Ltd", "PL-4416", "2026-08-12", "verified"),
      doc("D3", "SGS Assay Certificate", "Quality", "SGS Nigeria Ltd", "LG-26-44810", "2026-08-10", "verified"),
      doc("D4", "Mineral Export Permit", "Regulatory", "Mines Inspectorate", "MEP/2026/0184", "2026-07-28", "verified", true, "2026-09-14"),
      doc("D5", "Royalty Payment Receipt", "Regulatory", "MMSD Revenue", "MMSD/RY/22118", "2026-08-01", "verified"),
      doc("D6", "Weighbridge Tickets (bundle)", "Quantity", "Bukuru Weighbridge", "WB-0416-A", "2026-08-11", "pending"),
      doc("D7", "Chain of Custody Declaration", "Source", "Kanu Cooperative", "COC-0416", "2026-08-09", "clarification_requested"),
      doc("D8", "NXP Form", "Financial", "Zenith Bank Plc", "NXP/2026/LAG/44120", "2026-08-13", "verified"),
      doc("D9", "Certificate of Origin", "Customs", "NACCIMA", "CO/LAG/26/7741", "2026-08-13", "pending", true, "2026-11-13"),
      doc("D10", "Marine Insurance Cover Note", "Logistics", "Leadway Assurance", "MI-88213", "2026-08-14", "verified", false),
    ],
    checklist: [
      { id: "C1", label: "Exporter verification current", section: "exporter", state: "pass", detail: "Verified 2026-05-02, renewal due 2027-05-02." },
      { id: "C2", label: "All mandatory documents verified", section: "documents", state: "open", detail: "3 of 9 mandatory documents outstanding." },
      { id: "C3", label: "Assay within contract specification", section: "quality", state: "pass", detail: "Sn 70.4% vs minimum 70.0%." },
      { id: "C4", label: "Quantity reconciled to weighbridge", section: "quantity", state: "open", detail: "Loadport tally pending; +0.26% variance noted." },
      { id: "C5", label: "Chain of custody traceable to titled source", section: "source", state: "open", detail: "Clarification requested on 18% buying-centre stock." },
      { id: "C6", label: "Export levy and royalty settled", section: "customs", state: "pass", detail: "Receipts on file." },
      { id: "C7", label: "Sanctions and buyer screening clear", section: "regulatory", state: "pass", detail: "Screened 2026-08-14." },
      { id: "C8", label: "Pre-shipment inspection scheduled", section: "inspection", state: "pass", detail: "Cotecna, 2026-08-29." },
    ],
    nonConformities: [
      {
        id: "NC-0416-1",
        title: "Chain of custody gap on buying-centre stock",
        severity: "minor",
        section: "source",
        raisedBy: "Adaeze Nwachukwu",
        raisedAt: "2026-08-16",
        status: "responded",
        detail: "18% of the lot sourced from Bukuru buying centre lacks bag-level tag references linking back to a titled pit.",
        response: "Exporter supplied purchase ledger extract on 2026-08-18; tag reconciliation still incomplete.",
      },
    ],
    audit: [
      { at: "2026-08-14 09:12", actor: "Tunde Balogun", role: "exporter", action: "Shipment submitted", detail: "10 documents attached." },
      { at: "2026-08-14 11:40", actor: "Beldium Engine", role: "system", action: "Risk scored", detail: "Score 38 (medium) — 4 contributing factors." },
      { at: "2026-08-15 08:05", actor: "Adaeze Nwachukwu", role: "operator", action: "Review started", detail: "Assigned to reviewer." },
      { at: "2026-08-15 10:22", actor: "Adaeze Nwachukwu", role: "operator", action: "Document verified", detail: "SGS Assay Certificate LG-26-44810." },
      { at: "2026-08-16 14:31", actor: "Adaeze Nwachukwu", role: "operator", action: "Non-conformity raised", detail: "NC-0416-1 chain of custody gap (minor)." },
      { at: "2026-08-18 09:47", actor: "Tunde Balogun", role: "exporter", action: "Response submitted", detail: "Purchase ledger extract uploaded." },
      { at: "2026-08-19 16:02", actor: "Halima Suleiman", role: "regulator", action: "Information requested", detail: "Origin evidence clarification." },
    ],
  },
  {
    id: "SHP-2026-0421",
    reference: "BEL/LEP/0421",
    exporterId: "EXP-1103",
    mineral: "Lepidolite ore (lithium-bearing)",
    hsCode: "2530.90.00",
    grade: "2.1% Li2O",
    quantity: "180.000 MT",
    destination: "Ningbo, China",
    buyer: "Zhejiang Huayou Import & Export",
    port: "Onne Port, Rivers",
    incoterm: "CIF Ningbo",
    valueUsd: 486_000,
    etd: "2026-09-19",
    submitted: "2026-08-17",
    status: "info_requested",
    riskScore: 74,
    riskBand: "high",
    riskFactors: [
      { label: "Unverified exporter", weight: 26, note: "Exporter verification incomplete — KYC and beneficial ownership outstanding." },
      { label: "Raw lithium ore export scrutiny", weight: 20, note: "Unprocessed lithium ore attracts heightened policy review." },
      { label: "Missing export permit", weight: 18, note: "No mineral export permit reference supplied." },
      { label: "Assay source", weight: 10, note: "Assay issued by non-accredited in-house lab." },
    ],
    sections: {
      overview: [
        { label: "Consignment reference", value: "BEL/LEP/0421" },
        { label: "Compliance stage", value: "Information requested from exporter" },
        { label: "Blocking issues", value: "3 critical", flag: "fail" },
        { label: "Days to ETD", value: "29" },
        { label: "Assigned reviewer", value: "Adaeze Nwachukwu" },
        { label: "Beldium record type", value: "Compliance verification record (not a government permit)" },
      ],
      exporter: [
        { label: "Exporter", value: "Ogun Aggregate & Lithium Co." },
        { label: "RC number", value: "RC 1103998" },
        { label: "Verification state", value: "Action required", flag: "fail" },
        { label: "Compliance score", value: "41 / 100", flag: "fail" },
        { label: "Open non-conformities", value: "2 (1 critical)" },
        { label: "Authorised signatory", value: "Segun Adeyemi, Director" },
      ],
      product: [
        { label: "Commodity", value: "Lepidolite ore, unprocessed" },
        { label: "HS code", value: "2530.90.00" },
        { label: "Form", value: "Run-of-mine lumps, -80mm" },
        { label: "Packaging", value: "Bulk in 6 × 20' containers" },
        { label: "Contract spec", value: "Li2O ≥ 2.0%" },
        { label: "Beneficiation status", value: "None — raw ore", flag: "fail" },
      ],
      source: [
        { label: "Primary source", value: "Ijero-adjacent artisanal pits (declared)" },
        { label: "Mining title", value: "SSML/25/1180 — expiring 2026-08-25", flag: "warn" },
        { label: "Chain of custody", value: "Not evidenced", flag: "fail" },
        { label: "Community/ESG attestation", value: "Not provided", flag: "fail" },
        { label: "Child labour screening", value: "Outstanding", flag: "fail" },
        { label: "Conflict-affected area screening", value: "Cleared" },
      ],
      quality: [
        { label: "Assay", value: "In-house lab report, uncertified", flag: "fail" },
        { label: "Li2O content", value: "2.1% (unverified)" },
        { label: "Moisture", value: "Not reported", flag: "warn" },
        { label: "Radioactivity screen", value: "Not performed", flag: "fail" },
        { label: "Sampling method", value: "Not documented", flag: "warn" },
        { label: "Recommended action", value: "Independent SGS/Cotecna assay required" },
      ],
      quantity: [
        { label: "Declared net weight", value: "180.000 MT" },
        { label: "Weighbridge total", value: "Not supplied", flag: "fail" },
        { label: "Variance", value: "Cannot be computed" },
        { label: "Container count", value: "6 × 20'" },
        { label: "Tare deduction", value: "Not supplied" },
        { label: "Reconciliation status", value: "Blocked" },
      ],
      financial: [
        { label: "Invoice value", value: "USD 486,000.00" },
        { label: "Unit price", value: "USD 2,700.00 / MT" },
        { label: "Payment terms", value: "30% advance TT, 70% against BL copy" },
        { label: "Advance received", value: "USD 145,800 on 2026-08-06" },
        { label: "NXP form", value: "Not opened", flag: "fail" },
        { label: "Repatriation undertaking", value: "Missing", flag: "fail" },
      ],
      customs: [
        { label: "Declarant", value: "Not appointed", flag: "warn" },
        { label: "SGD number", value: "—" },
        { label: "Customs office", value: "Onne Area Command" },
        { label: "Duty/levy status", value: "Unassessed" },
        { label: "Pre-shipment inspection", value: "Not booked", flag: "fail" },
        { label: "Prohibited/restricted check", value: "Policy review required for raw lithium ore", flag: "warn" },
      ],
      inspection: [
        { label: "Inspection body", value: "Not appointed", flag: "fail" },
        { label: "Yard inspection", value: "Not performed" },
        { label: "Seal number", value: "—" },
        { label: "Photographic evidence", value: "6 images (low quality)" },
        { label: "Stuffing supervision", value: "Not booked" },
        { label: "Findings", value: "—" },
      ],
      logistics: [
        { label: "Container", value: "6 × 20' GP — numbers pending" },
        { label: "Carrier", value: "CMA CGM (indicative)" },
        { label: "Booking ref", value: "Provisional" },
        { label: "Loading port", value: "Onne Port, Rivers" },
        { label: "Discharge port", value: "Ningbo" },
        { label: "ETD / ETA", value: "2026-09-19 / 2026-11-04" },
      ],
      regulatory: [
        { label: "Mineral export permit", value: "Not supplied", flag: "fail" },
        { label: "Royalty payment", value: "No receipt on file", flag: "fail" },
        { label: "Regulatory notification", value: "Oversight desk flagged 2026-08-19" },
        { label: "Outstanding regulator requests", value: "1 — title validity confirmation" },
        { label: "Beldium record status", value: "Blocked — cannot issue compliance record" },
        { label: "Sanctions/embargo screen", value: "Buyer cleared" },
      ],
    },
    documents: [
      doc("D1", "Proforma Invoice", "Financial", "Ogun Aggregate & Lithium Co.", "PI-OAL-221", "2026-08-15", "pending"),
      doc("D2", "Packing List", "Logistics", "Ogun Aggregate & Lithium Co.", "PL-221", "2026-08-15", "rejected"),
      doc("D3", "In-house Assay Report", "Quality", "OAL Laboratory", "OAL-LAB-88", "2026-08-14", "replacement_requested"),
      doc("D4", "Small Scale Mining Lease", "Source", "Mining Cadastre Office", "SSML/25/1180", "2025-08-26", "clarification_requested", true, "2026-08-25"),
      doc("D5", "Mineral Export Permit", "Regulatory", "Mines Inspectorate", "—", "—", "pending"),
      doc("D6", "Royalty Payment Receipt", "Regulatory", "MMSD Revenue", "—", "—", "pending"),
      doc("D7", "Chain of Custody Declaration", "Source", "Ogun Aggregate & Lithium Co.", "—", "—", "pending"),
      doc("D8", "Tax Clearance Certificate", "Financial", "FIRS", "—", "—", "rejected"),
    ],
    checklist: [
      { id: "C1", label: "Exporter verification current", section: "exporter", state: "fail", detail: "KYC incomplete; beneficial ownership undeclared." },
      { id: "C2", label: "All mandatory documents verified", section: "documents", state: "fail", detail: "0 of 8 verified." },
      { id: "C3", label: "Independent assay on file", section: "quality", state: "fail", detail: "Only uncertified in-house report supplied." },
      { id: "C4", label: "Quantity reconciled to weighbridge", section: "quantity", state: "fail", detail: "No weighbridge evidence." },
      { id: "C5", label: "Mining title valid through ETD", section: "source", state: "fail", detail: "SSML expires 2026-08-25, before ETD 2026-09-19." },
      { id: "C6", label: "Export levy and royalty settled", section: "customs", state: "open", detail: "Unassessed." },
      { id: "C7", label: "Sanctions and buyer screening clear", section: "regulatory", state: "pass", detail: "Screened 2026-08-18." },
      { id: "C8", label: "Pre-shipment inspection scheduled", section: "inspection", state: "open", detail: "Not booked." },
    ],
    nonConformities: [
      {
        id: "NC-0421-1",
        title: "Mining title expires before shipment date",
        severity: "critical",
        section: "source",
        raisedBy: "Adaeze Nwachukwu",
        raisedAt: "2026-08-18",
        status: "open",
        detail: "SSML/25/1180 expires 2026-08-25 while ETD is 2026-09-19. A valid title must cover the extraction and export window.",
      },
      {
        id: "NC-0421-2",
        title: "Assay not issued by an accredited laboratory",
        severity: "major",
        section: "quality",
        raisedBy: "Adaeze Nwachukwu",
        raisedAt: "2026-08-18",
        status: "open",
        detail: "Li2O grade is supported only by an in-house report. Independent ISO 17025 assay required before any compliance record can be issued.",
      },
    ],
    audit: [
      { at: "2026-08-17 15:20", actor: "Segun Adeyemi", role: "exporter", action: "Shipment submitted", detail: "8 documents attached." },
      { at: "2026-08-17 15:22", actor: "Beldium Engine", role: "system", action: "Risk scored", detail: "Score 74 (high) — 4 contributing factors." },
      { at: "2026-08-18 08:44", actor: "Adaeze Nwachukwu", role: "operator", action: "Review started", detail: "Escalated to senior review." },
      { at: "2026-08-18 09:10", actor: "Adaeze Nwachukwu", role: "operator", action: "Replacement requested", detail: "In-house Assay Report — accredited assay required." },
      { at: "2026-08-18 09:35", actor: "Adaeze Nwachukwu", role: "operator", action: "Non-conformity raised", detail: "NC-0421-1 (critical), NC-0421-2 (major)." },
      { at: "2026-08-19 11:12", actor: "Halima Suleiman", role: "regulator", action: "Shipment flagged", detail: "Raw lithium ore — policy review." },
    ],
  },
  {
    id: "SHP-2026-0399",
    reference: "BEL/BAR/0399",
    exporterId: "EXP-1077",
    mineral: "Barytes (drilling grade, 4.20 SG)",
    hsCode: "2511.10.00",
    grade: "4.21 SG",
    quantity: "600.000 MT",
    destination: "Houston, United States",
    buyer: "Gulf Drilling Supplies LLC",
    port: "Warri Port, Delta",
    incoterm: "FOB Warri",
    valueUsd: 138_000,
    etd: "2026-08-31",
    submitted: "2026-08-05",
    status: "in_review",
    riskScore: 52,
    riskBand: "medium",
    riskFactors: [
      { label: "Exporter verification in progress", weight: 18, note: "Site visit not yet completed." },
      { label: "Document expiry proximity", weight: 14, note: "Export permit expires 2026-08-30, one day before ETD." },
      { label: "Bulk quantity variance history", weight: 12, note: "Prior consignment showed 1.1% short-shipment." },
      { label: "Destination compliance", weight: 8, note: "US buyer requires API 13A conformity statement." },
    ],
    sections: {
      overview: [
        { label: "Consignment reference", value: "BEL/BAR/0399" },
        { label: "Compliance stage", value: "Operator review — quantity reconciliation" },
        { label: "Target vessel", value: "MV Delta Trader, voy. 44W" },
        { label: "Days to ETD", value: "9", flag: "warn" },
        { label: "Assigned reviewer", value: "Adaeze Nwachukwu" },
        { label: "Beldium record type", value: "Compliance verification record (not a government permit)" },
      ],
      exporter: [
        { label: "Exporter", value: "Kaduna Barytes & Industrial Ltd" },
        { label: "RC number", value: "RC 1077340" },
        { label: "Verification state", value: "In review", flag: "warn" },
        { label: "Compliance score", value: "64 / 100" },
        { label: "Open non-conformities", value: "1 (major)" },
        { label: "Authorised signatory", value: "Grace Okonjo, Managing Director" },
      ],
      product: [
        { label: "Commodity", value: "Barytes, drilling grade" },
        { label: "HS code", value: "2511.10.00" },
        { label: "Form", value: "Milled powder, 200 mesh" },
        { label: "Packaging", value: "600 × 1MT jumbo bags" },
        { label: "Contract spec", value: "SG ≥ 4.20, soluble alkaline earth ≤ 250 mg/kg" },
        { label: "Standard conformity", value: "API 13A statement pending", flag: "warn" },
      ],
      source: [
        { label: "Primary source", value: "Azara barytes field, Nasarawa" },
        { label: "Mining title", value: "SSML/24/7712 (valid to 2027-02-28)" },
        { label: "Processing site", value: "Kaduna milling plant" },
        { label: "Chain of custody", value: "Plant intake logs reconciled" },
        { label: "Community/ESG attestation", value: "Signed 2026-06-11" },
        { label: "Conflict-affected area screening", value: "Cleared" },
      ],
      quality: [
        { label: "Independent assay", value: "Cotecna Port Harcourt, cert. PH-26-1180" },
        { label: "Specific gravity", value: "4.21" },
        { label: "Soluble alkaline earth", value: "190 mg/kg" },
        { label: "Moisture", value: "0.8%" },
        { label: "Particle size (200 mesh pass)", value: "97.4%" },
        { label: "Sampling method", value: "Composite from 12 bags" },
      ],
      quantity: [
        { label: "Declared net weight", value: "600.000 MT" },
        { label: "Weighbridge total", value: "593.400 MT", flag: "fail" },
        { label: "Variance", value: "-1.10% (tolerance ±0.5%)", flag: "fail" },
        { label: "Bag count", value: "600 jumbo bags" },
        { label: "Tare deduction", value: "1.200 MT" },
        { label: "Reconciliation status", value: "Non-conformity raised" },
      ],
      financial: [
        { label: "Invoice value", value: "USD 138,000.00" },
        { label: "Unit price", value: "USD 230.00 / MT" },
        { label: "Payment terms", value: "100% LC at sight" },
        { label: "LC issuing bank", value: "JPMorgan Chase, Houston" },
        { label: "NXP form", value: "NXP/2026/WAR/33102 — GTBank" },
        { label: "Repatriation undertaking", value: "On file" },
      ],
      customs: [
        { label: "Declarant", value: "Deltaway Logistics Ltd" },
        { label: "SGD number", value: "C-2026-WAR-11907" },
        { label: "Customs office", value: "Warri Area Command" },
        { label: "Duty/levy status", value: "Assessed — NGN 604,000" },
        { label: "Pre-shipment inspection", value: "Completed 2026-08-16" },
        { label: "Prohibited/restricted check", value: "Clear" },
      ],
      inspection: [
        { label: "Inspection body", value: "Cotecna Nigeria" },
        { label: "Yard inspection", value: "Completed 2026-08-16" },
        { label: "Seal number", value: "NG-SEAL-660118" },
        { label: "Photographic evidence", value: "88 images on file" },
        { label: "Stuffing supervision", value: "Completed" },
        { label: "Findings", value: "7 bags below nominal weight", flag: "warn" },
      ],
      logistics: [
        { label: "Container", value: "24 × 20' GP" },
        { label: "Carrier", value: "PIL" },
        { label: "Booking ref", value: "PIL-7710223" },
        { label: "Loading port", value: "Warri Port, Delta" },
        { label: "Discharge port", value: "Houston" },
        { label: "ETD / ETA", value: "2026-08-31 / 2026-09-28" },
      ],
      regulatory: [
        { label: "Mineral export permit", value: "MEP/2026/0233 — expires 2026-08-30", flag: "warn" },
        { label: "Royalty payment", value: "Receipt MMSD/RY/21880 attached" },
        { label: "Regulatory notification", value: "Oversight desk notified 2026-08-06" },
        { label: "Outstanding regulator requests", value: "0" },
        { label: "Beldium record status", value: "Draft compliance record (non-governmental)" },
        { label: "Sanctions/embargo screen", value: "Buyer and vessel cleared" },
      ],
    },
    documents: [
      doc("D1", "Commercial Invoice", "Financial", "Kaduna Barytes & Industrial Ltd", "INV-KBI-0399", "2026-08-04", "verified"),
      doc("D2", "Packing List", "Logistics", "Kaduna Barytes & Industrial Ltd", "PL-0399", "2026-08-04", "verified"),
      doc("D3", "Cotecna Assay Certificate", "Quality", "Cotecna Nigeria", "PH-26-1180", "2026-08-03", "verified"),
      doc("D4", "Mineral Export Permit", "Regulatory", "Mines Inspectorate", "MEP/2026/0233", "2026-02-28", "clarification_requested", true, "2026-08-30"),
      doc("D5", "Weighbridge Tickets (bundle)", "Quantity", "Kaduna Plant Weighbridge", "WB-0399", "2026-08-14", "rejected"),
      doc("D6", "API 13A Conformity Statement", "Product", "Kaduna Barytes & Industrial Ltd", "—", "—", "pending"),
      doc("D7", "Royalty Payment Receipt", "Regulatory", "MMSD Revenue", "MMSD/RY/21880", "2026-07-30", "verified"),
      doc("D8", "NXP Form", "Financial", "Guaranty Trust Bank", "NXP/2026/WAR/33102", "2026-08-05", "verified"),
      doc("D9", "Pre-shipment Inspection Report", "Inspection", "Cotecna Nigeria", "PSI-0399", "2026-08-16", "verified"),
    ],
    checklist: [
      { id: "C1", label: "Exporter verification current", section: "exporter", state: "open", detail: "Site visit outstanding." },
      { id: "C2", label: "All mandatory documents verified", section: "documents", state: "open", detail: "6 of 9 verified." },
      { id: "C3", label: "Assay within contract specification", section: "quality", state: "pass", detail: "SG 4.21 vs minimum 4.20." },
      { id: "C4", label: "Quantity reconciled to weighbridge", section: "quantity", state: "fail", detail: "-1.10% variance exceeds ±0.5% tolerance." },
      { id: "C5", label: "Mining title valid through ETD", section: "source", state: "pass", detail: "Valid to 2027-02-28." },
      { id: "C6", label: "Export permit valid through ETD", section: "regulatory", state: "open", detail: "Permit expires 2026-08-30, ETD 2026-08-31." },
      { id: "C7", label: "Sanctions and buyer screening clear", section: "regulatory", state: "pass", detail: "Screened 2026-08-05." },
      { id: "C8", label: "Pre-shipment inspection completed", section: "inspection", state: "pass", detail: "Cotecna, 2026-08-16." },
    ],
    nonConformities: [
      {
        id: "NC-0399-1",
        title: "Net weight variance exceeds tolerance",
        severity: "major",
        section: "quantity",
        raisedBy: "Adaeze Nwachukwu",
        raisedAt: "2026-08-15",
        status: "open",
        detail: "Weighbridge total 593.400 MT against a declared 600.000 MT (-1.10%). Either the invoice quantity is amended or the shortfall is made up before stuffing closes.",
      },
    ],
    audit: [
      { at: "2026-08-05 10:02", actor: "Grace Okonjo", role: "exporter", action: "Shipment submitted", detail: "9 documents attached." },
      { at: "2026-08-05 10:04", actor: "Beldium Engine", role: "system", action: "Risk scored", detail: "Score 52 (medium)." },
      { at: "2026-08-14 13:15", actor: "Adaeze Nwachukwu", role: "operator", action: "Document rejected", detail: "Weighbridge Tickets — totals inconsistent with invoice." },
      { at: "2026-08-15 09:00", actor: "Adaeze Nwachukwu", role: "operator", action: "Non-conformity raised", detail: "NC-0399-1 quantity variance (major)." },
      { at: "2026-08-16 17:41", actor: "Cotecna Nigeria", role: "system", action: "Inspection report received", detail: "PSI-0399 uploaded." },
    ],
  },
  {
    id: "SHP-2026-0388",
    reference: "BEL/SAP/0388",
    exporterId: "EXP-1150",
    mineral: "Rough sapphire (unheated)",
    hsCode: "7103.10.00",
    grade: "Mixed 2–14 ct",
    quantity: "3.480 kg",
    destination: "Bangkok, Thailand",
    buyer: "Chanthaburi Gem House Co.",
    port: "Murtala Muhammed Intl (air)",
    incoterm: "CIP Bangkok",
    valueUsd: 214_500,
    etd: "2026-08-27",
    submitted: "2026-08-02",
    status: "cleared",
    riskScore: 24,
    riskBand: "low",
    riskFactors: [
      { label: "High-value low-volume cargo", weight: 12, note: "Gemstones require sealed-parcel handling and valuation evidence." },
      { label: "Valuation subjectivity", weight: 8, note: "Independent gemmological valuation obtained." },
      { label: "Exporter track record", weight: 4, note: "Compliance score 78, 14 clean consignments." },
    ],
    sections: {
      overview: [
        { label: "Consignment reference", value: "BEL/SAP/0388" },
        { label: "Compliance stage", value: "Cleared 2026-08-20" },
        { label: "Flight", value: "Ethiopian Airlines ET901, AWB 071-88214410" },
        { label: "Days to ETD", value: "5" },
        { label: "Assigned reviewer", value: "Adaeze Nwachukwu" },
        { label: "Beldium record type", value: "Compliance verification record (not a government permit)" },
      ],
      exporter: [
        { label: "Exporter", value: "Nasarawa Gemstone Exports Ltd" },
        { label: "RC number", value: "RC 1150662" },
        { label: "Verification state", value: "Verified 2026-04-16" },
        { label: "Compliance score", value: "78 / 100" },
        { label: "Open non-conformities", value: "0" },
        { label: "Authorised signatory", value: "Ibrahim Danlami, Director" },
      ],
      product: [
        { label: "Commodity", value: "Rough sapphire, unheated" },
        { label: "HS code", value: "7103.10.00" },
        { label: "Form", value: "Sorted rough, 4 parcels" },
        { label: "Packaging", value: "Tamper-evident sealed parcels in strongbox" },
        { label: "Contract spec", value: "Mixed 2–14 ct, commercial to fine" },
        { label: "Treatment disclosure", value: "No treatment applied" },
      ],
      source: [
        { label: "Primary source", value: "Mai Kunkele workings, Nasarawa State" },
        { label: "Mining title", value: "SSML/NS/0912 (Danlami Family Holdings)" },
        { label: "Chain of custody", value: "Parcel-level custody sheets complete" },
        { label: "Community/ESG attestation", value: "Signed 2026-05-30" },
        { label: "Child labour screening", value: "Independent audit passed" },
        { label: "Conflict-affected area screening", value: "Cleared" },
      ],
      quality: [
        { label: "Gemmological report", value: "Gem Testing Lab Lagos, GTL-26-3390" },
        { label: "Total carat weight", value: "17,400 ct" },
        { label: "Colour range", value: "Blue to blue-green, medium tone" },
        { label: "Clarity", value: "Type II, typical inclusions" },
        { label: "Treatment testing", value: "No heat evidence detected" },
        { label: "Valuation basis", value: "Independent per-parcel valuation" },
      ],
      quantity: [
        { label: "Declared net weight", value: "3.480 kg" },
        { label: "Verified weight", value: "3.480 kg" },
        { label: "Variance", value: "0.00%" },
        { label: "Parcel count", value: "4" },
        { label: "Seal numbers", value: "GS-1140 to GS-1143" },
        { label: "Reconciliation status", value: "Complete" },
      ],
      financial: [
        { label: "Invoice value", value: "USD 214,500.00" },
        { label: "Valuation check", value: "Within 4% of independent valuation" },
        { label: "Payment terms", value: "100% TT in advance" },
        { label: "Funds received", value: "2026-08-08" },
        { label: "NXP form", value: "NXP/2026/LAG/43110 — UBA" },
        { label: "Repatriation undertaking", value: "Discharged" },
      ],
      customs: [
        { label: "Declarant", value: "Skyline Air Clearing Ltd" },
        { label: "SGD number", value: "C-2026-MMA-55021" },
        { label: "Customs office", value: "MMIA Export Command" },
        { label: "Duty/levy status", value: "Assessed and paid" },
        { label: "Pre-shipment inspection", value: "Completed 2026-08-18" },
        { label: "Prohibited/restricted check", value: "Clear" },
      ],
      inspection: [
        { label: "Inspection body", value: "Gem Testing Lab Lagos" },
        { label: "Vault inspection", value: "Completed 2026-08-18" },
        { label: "Seal verification", value: "4 of 4 intact" },
        { label: "Photographic evidence", value: "120 images, per-parcel" },
        { label: "Escort arrangement", value: "Armed escort to MMIA confirmed" },
        { label: "Findings", value: "No discrepancies" },
      ],
      logistics: [
        { label: "Mode", value: "Air freight, valuable cargo protocol" },
        { label: "Carrier", value: "Ethiopian Airlines" },
        { label: "AWB", value: "071-88214410" },
        { label: "Departure", value: "Murtala Muhammed Intl (LOS)" },
        { label: "Arrival", value: "Suvarnabhumi (BKK)" },
        { label: "ETD / ETA", value: "2026-08-27 / 2026-08-29" },
      ],
      regulatory: [
        { label: "Gemstone dealer permit", value: "GDP/2026/0071 — valid to 2027-01-19" },
        { label: "Royalty payment", value: "Receipt MMSD/RY/21440 attached" },
        { label: "Regulatory notification", value: "Oversight desk acknowledged 2026-08-19" },
        { label: "Outstanding regulator requests", value: "0" },
        { label: "Beldium record status", value: "Compliance record issued BEL-CR-0388" },
        { label: "Sanctions/embargo screen", value: "Buyer cleared" },
      ],
    },
    documents: [
      doc("D1", "Commercial Invoice", "Financial", "Nasarawa Gemstone Exports Ltd", "INV-NGE-0388", "2026-08-01", "verified"),
      doc("D2", "Parcel Manifest", "Logistics", "Nasarawa Gemstone Exports Ltd", "PM-0388", "2026-08-01", "verified"),
      doc("D3", "Gemmological Report", "Quality", "Gem Testing Lab Lagos", "GTL-26-3390", "2026-07-30", "verified"),
      doc("D4", "Gemstone Dealer Permit", "Regulatory", "Mines Inspectorate", "GDP/2026/0071", "2026-01-20", "verified", true, "2027-01-19"),
      doc("D5", "Independent Valuation", "Financial", "Adeyinka Gem Valuers", "VAL-0388", "2026-07-31", "verified"),
      doc("D6", "Chain of Custody Sheets", "Source", "Danlami Family Holdings", "COC-0388", "2026-07-28", "verified"),
      doc("D7", "Royalty Payment Receipt", "Regulatory", "MMSD Revenue", "MMSD/RY/21440", "2026-07-29", "verified"),
      doc("D8", "Air Waybill", "Logistics", "Ethiopian Airlines", "071-88214410", "2026-08-19", "verified"),
    ],
    checklist: [
      { id: "C1", label: "Exporter verification current", section: "exporter", state: "pass", detail: "Verified 2026-04-16." },
      { id: "C2", label: "All mandatory documents verified", section: "documents", state: "pass", detail: "8 of 8 verified." },
      { id: "C3", label: "Gemmological report on file", section: "quality", state: "pass", detail: "GTL-26-3390." },
      { id: "C4", label: "Weight and seals reconciled", section: "quantity", state: "pass", detail: "4 seals intact, 0.00% variance." },
      { id: "C5", label: "Valuation supported independently", section: "financial", state: "pass", detail: "Within 4% of independent valuation." },
      { id: "C6", label: "Export levy and royalty settled", section: "customs", state: "pass", detail: "Paid 2026-07-29." },
      { id: "C7", label: "Sanctions and buyer screening clear", section: "regulatory", state: "pass", detail: "Screened 2026-08-02." },
      { id: "C8", label: "Pre-shipment inspection completed", section: "inspection", state: "pass", detail: "2026-08-18." },
    ],
    nonConformities: [],
    audit: [
      { at: "2026-08-02 08:30", actor: "Ibrahim Danlami", role: "exporter", action: "Shipment submitted", detail: "8 documents attached." },
      { at: "2026-08-02 08:32", actor: "Beldium Engine", role: "system", action: "Risk scored", detail: "Score 24 (low)." },
      { at: "2026-08-18 16:10", actor: "Adaeze Nwachukwu", role: "operator", action: "All documents verified", detail: "8 of 8 verified." },
      { at: "2026-08-19 10:05", actor: "Halima Suleiman", role: "regulator", action: "Acknowledged", detail: "Oversight desk acknowledged the record." },
      { at: "2026-08-20 09:15", actor: "Adaeze Nwachukwu", role: "operator", action: "Compliance decision", detail: "Cleared — record BEL-CR-0388 issued." },
    ],
    decision: {
      outcome: "cleared",
      by: "Adaeze Nwachukwu",
      at: "2026-08-20 09:15",
      rationale:
        "All mandatory documents verified, weights and seals reconciled, independent valuation supports the declared value, and no open non-conformities remain.",
    },
  },
  {
    id: "SHP-2026-0430",
    reference: "BEL/COL/0430",
    exporterId: "EXP-1042",
    mineral: "Columbite–tantalite concentrate",
    hsCode: "2615.90.00",
    grade: "48% Nb2O5 / 12% Ta2O5",
    quantity: "12.500 MT",
    destination: "Antwerp, Belgium",
    buyer: "Traxys Europe S.A.",
    port: "Apapa Port, Lagos",
    incoterm: "FOB Apapa",
    valueUsd: 398_750,
    etd: "2026-09-25",
    submitted: "2026-08-20",
    status: "submitted",
    riskScore: 46,
    riskBand: "medium",
    riskFactors: [
      { label: "3TG responsible sourcing scope", weight: 20, note: "Tantalum falls within OECD due-diligence expectations; upstream evidence required." },
      { label: "Radioactivity screening", weight: 12, note: "Columbite lots can exceed transport thresholds; screening result pending." },
      { label: "Multiple source pits", weight: 8, note: "Lot aggregated from 4 pits." },
      { label: "Exporter track record", weight: 6, note: "Compliance score 86." },
    ],
    sections: {
      overview: [
        { label: "Consignment reference", value: "BEL/COL/0430" },
        { label: "Compliance stage", value: "Awaiting operator pickup" },
        { label: "Target vessel", value: "MV Antwerp Spirit, voy. 22E" },
        { label: "Days to ETD", value: "35" },
        { label: "Assigned reviewer", value: "Unassigned", flag: "warn" },
        { label: "Beldium record type", value: "Compliance verification record (not a government permit)" },
      ],
      exporter: [
        { label: "Exporter", value: "Jos Plateau Minerals Ltd" },
        { label: "RC number", value: "RC 1042871" },
        { label: "Verification state", value: "Verified 2026-05-02" },
        { label: "Compliance score", value: "86 / 100" },
        { label: "Open non-conformities", value: "0 on this consignment" },
        { label: "Authorised signatory", value: "Tunde Balogun, Export Manager" },
      ],
      product: [
        { label: "Commodity", value: "Columbite–tantalite concentrate" },
        { label: "HS code", value: "2615.90.00" },
        { label: "Form", value: "Concentrate, -1mm" },
        { label: "Packaging", value: "250 × 50kg bags" },
        { label: "Contract spec", value: "Nb2O5 ≥ 45%, Ta2O5 ≥ 10%" },
        { label: "3TG classification", value: "In scope — tantalum" },
      ],
      source: [
        { label: "Primary source", value: "Jos South pits 1–4" },
        { label: "Mining title", value: "SSML/PL/2114" },
        { label: "Upstream due diligence", value: "OECD Annex II questionnaire submitted" },
        { label: "Chain of custody", value: "Pit-level tags on 4 sub-lots" },
        { label: "Community/ESG attestation", value: "Signed 2026-08-05" },
        { label: "Conflict-affected area screening", value: "Cleared" },
      ],
      quality: [
        { label: "Independent assay", value: "Pending — SGS booked 2026-08-26" },
        { label: "Nb2O5 (declared)", value: "48%" },
        { label: "Ta2O5 (declared)", value: "12%" },
        { label: "Moisture", value: "2.9%" },
        { label: "Radioactivity screen", value: "Pending", flag: "warn" },
        { label: "Sampling method", value: "ISO 12743, 4 sub-lots" },
      ],
      quantity: [
        { label: "Declared net weight", value: "12.500 MT" },
        { label: "Weighbridge total", value: "12.504 MT" },
        { label: "Variance", value: "+0.03%" },
        { label: "Bag count", value: "250" },
        { label: "Tare deduction", value: "0.004 MT" },
        { label: "Reconciliation status", value: "Provisional" },
      ],
      financial: [
        { label: "Invoice value", value: "USD 398,750.00" },
        { label: "Unit price", value: "USD 31,900.00 / MT" },
        { label: "Payment terms", value: "80% provisional on BL, 20% final assay" },
        { label: "LC issuing bank", value: "KBC Bank NV, Brussels" },
        { label: "NXP form", value: "Application lodged" },
        { label: "Repatriation undertaking", value: "On file" },
      ],
      customs: [
        { label: "Declarant", value: "Seaflow Clearing & Forwarding Ltd" },
        { label: "SGD number", value: "Pending" },
        { label: "Customs office", value: "Apapa Area Command I" },
        { label: "Duty/levy status", value: "Not yet assessed" },
        { label: "Pre-shipment inspection", value: "To be booked" },
        { label: "Prohibited/restricted check", value: "Clear" },
      ],
      inspection: [
        { label: "Inspection body", value: "SGS Nigeria (proposed)" },
        { label: "Yard inspection", value: "Not started" },
        { label: "Seal number", value: "—" },
        { label: "Photographic evidence", value: "18 images (intake)" },
        { label: "Stuffing supervision", value: "To be booked" },
        { label: "Findings", value: "—" },
      ],
      logistics: [
        { label: "Container", value: "1 × 20' GP — to be nominated" },
        { label: "Carrier", value: "MSC" },
        { label: "Booking ref", value: "Pending" },
        { label: "Loading port", value: "Apapa Port, Lagos" },
        { label: "Discharge port", value: "Antwerp" },
        { label: "ETD / ETA", value: "2026-09-25 / 2026-10-21" },
      ],
      regulatory: [
        { label: "Mineral export permit", value: "Application lodged 2026-08-19" },
        { label: "Royalty payment", value: "Assessment pending" },
        { label: "Regulatory notification", value: "Not yet notified" },
        { label: "Outstanding regulator requests", value: "0" },
        { label: "Beldium record status", value: "Not started" },
        { label: "Sanctions/embargo screen", value: "Buyer cleared" },
      ],
    },
    documents: [
      doc("D1", "Proforma Invoice", "Financial", "Jos Plateau Minerals Ltd", "PI-JPM-4430", "2026-08-19", "pending"),
      doc("D2", "Packing List", "Logistics", "Jos Plateau Minerals Ltd", "PL-4430", "2026-08-19", "pending"),
      doc("D3", "OECD Annex II Questionnaire", "Source", "Jos Plateau Minerals Ltd", "DD-4430", "2026-08-18", "pending"),
      doc("D4", "Pit-level Custody Tags", "Source", "Kanu Cooperative", "COC-4430", "2026-08-18", "pending"),
      doc("D5", "Weighbridge Tickets (bundle)", "Quantity", "Bukuru Weighbridge", "WB-4430", "2026-08-19", "pending"),
      doc("D6", "Independent Assay Certificate", "Quality", "SGS Nigeria Ltd", "—", "—", "pending"),
      doc("D7", "Mineral Export Permit", "Regulatory", "Mines Inspectorate", "Application lodged", "2026-08-19", "pending"),
    ],
    checklist: [
      { id: "C1", label: "Exporter verification current", section: "exporter", state: "pass", detail: "Verified 2026-05-02." },
      { id: "C2", label: "All mandatory documents verified", section: "documents", state: "open", detail: "0 of 7 reviewed — awaiting pickup." },
      { id: "C3", label: "Independent assay on file", section: "quality", state: "open", detail: "SGS booked 2026-08-26." },
      { id: "C4", label: "Radioactivity screening within limits", section: "quality", state: "open", detail: "Screening pending." },
      { id: "C5", label: "OECD upstream due diligence evidenced", section: "source", state: "open", detail: "Questionnaire submitted, review pending." },
      { id: "C6", label: "Export permit issued", section: "regulatory", state: "open", detail: "Application lodged 2026-08-19." },
      { id: "C7", label: "Sanctions and buyer screening clear", section: "regulatory", state: "pass", detail: "Screened 2026-08-20." },
      { id: "C8", label: "Pre-shipment inspection scheduled", section: "inspection", state: "open", detail: "To be booked." },
    ],
    nonConformities: [],
    audit: [
      { at: "2026-08-20 12:04", actor: "Tunde Balogun", role: "exporter", action: "Shipment submitted", detail: "7 documents attached." },
      { at: "2026-08-20 12:05", actor: "Beldium Engine", role: "system", action: "Risk scored", detail: "Score 46 (medium) — 3TG scope flagged." },
    ],
  },
  {
    id: "SHP-2026-0362",
    reference: "BEL/ZIR/0362",
    exporterId: "EXP-1150",
    mineral: "Zircon sand",
    hsCode: "2615.10.00",
    grade: "65.2% ZrO2",
    quantity: "300.000 MT",
    destination: "Mumbai, India",
    buyer: "Sunrise Ceramics Pvt Ltd",
    port: "Onne Port, Rivers",
    incoterm: "CFR Mumbai",
    valueUsd: 372_000,
    etd: "2026-07-28",
    submitted: "2026-07-02",
    status: "conditionally_cleared",
    riskScore: 33,
    riskBand: "medium",
    riskFactors: [
      { label: "NORM handling requirements", weight: 16, note: "Zircon is naturally radioactive; transport documentation must reflect NORM handling." },
      { label: "Long-standing buyer", weight: 6, note: "Fifth consignment to this buyer." },
      { label: "Port congestion", weight: 5, note: "Onne delays averaging 6 days." },
    ],
    sections: {
      overview: [
        { label: "Consignment reference", value: "BEL/ZIR/0362" },
        { label: "Compliance stage", value: "Conditionally cleared 2026-07-21" },
        { label: "Target vessel", value: "MV Indian Ocean, voy. 09E" },
        { label: "Condition", value: "NORM handling annex to be filed before stuffing", flag: "warn" },
        { label: "Assigned reviewer", value: "Adaeze Nwachukwu" },
        { label: "Beldium record type", value: "Compliance verification record (not a government permit)" },
      ],
      exporter: [
        { label: "Exporter", value: "Nasarawa Gemstone Exports Ltd" },
        { label: "RC number", value: "RC 1150662" },
        { label: "Verification state", value: "Verified 2026-04-16" },
        { label: "Compliance score", value: "78 / 100" },
        { label: "Open non-conformities", value: "1 (minor, closed)" },
        { label: "Authorised signatory", value: "Ibrahim Danlami, Director" },
      ],
      product: [
        { label: "Commodity", value: "Zircon sand" },
        { label: "HS code", value: "2615.10.00" },
        { label: "Form", value: "Washed sand, 100–200 µm" },
        { label: "Packaging", value: "300 × 1MT jumbo bags" },
        { label: "Contract spec", value: "ZrO2 ≥ 65.0%, Fe2O3 ≤ 0.12%" },
        { label: "NORM classification", value: "Exempt material, handling annex required" },
      ],
      source: [
        { label: "Primary source", value: "Benue river placer concession" },
        { label: "Mining title", value: "SSML/BN/4471" },
        { label: "Chain of custody", value: "Plant intake logs reconciled" },
        { label: "Community/ESG attestation", value: "Signed 2026-04-02" },
        { label: "Rehabilitation bond", value: "Current" },
        { label: "Conflict-affected area screening", value: "Cleared" },
      ],
      quality: [
        { label: "Independent assay", value: "SGS Port Harcourt, cert. PH-26-0902" },
        { label: "ZrO2 content", value: "65.2%" },
        { label: "Fe2O3", value: "0.09%" },
        { label: "Moisture", value: "0.4%" },
        { label: "Radioactivity screen", value: "1.4 µSv/h — within exemption" },
        { label: "Sampling method", value: "Auger sampling, 15 increments" },
      ],
      quantity: [
        { label: "Declared net weight", value: "300.000 MT" },
        { label: "Weighbridge total", value: "300.180 MT" },
        { label: "Variance", value: "+0.06%" },
        { label: "Bag count", value: "300" },
        { label: "Tare deduction", value: "0.180 MT" },
        { label: "Reconciliation status", value: "Complete" },
      ],
      financial: [
        { label: "Invoice value", value: "USD 372,000.00" },
        { label: "Unit price", value: "USD 1,240.00 / MT" },
        { label: "Payment terms", value: "100% LC at 30 days" },
        { label: "LC issuing bank", value: "State Bank of India, Mumbai" },
        { label: "NXP form", value: "NXP/2026/ONN/29110 — UBA" },
        { label: "Repatriation undertaking", value: "On file" },
      ],
      customs: [
        { label: "Declarant", value: "Riverline Clearing Ltd" },
        { label: "SGD number", value: "C-2026-ONN-33810" },
        { label: "Customs office", value: "Onne Area Command" },
        { label: "Duty/levy status", value: "Assessed and paid" },
        { label: "Pre-shipment inspection", value: "Completed 2026-07-14" },
        { label: "Prohibited/restricted check", value: "Clear" },
      ],
      inspection: [
        { label: "Inspection body", value: "SGS Nigeria" },
        { label: "Yard inspection", value: "Completed 2026-07-14" },
        { label: "Seal number", value: "NG-SEAL-551190" },
        { label: "Photographic evidence", value: "64 images" },
        { label: "Stuffing supervision", value: "Completed 2026-07-22" },
        { label: "Findings", value: "No discrepancies" },
      ],
      logistics: [
        { label: "Container", value: "12 × 20' GP" },
        { label: "Carrier", value: "Hapag-Lloyd" },
        { label: "Booking ref", value: "HLCU-4410228" },
        { label: "Loading port", value: "Onne Port, Rivers" },
        { label: "Discharge port", value: "Nhava Sheva, Mumbai" },
        { label: "ETD / ETA", value: "2026-07-28 / 2026-08-21" },
      ],
      regulatory: [
        { label: "Mineral export permit", value: "MEP/2026/0140 — valid to 2026-08-31" },
        { label: "Royalty payment", value: "Receipt MMSD/RY/20880 attached" },
        { label: "NORM handling annex", value: "Outstanding condition", flag: "warn" },
        { label: "Outstanding regulator requests", value: "0" },
        { label: "Beldium record status", value: "Conditional record BEL-CR-0362 issued" },
        { label: "Sanctions/embargo screen", value: "Buyer cleared" },
      ],
    },
    documents: [
      doc("D1", "Commercial Invoice", "Financial", "Nasarawa Gemstone Exports Ltd", "INV-NGE-0362", "2026-07-01", "verified"),
      doc("D2", "Packing List", "Logistics", "Nasarawa Gemstone Exports Ltd", "PL-0362", "2026-07-01", "verified"),
      doc("D3", "SGS Assay Certificate", "Quality", "SGS Nigeria Ltd", "PH-26-0902", "2026-06-28", "verified"),
      doc("D4", "Mineral Export Permit", "Regulatory", "Mines Inspectorate", "MEP/2026/0140", "2026-02-01", "verified", true, "2026-08-31"),
      doc("D5", "Radiation Screening Report", "Quality", "SGS Nigeria Ltd", "RAD-0362", "2026-06-28", "verified"),
      doc("D6", "NORM Handling Annex", "Logistics", "Riverline Clearing Ltd", "—", "—", "clarification_requested"),
      doc("D7", "Royalty Payment Receipt", "Regulatory", "MMSD Revenue", "MMSD/RY/20880", "2026-06-27", "verified"),
      doc("D8", "Bill of Lading (draft)", "Logistics", "Hapag-Lloyd", "HLCU-4410228", "2026-07-20", "verified"),
    ],
    checklist: [
      { id: "C1", label: "Exporter verification current", section: "exporter", state: "pass", detail: "Verified 2026-04-16." },
      { id: "C2", label: "All mandatory documents verified", section: "documents", state: "open", detail: "7 of 8 verified; NORM annex outstanding." },
      { id: "C3", label: "Assay within contract specification", section: "quality", state: "pass", detail: "ZrO2 65.2%." },
      { id: "C4", label: "Radioactivity within exemption limits", section: "quality", state: "pass", detail: "1.4 µSv/h." },
      { id: "C5", label: "Quantity reconciled to weighbridge", section: "quantity", state: "pass", detail: "+0.06%." },
      { id: "C6", label: "Export levy and royalty settled", section: "customs", state: "pass", detail: "Paid 2026-06-27." },
      { id: "C7", label: "Sanctions and buyer screening clear", section: "regulatory", state: "pass", detail: "Screened 2026-07-02." },
      { id: "C8", label: "Pre-shipment inspection completed", section: "inspection", state: "pass", detail: "2026-07-14." },
    ],
    nonConformities: [
      {
        id: "NC-0362-1",
        title: "NORM handling annex not filed",
        severity: "minor",
        section: "logistics",
        raisedBy: "Adaeze Nwachukwu",
        raisedAt: "2026-07-18",
        status: "responded",
        detail: "Zircon sand requires a NORM handling annex attached to the transport file before stuffing closes.",
        response: "Clearing agent confirmed the annex will be filed with the carrier before the 2026-07-22 stuffing window.",
      },
    ],
    audit: [
      { at: "2026-07-02 09:00", actor: "Ibrahim Danlami", role: "exporter", action: "Shipment submitted", detail: "8 documents attached." },
      { at: "2026-07-14 15:20", actor: "SGS Nigeria", role: "system", action: "Inspection report received", detail: "Yard inspection passed." },
      { at: "2026-07-18 10:40", actor: "Adaeze Nwachukwu", role: "operator", action: "Non-conformity raised", detail: "NC-0362-1 NORM annex (minor)." },
      { at: "2026-07-21 11:55", actor: "Adaeze Nwachukwu", role: "operator", action: "Compliance decision", detail: "Conditionally cleared pending NORM annex." },
    ],
  },
];

export type MonitoringEvent = {
  id: string;
  at: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  shipmentId?: string;
  exporterId?: string;
};

export const MONITORING_EVENTS: MonitoringEvent[] = [
  {
    id: "EV-901",
    at: "2026-08-21 07:40",
    severity: "critical",
    title: "Mining title expires before ETD",
    detail: "SSML/25/1180 (Ogun Aggregate & Lithium Co.) expires 2026-08-25; shipment BEL/LEP/0421 departs 2026-09-19.",
    shipmentId: "SHP-2026-0421",
    exporterId: "EXP-1103",
  },
  {
    id: "EV-902",
    at: "2026-08-21 06:15",
    severity: "warning",
    title: "Export permit expiring in 9 days",
    detail: "MEP/2026/0233 (Kaduna Barytes) expires 2026-08-30, one day before the vessel's ETD.",
    shipmentId: "SHP-2026-0399",
    exporterId: "EXP-1077",
  },
  {
    id: "EV-903",
    at: "2026-08-20 18:02",
    severity: "warning",
    title: "Quantity variance beyond tolerance",
    detail: "BEL/BAR/0399 weighbridge total is 1.10% below the declared net weight.",
    shipmentId: "SHP-2026-0399",
  },
  {
    id: "EV-904",
    at: "2026-08-20 12:05",
    severity: "info",
    title: "New consignment submitted",
    detail: "BEL/COL/0430 submitted by Jos Plateau Minerals Ltd, awaiting operator pickup.",
    shipmentId: "SHP-2026-0430",
  },
  {
    id: "EV-905",
    at: "2026-08-19 16:02",
    severity: "info",
    title: "Regulator information request",
    detail: "Oversight desk requested origin evidence clarification on BEL/TIN/0416.",
    shipmentId: "SHP-2026-0416",
  },
  {
    id: "EV-906",
    at: "2026-08-19 09:31",
    severity: "warning",
    title: "Exporter verification stalled",
    detail: "Kaduna Barytes & Industrial Ltd site visit has not been scheduled 63 days after onboarding.",
    exporterId: "EXP-1077",
  },
  {
    id: "EV-907",
    at: "2026-08-18 09:35",
    severity: "critical",
    title: "Two non-conformities raised",
    detail: "BEL/LEP/0421 — expired title (critical) and unaccredited assay (major).",
    shipmentId: "SHP-2026-0421",
  },
  {
    id: "EV-908",
    at: "2026-08-17 14:20",
    severity: "info",
    title: "Compliance record issued",
    detail: "BEL-CR-0388 issued for rough sapphire consignment to Bangkok.",
    shipmentId: "SHP-2026-0388",
  },
];

export const MINERAL_OPTIONS = [
  "Tin ore concentrate (Cassiterite)",
  "Columbite–tantalite concentrate",
  "Lead–Zinc concentrate",
  "Barytes (drilling grade)",
  "Zircon sand",
  "Lepidolite ore (lithium-bearing)",
  "Rough sapphire",
  "Tourmaline",
  "Kaolin",
  "Gold doré",
];

export const PORT_OPTIONS = [
  "Apapa Port, Lagos",
  "Tin Can Island Port, Lagos",
  "Onne Port, Rivers",
  "Warri Port, Delta",
  "Calabar Port, Cross River",
  "Murtala Muhammed Intl (air)",
];

export const INCOTERM_OPTIONS = ["FOB", "CFR", "CIF", "CIP", "EXW", "DAP"];

export const DISCLAIMER =
  "Beldium issues an independent compliance verification record. It is not a government permit, licence, or customs clearance and does not replace any statutory approval.";
