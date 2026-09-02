/**
 * SAMPLE / DEMO DATA — Beldium Warehousing Compliance prototype.
 * Fictional companies, people and documents used for demonstration only.
 * No real regulatory records are represented here.
 */

export type RoleId = "partner" | "operator" | "regulator";

export type ReviewStatus = "pending" | "approved" | "conditional" | "rejected" | "info-requested";

export interface DemoRole {
  id: RoleId;
  title: string;
  org: string;
  person: string;
  initials: string;
  blurb: string;
  home: string;
  demoEmail: string;
}

export const ROLES: DemoRole[] = [
  {
    id: "partner",
    title: "Warehouse Compliance Partner",
    org: "Beldium Compliance Partners (External Reviewer)",
    person: "Adaeze Nwachukwu",
    initials: "AN",
    blurb:
      "Review warehouse applications, score risk, order inspections, raise non-conformities and issue decisions.",
    home: "/partner",
    demoEmail: "a.nwachukwu@beldium-partners.demo",
  },
  {
    id: "operator",
    title: "Warehouse Operator / Manager",
    org: "Sahel Minerals & Logistics Ltd — Apapa Mineral Terminal",
    person: "Ibrahim Bello",
    initials: "IB",
    blurb:
      "Run daily site operations: capacity, receipts, batches, release authorisation, documents and incidents.",
    home: "/operator",
    demoEmail: "i.bello@sahelminerals.demo",
  },
  {
    id: "regulator",
    title: "Regulatory Oversight Officer",
    org: "Solid Minerals Oversight Desk (read-only)",
    person: "Funmilayo Adeyemi",
    initials: "FA",
    blurb:
      "Read-only visibility of registered facilities, certificates, inspections, incidents and market alerts.",
    home: "/regulator",
    demoEmail: "f.adeyemi@oversight.demo",
  },
];

export const roleById = (id: RoleId) => ROLES.find((r) => r.id === id)!;

/* ------------------------------------------------------------------ */
/* Partner: applications                                               */
/* ------------------------------------------------------------------ */

export interface ApplicationSummary {
  id: string;
  ref: string;
  company: string;
  facility: string;
  state: string;
  commodities: string;
  submitted: string;
  slaDue: string;
  riskScore: number;
  status: ReviewStatus;
  reviewer: string;
  capacityTonnes: number;
}

export const APPLICATIONS: ApplicationSummary[] = [
  {
    id: "APP-2026-0147",
    ref: "BWC/APP/2026/0147",
    company: "Sahel Minerals & Logistics Ltd",
    facility: "Apapa Mineral Terminal — Warehouse Block B",
    state: "Lagos",
    commodities: "Lead-zinc concentrate, Barite, Tin ore",
    submitted: "2026-07-28",
    slaDue: "2026-08-25",
    riskScore: 88,
    status: "pending",
    reviewer: "Adaeze Nwachukwu",
    capacityTonnes: 42000,
  },
  {
    id: "APP-2026-0151",
    ref: "BWC/APP/2026/0151",
    company: "Jos Plateau Mineral Handling Plc",
    facility: "Bukuru Consolidation Yard",
    state: "Plateau",
    commodities: "Columbite, Cassiterite",
    submitted: "2026-08-03",
    slaDue: "2026-08-31",
    riskScore: 74,
    status: "pending",
    reviewer: "Adaeze Nwachukwu",
    capacityTonnes: 18500,
  },
  {
    id: "APP-2026-0153",
    ref: "BWC/APP/2026/0153",
    company: "Kaduna Barite Processing Ltd",
    facility: "Rigachikun Bagging Warehouse",
    state: "Kaduna",
    commodities: "Barite (API grade)",
    submitted: "2026-08-06",
    slaDue: "2026-09-03",
    riskScore: 61,
    status: "info-requested",
    reviewer: "Adaeze Nwachukwu",
    capacityTonnes: 9200,
  },
  {
    id: "APP-2026-0139",
    ref: "BWC/APP/2026/0139",
    company: "Ogun Granite & Aggregates Ltd",
    facility: "Ewekoro Bulk Store 2",
    state: "Ogun",
    commodities: "Granite aggregate, Limestone",
    submitted: "2026-07-11",
    slaDue: "2026-08-08",
    riskScore: 82,
    status: "conditional",
    reviewer: "Chinedu Okafor",
    capacityTonnes: 27000,
  },
  {
    id: "APP-2026-0128",
    ref: "BWC/APP/2026/0128",
    company: "Zamfara Gold Aggregators Ltd",
    facility: "Gusau Secure Vault & Store",
    state: "Zamfara",
    commodities: "Gold doré, Alluvial concentrate",
    submitted: "2026-06-22",
    slaDue: "2026-07-20",
    riskScore: 38,
    status: "rejected",
    reviewer: "Chinedu Okafor",
    capacityTonnes: 1200,
  },
  {
    id: "APP-2026-0118",
    ref: "BWC/APP/2026/0118",
    company: "Port Harcourt Industrial Minerals Ltd",
    facility: "Trans-Amadi Warehouse 4",
    state: "Rivers",
    commodities: "Kaolin, Silica sand",
    submitted: "2026-06-02",
    slaDue: "2026-06-30",
    riskScore: 91,
    status: "approved",
    reviewer: "Adaeze Nwachukwu",
    capacityTonnes: 15400,
  },
];

/* ------------------------------------------------------------------ */
/* Focus application detail — APP-2026-0147                            */
/* ------------------------------------------------------------------ */

export const FOCUS_APP_ID = "APP-2026-0147";

export const COMPANY_PROFILE = {
  legalName: "Sahel Minerals & Logistics Limited",
  tradingName: "Sahel Minerals",
  cac: "RC 1428907",
  tin: "20941736-0001",
  incorporated: "12 March 2014",
  companyType: "Private Company Limited by Shares",
  headOffice: "14B Creek Road, Apapa, Lagos State, Nigeria",
  mineralTitle: "MSL 24118 (Mineral Buying Centre licence, Federal Ministry of Solid Minerals)",
  directors: [
    { name: "Musa Abdulkareem", role: "Managing Director", bvnVerified: true },
    { name: "Grace Effiong", role: "Executive Director, Operations", bvnVerified: true },
    { name: "Tunde Bakare-Ojo", role: "Non-Executive Director", bvnVerified: false },
  ],
  shareholding: [
    { holder: "Sahel Holdings Ltd", percent: 62 },
    { holder: "Marama Resources BV (Netherlands)", percent: 25 },
    { holder: "Musa Abdulkareem", percent: 13 },
  ],
  bankers: "Zenith Bank Plc — Apapa Corporate Branch",
  annualTurnover: "₦8.4bn (FY2025, audited)",
  staffCount: 148,
};

export const FACILITY_PROFILE = {
  name: "Apapa Mineral Terminal — Warehouse Block B",
  address: "Plot 7, Berth Access Road, Apapa Port Complex, Lagos State",
  coordinates: "6.4432° N, 3.3661° E",
  landTitle: "Certificate of Occupancy LS/CO/2019/44120 (leasehold to 2044)",
  builtArea: "18,400 m² covered · 6,200 m² hardstanding",
  capacity: "42,000 tonnes (bulk bays + bagged racking)",
  bays: 6,
  weighbridges: "2 × 80 t Avery Berkel, calibrated 14 May 2026",
  loadingDocks: 8,
  laboratory: "On-site XRF assay lab (Bruker S1 Titan), NMDPRA-registered sampler",
  security: "24/7 manned guarding (Halogen Security), 46 CCTV cameras, 30-day retention",
  fireSystem: "Hydrant ring main + 2,400 m³ static tank, foam trolleys, 74 extinguishers",
  contact: "Ibrahim Bello — Facility Manager · +234 803 555 0142",
};

export type EvidenceState = "verified" | "attention" | "missing";

export interface ReviewItem {
  label: string;
  detail: string;
  document?: string;
  issued?: string;
  expires?: string;
  state: EvidenceState;
}

export interface ReviewSection {
  id: string;
  title: string;
  icon: string;
  summary: string;
  items: ReviewItem[];
}

export const REVIEW_SECTIONS: ReviewSection[] = [
  {
    id: "corporate",
    title: "Corporate & Legal",
    icon: "Building2",
    summary: "Registration, ownership and tax standing verified against submitted certificates.",
    items: [
      {
        label: "CAC certificate of incorporation",
        detail: "RC 1428907 — Sahel Minerals & Logistics Limited",
        document: "CAC-RC1428907-incorporation.pdf",
        issued: "2014-03-12",
        state: "verified",
      },
      {
        label: "CAC status report (CAC 1.1)",
        detail: "Directors and shareholding match declared structure",
        document: "CAC-status-report-2026.pdf",
        issued: "2026-06-30",
        state: "verified",
      },
      {
        label: "FIRS tax clearance certificate",
        detail: "TIN 20941736-0001, three-year clearance",
        document: "FIRS-TCC-2025.pdf",
        issued: "2026-02-18",
        expires: "2027-02-17",
        state: "verified",
      },
      {
        label: "Foreign shareholder disclosure",
        detail: "Marama Resources BV (25%) — UBO declaration filed, notarisation pending",
        document: "UBO-declaration-marama.pdf",
        state: "attention",
      },
      {
        label: "Mineral buying centre licence",
        detail: "MSL 24118, Federal Ministry of Solid Minerals Development",
        document: "MSL-24118.pdf",
        expires: "2027-05-31",
        state: "verified",
      },
    ],
  },
  {
    id: "facility",
    title: "Facility & Infrastructure",
    icon: "Warehouse",
    summary: "Site tenure, structural integrity and storage layout suitable for declared commodities.",
    items: [
      {
        label: "Certificate of occupancy",
        detail: "LS/CO/2019/44120 — leasehold to 2044",
        document: "CofO-LS-2019-44120.pdf",
        state: "verified",
      },
      {
        label: "Structural integrity report",
        detail: "Roof truss and floor slab load rating 8 t/m² — Femi Ogundipe & Partners",
        document: "structural-integrity-2026.pdf",
        issued: "2026-04-09",
        state: "verified",
      },
      {
        label: "Weighbridge calibration",
        detail: "2 × 80 t units, Federal Weights & Measures seal",
        document: "weighbridge-calibration.pdf",
        issued: "2026-05-14",
        expires: "2027-05-13",
        state: "verified",
      },
      {
        label: "Drainage & bunding of concentrate bays",
        detail: "Bay B4 bund wall cracked at north corner — remediation quoted, not executed",
        state: "attention",
      },
    ],
  },
  {
    id: "safety",
    title: "Health & Safety",
    icon: "HardHat",
    summary: "Fire, dust and occupational controls broadly compliant; one training gap noted.",
    items: [
      {
        label: "Lagos State Fire Service certificate",
        detail: "Annual fire safety certificate for Block B",
        document: "LSFS-cert-2026.pdf",
        issued: "2026-01-22",
        expires: "2027-01-21",
        state: "verified",
      },
      {
        label: "Respirable dust monitoring",
        detail: "Lead-in-air 0.031 mg/m³ (limit 0.05) across 12 sample points",
        document: "dust-survey-q2-2026.pdf",
        issued: "2026-06-11",
        state: "verified",
      },
      {
        label: "Confined space & silo entry training",
        detail: "9 of 24 bay operatives have lapsed certification",
        state: "attention",
      },
      {
        label: "Emergency response plan & drill log",
        detail: "Two evacuation drills completed in 2026; average clearance 4m 12s",
        document: "erp-drill-log-2026.pdf",
        state: "verified",
      },
    ],
  },
  {
    id: "environmental",
    title: "Environmental",
    icon: "Leaf",
    summary: "EIA and effluent permits current; heavy-metal runoff monitoring must be extended.",
    items: [
      {
        label: "Environmental impact assessment approval",
        detail: "Federal Ministry of Environment, ref FMEnv/EIA/LA/2211",
        document: "EIA-approval-FMEnv.pdf",
        issued: "2023-09-04",
        state: "verified",
      },
      {
        label: "Lagos State environmental permit (LASEPA)",
        detail: "Facility operating permit — bulk mineral storage",
        document: "LASEPA-permit-2026.pdf",
        expires: "2026-11-30",
        state: "attention",
      },
      {
        label: "Stormwater heavy-metal monitoring",
        detail: "Only 2 of 4 discharge points sampled in Q2 2026",
        state: "attention",
      },
      {
        label: "Waste & tailings disposal contract",
        detail: "Licensed handler: Ecoserve Environmental Ltd (LASEPA reg. 3391)",
        document: "waste-contract-ecoserve.pdf",
        state: "verified",
      },
    ],
  },
  {
    id: "insurance",
    title: "Insurance & Financial",
    icon: "ShieldCheck",
    summary: "Cover in place across all mandatory classes; goods-in-trust limit near declared value.",
    items: [
      {
        label: "Public liability policy",
        detail: "AIICO Insurance Plc — ₦500m per occurrence",
        document: "public-liability-policy.pdf",
        expires: "2027-03-31",
        state: "verified",
      },
      {
        label: "Goods-in-trust / stock throughput",
        detail: "Leadway Assurance — ₦3.2bn limit vs ₦3.05bn peak declared stock value",
        document: "stock-throughput-policy.pdf",
        expires: "2027-03-31",
        state: "attention",
      },
      {
        label: "Employers' liability (Employee Compensation Act)",
        detail: "NSITF contributions current to Q2 2026",
        document: "nsitf-remittance.pdf",
        state: "verified",
      },
      {
        label: "Audited financial statements FY2025",
        detail: "Unqualified opinion — Ogunlana & Co (Chartered Accountants)",
        document: "audited-fs-2025.pdf",
        state: "verified",
      },
    ],
  },
  {
    id: "operations",
    title: "Operations & Personnel",
    icon: "Settings2",
    summary: "SOPs, competency records and shift structure documented for 24-hour running.",
    items: [
      {
        label: "Standard operating procedures pack",
        detail: "17 SOPs covering intake, sampling, stacking, dispatch and spill response",
        document: "sop-pack-v6.pdf",
        state: "verified",
      },
      {
        label: "Facility manager competency",
        detail: "Ibrahim Bello — CILT Nigeria member, 11 years mineral logistics",
        document: "cv-ibello.pdf",
        state: "verified",
      },
      {
        label: "Shift roster & manning levels",
        detail: "3 shifts, minimum 9 operatives + 1 supervisor per shift",
        document: "shift-roster-aug-2026.pdf",
        state: "verified",
      },
      {
        label: "Subcontracted haulage due diligence",
        detail: "2 of 5 hauliers missing current road worthiness evidence",
        state: "attention",
      },
    ],
  },
  {
    id: "inventory",
    title: "Inventory Controls",
    icon: "Boxes",
    summary: "Batch traceability strong; cycle-count variance tolerance above Beldium threshold.",
    items: [
      {
        label: "Batch/lot traceability system",
        detail: "Every intake lot barcoded to origin pit, assay and bay location",
        document: "traceability-procedure.pdf",
        state: "verified",
      },
      {
        label: "Weighbridge-to-system reconciliation",
        detail: "Automatic ticket capture, dual sign-off on >0.5% variance",
        state: "verified",
      },
      {
        label: "Cycle counting policy",
        detail: "Declared tolerance ±2.0%; Beldium standard for concentrates is ±0.5%",
        state: "attention",
      },
      {
        label: "Assay retention samples",
        detail: "Duplicate samples retained 180 days in sealed store",
        document: "sample-retention-log.pdf",
        state: "verified",
      },
    ],
  },
  {
    id: "security",
    title: "Security & Access Control",
    icon: "Lock",
    summary: "Layered physical security; CCTV retention below the 90-day partner requirement.",
    items: [
      {
        label: "Perimeter and guarding",
        detail: "3.0 m walled perimeter, 24/7 Halogen Security detail, 4 posts",
        document: "security-contract-halogen.pdf",
        state: "verified",
      },
      {
        label: "CCTV coverage & retention",
        detail: "46 cameras, all gates and bays — retention 30 days (requirement 90)",
        state: "attention",
      },
      {
        label: "Access control & visitor management",
        detail: "Card access on vault and lab; paper visitor log at main gate",
        state: "attention",
      },
      {
        label: "High-value consignment protocol",
        detail: "Dual custody, escorted convoy, seal register maintained",
        document: "high-value-protocol.pdf",
        state: "verified",
      },
    ],
  },
  {
    id: "inspection",
    title: "Inspection History",
    icon: "ClipboardCheck",
    summary: "Two prior Beldium visits; last visit closed 3 of 4 findings.",
    items: [
      {
        label: "Pre-registration site visit",
        detail: "Beldium inspector Chinedu Okafor — 4 findings raised, 3 closed",
        document: "inspection-report-2026-03.pdf",
        issued: "2026-03-19",
        state: "verified",
      },
      {
        label: "Follow-up desktop verification",
        detail: "Bund wall remediation evidence still outstanding",
        issued: "2026-06-27",
        state: "attention",
      },
      {
        label: "Physical inspection for this application",
        detail: "Not yet scheduled — reviewer decision required",
        state: "missing",
      },
    ],
  },
];

export interface RiskCategory {
  category: string;
  score: number;
  weight: number;
  note: string;
}

export const RISK_BREAKDOWN: RiskCategory[] = [
  { category: "Corporate & legal standing", score: 94, weight: 15, note: "Clean CAC and FIRS record; UBO notarisation outstanding." },
  { category: "Facility & infrastructure", score: 90, weight: 15, note: "Strong build quality; one bund wall defect." },
  { category: "Health & safety", score: 86, weight: 15, note: "Dust exposure well controlled; confined-space training lapsed for 9 staff." },
  { category: "Environmental", score: 78, weight: 12, note: "LASEPA permit expires in under 120 days; runoff sampling incomplete." },
  { category: "Insurance & financial", score: 92, weight: 10, note: "All classes covered; stock limit only 5% above peak value." },
  { category: "Operations & personnel", score: 88, weight: 11, note: "Mature SOPs; haulier due diligence gaps." },
  { category: "Inventory controls", score: 87, weight: 10, note: "Excellent traceability; count tolerance above standard." },
  { category: "Security", score: 84, weight: 12, note: "Good physical layering; CCTV retention below requirement." },
];

export const RISK_SCORE = 88;

export const APPLICATION_TIMELINE = [
  { date: "2026-07-28", label: "Application submitted", actor: "Sahel Minerals & Logistics Ltd" },
  { date: "2026-07-30", label: "Completeness screening passed (42/42 documents)", actor: "Beldium intake desk" },
  { date: "2026-08-04", label: "Assigned to reviewer Adaeze Nwachukwu", actor: "Beldium allocation engine" },
  { date: "2026-08-12", label: "Corporate, facility and insurance sections cleared", actor: "Adaeze Nwachukwu" },
  { date: "2026-08-18", label: "Risk model rescored to 88/100 after dust survey upload", actor: "Beldium risk engine" },
];

/* ------------------------------------------------------------------ */
/* Partner: supporting datasets                                        */
/* ------------------------------------------------------------------ */

export interface FacilityRecord {
  id: string;
  name: string;
  company: string;
  state: string;
  status: "Approved" | "Conditional" | "Suspended" | "Under review";
  certExpiry: string;
  lastInspection: string;
  risk: number;
  capacity: number;
  utilisation: number;
}

export const FACILITIES: FacilityRecord[] = [
  { id: "FAC-0031", name: "Trans-Amadi Warehouse 4", company: "Port Harcourt Industrial Minerals Ltd", state: "Rivers", status: "Approved", certExpiry: "2027-06-30", lastInspection: "2026-05-19", risk: 91, capacity: 15400, utilisation: 68 },
  { id: "FAC-0028", name: "Ewekoro Bulk Store 2", company: "Ogun Granite & Aggregates Ltd", state: "Ogun", status: "Conditional", certExpiry: "2026-12-15", lastInspection: "2026-07-02", risk: 82, capacity: 27000, utilisation: 81 },
  { id: "FAC-0024", name: "Onne Free Zone Mineral Shed 9", company: "Delta Mineral Exporters Ltd", state: "Rivers", status: "Approved", certExpiry: "2027-02-28", lastInspection: "2026-04-11", risk: 89, capacity: 33000, utilisation: 54 },
  { id: "FAC-0019", name: "Gusau Secure Vault & Store", company: "Zamfara Gold Aggregators Ltd", state: "Zamfara", status: "Suspended", certExpiry: "2026-09-30", lastInspection: "2026-06-21", risk: 38, capacity: 1200, utilisation: 12 },
  { id: "FAC-0016", name: "Bukuru Consolidation Yard", company: "Jos Plateau Mineral Handling Plc", state: "Plateau", status: "Under review", certExpiry: "—", lastInspection: "2026-08-01", risk: 74, capacity: 18500, utilisation: 44 },
  { id: "FAC-0011", name: "Apapa Mineral Terminal — Block B", company: "Sahel Minerals & Logistics Ltd", state: "Lagos", status: "Under review", certExpiry: "—", lastInspection: "2026-03-19", risk: 88, capacity: 42000, utilisation: 72 },
  { id: "FAC-0007", name: "Kano Mineral Bonded Store", company: "Sahara Industrial Minerals Ltd", state: "Kano", status: "Approved", certExpiry: "2026-10-14", lastInspection: "2026-02-27", risk: 85, capacity: 12800, utilisation: 63 },
];

export interface ExpiringDoc {
  id: string;
  document: string;
  facility: string;
  company: string;
  expires: string;
  daysLeft: number;
}

export const EXPIRING_DOCS: ExpiringDoc[] = [
  { id: "DOC-4411", document: "LASEPA environmental permit", facility: "Apapa Mineral Terminal — Block B", company: "Sahel Minerals & Logistics Ltd", expires: "2026-11-30", daysLeft: 101 },
  { id: "DOC-4390", document: "Fire safety certificate", facility: "Kano Mineral Bonded Store", company: "Sahara Industrial Minerals Ltd", expires: "2026-10-14", daysLeft: 54 },
  { id: "DOC-4377", document: "Public liability policy", facility: "Ewekoro Bulk Store 2", company: "Ogun Granite & Aggregates Ltd", expires: "2026-09-19", daysLeft: 29 },
  { id: "DOC-4361", document: "Weighbridge calibration seal", facility: "Bukuru Consolidation Yard", company: "Jos Plateau Mineral Handling Plc", expires: "2026-09-05", daysLeft: 15 },
  { id: "DOC-4358", document: "Mineral buying centre licence", facility: "Gusau Secure Vault & Store", company: "Zamfara Gold Aggregators Ltd", expires: "2026-09-30", daysLeft: 40 },
];

export interface InspectionRecord {
  id: string;
  facility: string;
  type: "Pre-registration" | "Routine surveillance" | "Follow-up" | "For-cause";
  inspector: string;
  date: string;
  status: "Scheduled" | "Completed" | "Overdue";
  findings: number;
}

export const INSPECTIONS: InspectionRecord[] = [
  { id: "INS-2026-081", facility: "Ewekoro Bulk Store 2", type: "Follow-up", inspector: "Chinedu Okafor", date: "2026-08-27", status: "Scheduled", findings: 0 },
  { id: "INS-2026-079", facility: "Bukuru Consolidation Yard", type: "Pre-registration", inspector: "Halima Sanusi", date: "2026-08-01", status: "Completed", findings: 5 },
  { id: "INS-2026-074", facility: "Gusau Secure Vault & Store", type: "For-cause", inspector: "Chinedu Okafor", date: "2026-06-21", status: "Completed", findings: 7 },
  { id: "INS-2026-070", facility: "Trans-Amadi Warehouse 4", type: "Routine surveillance", inspector: "Emeka Uzoma", date: "2026-05-19", status: "Completed", findings: 2 },
  { id: "INS-2026-062", facility: "Kano Mineral Bonded Store", type: "Routine surveillance", inspector: "Halima Sanusi", date: "2026-07-30", status: "Overdue", findings: 0 },
];

export const INSPECTORS = [
  "Chinedu Okafor — Lead Inspector (Lagos)",
  "Halima Sanusi — Senior Inspector (North West)",
  "Emeka Uzoma — Inspector (South South)",
  "Bisi Ogunleye — Inspector (South West)",
];

export interface NonConformity {
  id: string;
  facility: string;
  title: string;
  severity: "Minor" | "Major" | "Critical";
  raised: string;
  due: string;
  owner: string;
  status: "Open" | "In progress" | "Closed";
  section: string;
}

export const NON_CONFORMITIES: NonConformity[] = [
  { id: "NC-2026-214", facility: "Apapa Mineral Terminal — Block B", title: "CCTV retention 30 days against 90-day requirement", severity: "Major", raised: "2026-08-12", due: "2026-09-11", owner: "Ibrahim Bello", status: "Open", section: "Security" },
  { id: "NC-2026-209", facility: "Apapa Mineral Terminal — Block B", title: "Bay B4 bund wall cracked — spill containment compromised", severity: "Major", raised: "2026-03-19", due: "2026-05-19", owner: "Ibrahim Bello", status: "In progress", section: "Facility" },
  { id: "NC-2026-198", facility: "Ewekoro Bulk Store 2", title: "Dust suppression sprays inoperative on crusher line", severity: "Critical", raised: "2026-07-02", due: "2026-07-16", owner: "Yemi Aluko", status: "In progress", section: "Health & Safety" },
  { id: "NC-2026-187", facility: "Gusau Secure Vault & Store", title: "Vault seal register not maintained for 6 consignments", severity: "Critical", raised: "2026-06-21", due: "2026-07-05", owner: "Sadiq Lawal", status: "Open", section: "Security" },
  { id: "NC-2026-166", facility: "Trans-Amadi Warehouse 4", title: "Two lapsed forklift operator certifications", severity: "Minor", raised: "2026-05-19", due: "2026-06-19", owner: "Peace Amadi", status: "Closed", section: "Operations" },
];

export interface MonitoringAlert {
  id: string;
  facility: string;
  message: string;
  severity: "info" | "warning" | "critical";
  raised: string;
  source: string;
}

export const MONITORING_ALERTS: MonitoringAlert[] = [
  { id: "ALR-9021", facility: "Apapa Mineral Terminal — Block B", message: "Stock value ₦3.05bn is within 5% of insured goods-in-trust limit", severity: "warning", raised: "2026-08-19 07:14", source: "Insurance exposure monitor" },
  { id: "ALR-9017", facility: "Apapa Mineral Terminal — Block B", message: "Weight variance 1.8% on inbound lot SM-LZ-2288 (tolerance 0.5%)", severity: "warning", raised: "2026-08-18 16:02", source: "Weighbridge reconciliation" },
  { id: "ALR-9012", facility: "Gusau Secure Vault & Store", message: "Facility suspended — all release requests auto-blocked", severity: "critical", raised: "2026-08-15 09:41", source: "Status engine" },
  { id: "ALR-9008", facility: "Ewekoro Bulk Store 2", message: "Critical non-conformity NC-2026-198 past corrective due date", severity: "critical", raised: "2026-08-14 11:20", source: "Non-conformity tracker" },
  { id: "ALR-8994", facility: "Kano Mineral Bonded Store", message: "Routine surveillance inspection now 21 days overdue", severity: "warning", raised: "2026-08-11 08:00", source: "Inspection scheduler" },
  { id: "ALR-8981", facility: "Trans-Amadi Warehouse 4", message: "Quarterly self-assessment submitted and accepted", severity: "info", raised: "2026-08-05 13:35", source: "Self-assessment portal" },
];

export const AUDIT_HISTORY = [
  { id: "AUD-7742", timestamp: "2026-08-19 09:22", actor: "Adaeze Nwachukwu", action: "Opened application APP-2026-0147 review workspace", entity: "APP-2026-0147" },
  { id: "AUD-7738", timestamp: "2026-08-18 15:40", actor: "Beldium risk engine", action: "Risk score recalculated 84 → 88", entity: "APP-2026-0147" },
  { id: "AUD-7731", timestamp: "2026-08-18 11:07", actor: "Sahel Minerals & Logistics Ltd", action: "Uploaded respirable dust survey Q2 2026", entity: "DOC-4402" },
  { id: "AUD-7725", timestamp: "2026-08-15 09:41", actor: "Chinedu Okafor", action: "Suspended facility FAC-0019 pending seal register remediation", entity: "FAC-0019" },
  { id: "AUD-7719", timestamp: "2026-08-12 14:12", actor: "Adaeze Nwachukwu", action: "Raised non-conformity NC-2026-214 (CCTV retention)", entity: "FAC-0011" },
  { id: "AUD-7710", timestamp: "2026-08-08 10:03", actor: "Adaeze Nwachukwu", action: "Conditionally approved APP-2026-0139", entity: "APP-2026-0139" },
];

/* ------------------------------------------------------------------ */
/* Operator datasets                                                   */
/* ------------------------------------------------------------------ */

export interface StorageLocation {
  zone: string;
  description: string;
  rows: { id: string; type: string; capacity: number; occupied: number; contents: string }[];
}

export const STORAGE_HIERARCHY: StorageLocation[] = [
  {
    zone: "Zone A — Bulk concentrate bays",
    description: "Open-top bunded bays, front-end loader access, dust suppression rail",
    rows: [
      { id: "A-BAY-01", type: "Bulk bay", capacity: 4000, occupied: 3120, contents: "Lead-zinc concentrate (Ebonyi origin)" },
      { id: "A-BAY-02", type: "Bulk bay", capacity: 4000, occupied: 2450, contents: "Lead-zinc concentrate (Nasarawa origin)" },
      { id: "A-BAY-03", type: "Bulk bay", capacity: 4000, occupied: 0, contents: "Empty — washed down 17 Aug" },
      { id: "A-BAY-04", type: "Bulk bay", capacity: 4000, occupied: 1890, contents: "Barite (drilling grade) — bund defect NC-2026-209" },
    ],
  },
  {
    zone: "Zone B — Bagged racking",
    description: "6-level selective racking, 1 t big-bag pallets, barcode location labels",
    rows: [
      { id: "B-R01-L1", type: "Rack level", capacity: 640, occupied: 604, contents: "Barite API 4.2 SG — 604 big bags" },
      { id: "B-R01-L2", type: "Rack level", capacity: 640, occupied: 318, contents: "Tin ore concentrate — 318 big bags" },
      { id: "B-R02-L1", type: "Rack level", capacity: 640, occupied: 512, contents: "Kaolin (export grade)" },
      { id: "B-R02-L2", type: "Rack level", capacity: 640, occupied: 96, contents: "Quarantine hold — lot SM-LZ-2288" },
    ],
  },
  {
    zone: "Zone C — Secure & sampling",
    description: "Access-controlled area for high-value lots, retention samples and assay lab",
    rows: [
      { id: "C-VLT-01", type: "Secure vault", capacity: 40, occupied: 22, contents: "High-value tin concentrate, dual custody" },
      { id: "C-SMP-01", type: "Sample store", capacity: 1200, occupied: 874, contents: "Retention samples (180-day policy)" },
      { id: "C-LAB-01", type: "Assay laboratory", capacity: 0, occupied: 0, contents: "XRF bench, moisture ovens, splitter" },
    ],
  },
];

export interface Batch {
  id: string;
  commodity: string;
  origin: string;
  location: string;
  tonnes: number;
  grade: string;
  received: string;
  status: "Available" | "Quarantine" | "Allocated" | "Released";
  owner: string;
}

export const BATCHES: Batch[] = [
  { id: "SM-LZ-2288", commodity: "Lead-zinc concentrate", origin: "Ishiagu pit, Ebonyi", location: "B-R02-L2", tonnes: 96, grade: "Pb 54.1% / Zn 8.4%", received: "2026-08-18", status: "Quarantine", owner: "Marama Resources BV" },
  { id: "SM-LZ-2276", commodity: "Lead-zinc concentrate", origin: "Ishiagu pit, Ebonyi", location: "A-BAY-01", tonnes: 3120, grade: "Pb 55.7% / Zn 7.9%", received: "2026-08-11", status: "Available", owner: "Marama Resources BV" },
  { id: "SM-BR-1149", commodity: "Barite (API 4.2 SG)", origin: "Azara, Nasarawa", location: "B-R01-L1", tonnes: 604, grade: "SG 4.24, <250 ppm soluble", received: "2026-08-09", status: "Allocated", owner: "Deepwell Drilling Services Ltd" },
  { id: "SM-TN-0731", commodity: "Tin ore concentrate", origin: "Bukuru, Plateau", location: "B-R01-L2", tonnes: 318, grade: "Sn 68.2%", received: "2026-07-31", status: "Available", owner: "Sahel Minerals (own stock)" },
  { id: "SM-KA-0442", commodity: "Kaolin (export grade)", origin: "Kankara, Katsina", location: "B-R02-L1", tonnes: 512, grade: "Brightness 84 ISO", received: "2026-07-24", status: "Available", owner: "Ceramica Nigeria Ltd" },
  { id: "SM-BR-1102", commodity: "Barite (drilling grade)", origin: "Azara, Nasarawa", location: "A-BAY-04", tonnes: 1890, grade: "SG 4.11", received: "2026-07-16", status: "Available", owner: "Deepwell Drilling Services Ltd" },
];

export interface IncomingShipment {
  id: string;
  supplier: string;
  commodity: string;
  expected: string;
  eta: string;
  truckPlate: string;
  waybill: string;
}

export const INCOMING: IncomingShipment[] = [
  { id: "IN-4471", supplier: "Ishiagu Mining Cooperative", commodity: "Lead-zinc concentrate", expected: "32.0 t", eta: "2026-08-21 11:30", truckPlate: "LSR-482-XA", waybill: "WB-2026-11482" },
  { id: "IN-4472", supplier: "Azara Barite Union", commodity: "Barite (drilling grade)", expected: "28.5 t", eta: "2026-08-21 14:10", truckPlate: "NSR-119-KU", waybill: "WB-2026-11491" },
  { id: "IN-4473", supplier: "Plateau Tin Traders Ltd", commodity: "Tin ore concentrate", expected: "18.0 t", eta: "2026-08-22 08:45", truckPlate: "PLT-903-JS", waybill: "WB-2026-11507" },
];

export interface ReleaseRequest {
  id: string;
  batch: string;
  commodity: string;
  tonnes: number;
  requestedBy: string;
  destination: string;
  requested: string;
  status: "Pending authorisation" | "Authorised" | "Declined";
  reason?: string;
}

export const RELEASE_REQUESTS: ReleaseRequest[] = [
  { id: "REL-2291", batch: "SM-BR-1149", commodity: "Barite (API 4.2 SG)", tonnes: 240, requestedBy: "Deepwell Drilling Services Ltd", destination: "Onne Supply Base, Rivers", requested: "2026-08-20 09:12", status: "Pending authorisation" },
  { id: "REL-2288", batch: "SM-KA-0442", commodity: "Kaolin (export grade)", tonnes: 120, requestedBy: "Ceramica Nigeria Ltd", destination: "Ota Ceramics Plant, Ogun", requested: "2026-08-19 15:40", status: "Pending authorisation" },
  { id: "REL-2284", batch: "SM-TN-0731", commodity: "Tin ore concentrate", tonnes: 60, requestedBy: "Sahel Minerals (export desk)", destination: "Apapa Port Berth 9", requested: "2026-08-18 10:05", status: "Authorised" },
];

export interface Incident {
  id: string;
  title: string;
  category: "Safety" | "Environmental" | "Security" | "Stock integrity";
  severity: "Low" | "Medium" | "High";
  date: string;
  location: string;
  status: "Open" | "Under investigation" | "Closed";
  reportedBy: string;
}

export const INCIDENTS: Incident[] = [
  { id: "INC-0312", title: "Dust plume during concentrate tipping at Bay A-02", category: "Environmental", severity: "Medium", date: "2026-08-17", location: "A-BAY-02", status: "Under investigation", reportedBy: "Ibrahim Bello" },
  { id: "INC-0309", title: "Forklift near-miss with pedestrian at dock 3", category: "Safety", severity: "High", date: "2026-08-09", location: "Dock 3", status: "Open", reportedBy: "Peace Amadi" },
  { id: "INC-0301", title: "Seal broken on inbound truck NSR-119-KU", category: "Security", severity: "Medium", date: "2026-07-28", location: "Main gate", status: "Closed", reportedBy: "Halogen Security post 1" },
  { id: "INC-0296", title: "1.8% weight variance on lot SM-LZ-2288", category: "Stock integrity", severity: "Medium", date: "2026-07-22", location: "Weighbridge 2", status: "Under investigation", reportedBy: "Weighbridge operator" },
];

export const OPERATOR_DOCUMENTS = [
  { id: "ODOC-201", name: "LASEPA environmental permit", category: "Environmental", expires: "2026-11-30", status: "Expiring" },
  { id: "ODOC-198", name: "Lagos State fire safety certificate", category: "Safety", expires: "2027-01-21", status: "Valid" },
  { id: "ODOC-193", name: "Weighbridge calibration certificate", category: "Facility", expires: "2027-05-13", status: "Valid" },
  { id: "ODOC-188", name: "Goods-in-trust insurance schedule", category: "Insurance", expires: "2027-03-31", status: "Valid" },
  { id: "ODOC-181", name: "FIRS tax clearance certificate", category: "Corporate", expires: "2027-02-17", status: "Valid" },
  { id: "ODOC-174", name: "Confined space training register", category: "Safety", expires: "2026-08-31", status: "Action required" },
];

/* ------------------------------------------------------------------ */
/* Regulator datasets                                                  */
/* ------------------------------------------------------------------ */

export const REGISTERED_FACILITIES = FACILITIES;

export const CERTIFICATES = [
  { id: "CERT-1188", facility: "Trans-Amadi Warehouse 4", company: "Port Harcourt Industrial Minerals Ltd", issued: "2026-06-30", expires: "2027-06-30", scope: "Kaolin, silica sand — 15,400 t", status: "Active" },
  { id: "CERT-1174", facility: "Onne Free Zone Mineral Shed 9", company: "Delta Mineral Exporters Ltd", issued: "2026-02-28", expires: "2027-02-28", scope: "Export concentrates — 33,000 t", status: "Active" },
  { id: "CERT-1166", facility: "Ewekoro Bulk Store 2", company: "Ogun Granite & Aggregates Ltd", issued: "2025-12-15", expires: "2026-12-15", scope: "Aggregate, limestone — 27,000 t", status: "Conditional" },
  { id: "CERT-1152", facility: "Kano Mineral Bonded Store", company: "Sahara Industrial Minerals Ltd", issued: "2025-10-14", expires: "2026-10-14", scope: "Industrial minerals — 12,800 t", status: "Active" },
  { id: "CERT-1140", facility: "Gusau Secure Vault & Store", company: "Zamfara Gold Aggregators Ltd", issued: "2025-09-30", expires: "2026-09-30", scope: "Gold doré — 1,200 t", status: "Suspended" },
];

export const REGULATOR_REPORTS = [
  { id: "RPT-2026-Q2-01", title: "Quarterly national warehouse compliance summary", period: "Q2 2026", facilities: 7, format: "PDF" },
  { id: "RPT-2026-Q2-02", title: "Incident and non-conformity register extract", period: "Q2 2026", facilities: 7, format: "CSV" },
  { id: "RPT-2026-Q2-03", title: "Certificate expiry forecast (next 180 days)", period: "Q3 2026", facilities: 5, format: "XLSX" },
  { id: "RPT-2026-Q1-04", title: "Mineral stock movement by state", period: "Q1 2026", facilities: 7, format: "PDF" },
];

export function labelStatus(status: string) {
  switch (status) {
    case "pending":
      return "Pending review";
    case "approved":
      return "Approved";
    case "conditional":
      return "Conditionally approved";
    case "rejected":
      return "Rejected";
    case "info-requested":
      return "Information requested";
    default:
      return status;
  }
}
