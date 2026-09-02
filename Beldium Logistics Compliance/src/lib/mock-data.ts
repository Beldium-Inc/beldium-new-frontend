/** Static mock dataset for the Beldium Logistics Compliance prototype. */

export type Role = "operator" | "partner" | "regulator" | "admin";

export type DocStatus = "pending" | "verified" | "rejected" | "replacement";

export type CheckStatus = "passed" | "attention" | "pending" | "failed";

export type CompanyStatus =
  | "Under Review"
  | "Pending Review"
  | "Awaiting Information"
  | "Approved"
  | "Conditionally Approved"
  | "Rejected"
  | "Expiring Documents";

export type RiskBand = "Low" | "Medium" | "High";

export interface ComplianceDocument {
  id: string;
  name: string;
  category: string;
  type: string;
  issuer: string;
  reference: string;
  issued: string;
  expires: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  status: DocStatus;
  notes: { id: string; author: string; at: string; text: string }[];
}

export interface CheckItem {
  label: string;
  value: string;
  status: CheckStatus;
}

export interface CheckSection {
  key: string;
  label: string;
  description: string;
  status: CheckStatus;
  score: number;
  items: CheckItem[];
  documentIds: string[];
}

export interface Vehicle {
  id: string;
  registration: string;
  type: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  capacity: string;
  ownership: "Owned" | "Leased" | "Contracted";
  insurer: string;
  insuranceExpiry: string;
  roadworthinessExpiry: string;
  gps: "Active" | "Inactive" | "Intermittent";
  status: "Compliant" | "Attention" | "Non-compliant";
  location: string;
}

export interface Driver {
  id: string;
  name: string;
  licence: string;
  licenceClass: string;
  licenceExpiry: string;
  nationalId: string;
  experience: string;
  assignedVehicle: string;
  training: string[];
  medicalExpiry: string;
  status: "Compliant" | "Attention" | "Non-compliant";
}

export interface ActivityEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
  channel: "Operator" | "Partner" | "System" | "Regulator";
}

export interface Company {
  id: string;
  name: string;
  regId: string;
  rcNumber: string;
  location: string;
  state: string;
  country: string;
  incorporated: string;
  fleetSize: number;
  driverCount: number;
  status: CompanyStatus;
  risk: RiskBand;
  riskScore: number;
  submitted: string;
  reviewer: string;
  lastActivity: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  employees: number;
  annualTonnage: string;
  services: string[];
  operatingLocations: { name: string; type: string; address: string; staff: number }[];
  scores: { fleet: number; drivers: number; insurance: number; safety: number; mineral: number };
  checks: CheckSection[];
  documents: ComplianceDocument[];
  vehicles: Vehicle[];
  drivers: Driver[];
  activity: ActivityEvent[];
}

const note = (id: string, author: string, at: string, text: string) => ({ id, author, at, text });

function doc(
  id: string,
  name: string,
  category: string,
  type: string,
  issuer: string,
  reference: string,
  issued: string,
  expires: string,
  status: DocStatus = "pending",
  size = "1.4 MB",
): ComplianceDocument {
  return {
    id,
    name,
    category,
    type,
    issuer,
    reference,
    issued,
    expires,
    size,
    uploadedBy: "Adaeze Okonkwo",
    uploadedAt: "2026-08-04",
    status,
    notes: [],
  };
}

/* ------------------------------------------------------------------ */
/* Primary review case: Sahel Haulage & Minerals Ltd                    */
/* ------------------------------------------------------------------ */

const sahelDocuments: ComplianceDocument[] = [
  doc("DOC-101", "Certificate of Incorporation", "Corporate", "PDF", "Corporate Affairs Commission", "RC-1284471", "2016-03-11", "—", "verified"),
  doc("DOC-102", "CAC Status Report (CAC 1.1)", "Corporate", "PDF", "Corporate Affairs Commission", "CAC/SR/44821", "2026-01-18", "2027-01-18", "verified"),
  doc("DOC-103", "Tax Clearance Certificate", "Corporate", "PDF", "Federal Inland Revenue Service", "FIRS/TCC/2026/9921", "2026-02-02", "2026-12-31", "verified"),
  doc("DOC-104", "NMDPRA Haulage Permit", "Regulatory", "PDF", "NMDPRA", "NMDPRA/HP/3387", "2025-11-04", "2026-11-04", "verified"),
  doc("DOC-105", "State Road Transport Licence — Kaduna", "Regulatory", "PDF", "Kaduna State Ministry of Transport", "KD/RTL/2026/771", "2026-01-09", "2026-10-30", "pending"),
  doc("DOC-106", "Fleet Roadworthiness Schedule", "Fleet", "XLSX", "VIO Kaduna", "VIO/RW/2026/118", "2026-06-21", "2027-06-21", "verified", "820 KB"),
  doc("DOC-107", "Vehicle Registration Bundle (24 units)", "Fleet", "ZIP", "FRSC", "FRSC/REG/BND/24", "2026-05-30", "2027-05-30", "pending", "12.6 MB"),
  doc("DOC-108", "Driver Licence Register", "Driver", "PDF", "FRSC", "FRSC/DL/REG/0912", "2026-07-02", "2027-07-02", "pending"),
  doc("DOC-109", "Driver Competency & Defensive Driving Certificates", "Driver", "PDF", "Safe Roads Nigeria", "SRN/DDC/2026/44", "2026-04-15", "2027-04-15", "pending", "3.2 MB"),
  doc("DOC-110", "Comprehensive Motor Fleet Insurance", "Insurance", "PDF", "Leadway Assurance", "LW/MF/2026/55219", "2026-01-01", "2026-12-31", "verified"),
  doc("DOC-111", "Goods-in-Transit Cover (₦450m)", "Insurance", "PDF", "AIICO Insurance", "AIICO/GIT/88120", "2026-01-01", "2026-12-31", "verified"),
  doc("DOC-112", "Employers Liability / Group Personal Accident", "Insurance", "PDF", "Leadway Assurance", "LW/GPA/2026/1180", "2026-01-01", "2026-12-31", "verified"),
  doc("DOC-113", "HSE Policy & Management Statement", "H&S", "PDF", "Sahel Haulage & Minerals", "SHM/HSE/POL/03", "2025-09-12", "2027-09-12", "pending"),
  doc("DOC-114", "Incident & Accident Register (24 months)", "H&S", "PDF", "Sahel Haulage & Minerals", "SHM/HSE/REG/24", "2026-07-31", "—", "pending"),
  doc("DOC-115", "Journey Management Plan", "Operational", "PDF", "Sahel Haulage & Minerals", "SHM/OPS/JMP/11", "2026-03-01", "2027-03-01", "verified"),
  doc("DOC-116", "Mineral Transport Licence (Solid Minerals)", "Mineral Transport", "PDF", "Mining Cadastre Office", "MCO/MTL/PENDING", "—", "—", "pending"),
  doc("DOC-117", "Waybill & Chain-of-Custody Procedure", "Mineral Transport", "PDF", "Sahel Haulage & Minerals", "SHM/MIN/COC/02", "2026-02-20", "—", "pending"),
  doc("DOC-118", "Data Protection & Platform Usage Attestation", "Data & Platform", "PDF", "Sahel Haulage & Minerals", "SHM/NDPR/ATT/26", "2026-06-01", "2027-06-01", "verified"),
];

const sahelChecks: CheckSection[] = [
  {
    key: "corporate",
    label: "Corporate Verification",
    description: "Legal entity, ownership and tax standing.",
    status: "passed",
    score: 100,
    documentIds: ["DOC-101", "DOC-102", "DOC-103"],
    items: [
      { label: "CAC registration active", value: "RC-1284471 — active", status: "passed" },
      { label: "Directors screened", value: "4 directors, no adverse findings", status: "passed" },
      { label: "Beneficial ownership disclosed", value: "2 UBOs declared", status: "passed" },
      { label: "Tax clearance current", value: "Valid to 31 Dec 2026", status: "passed" },
    ],
  },
  {
    key: "regulatory",
    label: "Regulatory Licensing",
    description: "Federal and state transport authorisations.",
    status: "attention",
    score: 78,
    documentIds: ["DOC-104", "DOC-105"],
    items: [
      { label: "NMDPRA haulage permit", value: "Valid to 04 Nov 2026", status: "passed" },
      { label: "Kaduna state road transport licence", value: "Expires 30 Oct 2026 — renewal not filed", status: "attention" },
      { label: "Kano state operating permit", value: "Not supplied", status: "pending" },
      { label: "FRSC operator code", value: "OP/KD/2291 verified", status: "passed" },
    ],
  },
  {
    key: "fleet",
    label: "Fleet Compliance",
    description: "Vehicle registration, roadworthiness and telematics.",
    status: "attention",
    score: 92,
    documentIds: ["DOC-106", "DOC-107"],
    items: [
      { label: "Registered vehicles", value: "24 of 24 registered", status: "passed" },
      { label: "Roadworthiness certificates", value: "22 of 24 current", status: "attention" },
      { label: "GPS telematics coverage", value: "23 of 24 units reporting", status: "attention" },
      { label: "Fleet average age", value: "6.4 years (limit 12)", status: "passed" },
    ],
  },
  {
    key: "driver",
    label: "Driver Compliance",
    description: "Licensing, medicals and competency training.",
    status: "attention",
    score: 85,
    documentIds: ["DOC-108", "DOC-109"],
    items: [
      { label: "Valid driver licences", value: "31 of 36 verified", status: "attention" },
      { label: "Defensive driving certification", value: "29 of 36 certified", status: "attention" },
      { label: "Medical fitness records", value: "36 of 36 on file", status: "passed" },
      { label: "Hours-of-service policy", value: "Documented and enforced", status: "passed" },
    ],
  },
  {
    key: "insurance",
    label: "Insurance Cover",
    description: "Motor, goods-in-transit and liability cover.",
    status: "passed",
    score: 100,
    documentIds: ["DOC-110", "DOC-111", "DOC-112"],
    items: [
      { label: "Comprehensive motor fleet", value: "All 24 units covered", status: "passed" },
      { label: "Goods-in-transit", value: "₦450,000,000 limit", status: "passed" },
      { label: "Employers liability", value: "Active to 31 Dec 2026", status: "passed" },
      { label: "Premium payment status", value: "Fully paid", status: "passed" },
    ],
  },
  {
    key: "hs",
    label: "Health & Safety",
    description: "HSE governance, incidents and training culture.",
    status: "attention",
    score: 72,
    documentIds: ["DOC-113", "DOC-114"],
    items: [
      { label: "HSE policy signed by MD", value: "Signed Sep 2025", status: "passed" },
      { label: "Lost-time injury frequency", value: "2 LTIs in 24 months", status: "attention" },
      { label: "Emergency response plan", value: "Draft only — not approved", status: "attention" },
      { label: "PPE issuance records", value: "Partial records for 2026", status: "attention" },
    ],
  },
  {
    key: "operational",
    label: "Operational Capability",
    description: "Journey management, depots and service delivery.",
    status: "passed",
    score: 88,
    documentIds: ["DOC-115"],
    items: [
      { label: "Journey management plan", value: "Approved, revision 11", status: "passed" },
      { label: "Depot & yard capacity", value: "3 sites, 40 truck spaces", status: "passed" },
      { label: "Control room coverage", value: "06:00–22:00 daily", status: "attention" },
      { label: "On-time delivery (12 mo)", value: "94.2%", status: "passed" },
    ],
  },
  {
    key: "mineral",
    label: "Mineral Transport",
    description: "Solid-minerals haulage authorisation and custody controls.",
    status: "pending",
    score: 0,
    documentIds: ["DOC-116", "DOC-117"],
    items: [
      { label: "Mineral transport licence", value: "Application pending at Mining Cadastre Office", status: "pending" },
      { label: "Chain-of-custody procedure", value: "Submitted, awaiting review", status: "pending" },
      { label: "Escort & security arrangement", value: "Not supplied", status: "pending" },
      { label: "Tipper load sealing", value: "Not supplied", status: "pending" },
    ],
  },
  {
    key: "data",
    label: "Data & Platform",
    description: "NDPR attestation and platform integration readiness.",
    status: "passed",
    score: 96,
    documentIds: ["DOC-118"],
    items: [
      { label: "NDPR attestation", value: "Signed 01 Jun 2026", status: "passed" },
      { label: "Telematics API integration", value: "Connected — 23 devices", status: "passed" },
      { label: "Named platform administrators", value: "2 admins registered", status: "passed" },
      { label: "Data retention policy", value: "24 months documented", status: "passed" },
    ],
  },
];

const sahelVehicles: Vehicle[] = [
  { id: "V-01", registration: "KD-441-XA", type: "Tipper Truck", vin: "JN1TANT31U0301441", make: "Howo", model: "ZZ3257N", year: 2021, capacity: "30 tonnes", ownership: "Owned", insurer: "Leadway Assurance", insuranceExpiry: "2026-12-31", roadworthinessExpiry: "2027-01-14", gps: "Active", status: "Compliant", location: "Kaduna Depot" },
  { id: "V-02", registration: "KD-882-KJA", type: "Flatbed Trailer", vin: "1FUJGLDR8CLBP8221", make: "MAN", model: "TGS 33.400", year: 2019, capacity: "40 tonnes", ownership: "Owned", insurer: "Leadway Assurance", insuranceExpiry: "2026-12-31", roadworthinessExpiry: "2026-09-08", gps: "Active", status: "Attention", location: "Kano Yard" },
  { id: "V-03", registration: "KN-119-ABC", type: "Tanker (Dry Bulk)", vin: "WDB9634031L556012", make: "Mercedes-Benz", model: "Actros 3341", year: 2020, capacity: "33,000 litres", ownership: "Leased", insurer: "Leadway Assurance", insuranceExpiry: "2026-12-31", roadworthinessExpiry: "2027-03-02", gps: "Active", status: "Compliant", location: "In transit — Zaria" },
  { id: "V-04", registration: "KD-503-LKJ", type: "Tipper Truck", vin: "LZGJL3A44JX021118", make: "Sinotruk", model: "Hohan N7", year: 2022, capacity: "30 tonnes", ownership: "Owned", insurer: "Leadway Assurance", insuranceExpiry: "2026-12-31", roadworthinessExpiry: "2027-04-19", gps: "Intermittent", status: "Attention", location: "Jos Mine Site" },
  { id: "V-05", registration: "ABJ-772-MN", type: "Box Truck", vin: "JHDFC4JKAL0004422", make: "Hino", model: "500 Series", year: 2018, capacity: "12 tonnes", ownership: "Owned", insurer: "Leadway Assurance", insuranceExpiry: "2026-12-31", roadworthinessExpiry: "2026-08-29", gps: "Active", status: "Attention", location: "Abuja Hub" },
  { id: "V-06", registration: "KD-210-QRT", type: "Low-bed Trailer", vin: "YV2AS02A8CB712204", make: "Volvo", model: "FH16", year: 2020, capacity: "60 tonnes", ownership: "Contracted", insurer: "AIICO Insurance", insuranceExpiry: "2026-12-31", roadworthinessExpiry: "2027-02-11", gps: "Active", status: "Compliant", location: "Kaduna Depot" },
  { id: "V-07", registration: "KN-664-PLM", type: "Tipper Truck", vin: "LZGJL3A44KX033910", make: "Shacman", model: "F3000", year: 2021, capacity: "30 tonnes", ownership: "Owned", insurer: "Leadway Assurance", insuranceExpiry: "2026-12-31", roadworthinessExpiry: "2027-05-06", gps: "Active", status: "Compliant", location: "Kano Yard" },
  { id: "V-08", registration: "KD-908-ZZA", type: "Support / Escort Vehicle", vin: "JTEBU5JR9K5661220", make: "Toyota", model: "Land Cruiser 79", year: 2019, capacity: "5 seats", ownership: "Owned", insurer: "Leadway Assurance", insuranceExpiry: "2026-12-31", roadworthinessExpiry: "2026-11-22", gps: "Inactive", status: "Non-compliant", location: "Kaduna Depot" },
];

const sahelDrivers: Driver[] = [
  { id: "D-01", name: "Ibrahim Musa", licence: "KDA-08321-AA", licenceClass: "Class E (Articulated)", licenceExpiry: "2027-04-18", nationalId: "NIN 2288140021", experience: "14 years", assignedVehicle: "KD-441-XA", training: ["Defensive Driving", "Hazmat Awareness"], medicalExpiry: "2027-01-30", status: "Compliant" },
  { id: "D-02", name: "Sunday Eze", licence: "KDA-11902-BC", licenceClass: "Class E (Articulated)", licenceExpiry: "2026-09-12", nationalId: "NIN 3390221187", experience: "9 years", assignedVehicle: "KD-882-KJA", training: ["Defensive Driving"], medicalExpiry: "2026-10-04", status: "Attention" },
  { id: "D-03", name: "Yusuf Abdullahi", licence: "KNO-44120-DD", licenceClass: "Class D (Heavy Goods)", licenceExpiry: "2028-02-27", nationalId: "NIN 1120884410", experience: "11 years", assignedVehicle: "KN-119-ABC", training: ["Defensive Driving", "Tanker Safety"], medicalExpiry: "2027-05-15", status: "Compliant" },
  { id: "D-04", name: "Emeka Nwachukwu", licence: "KDA-77219-FG", licenceClass: "Class D (Heavy Goods)", licenceExpiry: "2026-08-30", nationalId: "NIN 8871002214", experience: "6 years", assignedVehicle: "KD-503-LKJ", training: [], medicalExpiry: "2026-12-01", status: "Non-compliant" },
  { id: "D-05", name: "Aisha Bello", licence: "ABJ-30021-HH", licenceClass: "Class C (Light Goods)", licenceExpiry: "2027-11-08", nationalId: "NIN 4410229087", experience: "8 years", assignedVehicle: "ABJ-772-MN", training: ["Defensive Driving", "First Aid"], medicalExpiry: "2027-07-19", status: "Compliant" },
  { id: "D-06", name: "Tanko Garba", licence: "KDA-55210-JK", licenceClass: "Class E (Articulated)", licenceExpiry: "2027-06-22", nationalId: "NIN 6620117744", experience: "17 years", assignedVehicle: "KD-210-QRT", training: ["Defensive Driving", "Load Securing"], medicalExpiry: "2027-02-28", status: "Compliant" },
  { id: "D-07", name: "Chinedu Okafor", licence: "KNO-19822-LM", licenceClass: "Class D (Heavy Goods)", licenceExpiry: "2026-10-15", nationalId: "NIN 9930014477", experience: "5 years", assignedVehicle: "KN-664-PLM", training: ["Defensive Driving"], medicalExpiry: "2026-09-25", status: "Attention" },
  { id: "D-08", name: "Hauwa Suleiman", licence: "KDA-66311-NP", licenceClass: "Class C (Light Goods)", licenceExpiry: "2028-01-05", nationalId: "NIN 5540229911", experience: "7 years", assignedVehicle: "KD-908-ZZA", training: ["First Aid"], medicalExpiry: "2027-03-11", status: "Attention" },
];

const sahelActivity: ActivityEvent[] = [
  { id: "A-1", at: "2026-08-04 09:12", actor: "Adaeze Okonkwo", action: "Application submitted", detail: "Onboarding application BLD-2417 submitted with 18 documents.", channel: "Partner" },
  { id: "A-2", at: "2026-08-04 09:15", actor: "Beldium Platform", action: "Automated screening completed", detail: "CAC, FIRS and FRSC records matched. Initial risk score 74.", channel: "System" },
  { id: "A-3", at: "2026-08-06 11:40", actor: "Ngozi Adeyemi", action: "Reviewer assigned", detail: "Case assigned to Ngozi Adeyemi (Senior Compliance Analyst).", channel: "Operator" },
  { id: "A-4", at: "2026-08-10 14:02", actor: "Ngozi Adeyemi", action: "Corporate checks cleared", detail: "Incorporation, ownership and tax clearance verified.", channel: "Operator" },
  { id: "A-5", at: "2026-08-14 08:55", actor: "Beldium Platform", action: "Continuous monitoring alert", detail: "Kaduna state road transport licence expires in 67 days.", channel: "System" },
  { id: "A-6", at: "2026-08-18 16:20", actor: "Ngozi Adeyemi", action: "Mineral transport check opened", detail: "Mineral transport licence outstanding — restriction applied to mineral haulage scope.", channel: "Operator" },
  { id: "A-7", at: "2026-08-20 10:05", actor: "Adaeze Okonkwo", action: "Documents uploaded", detail: "Driver competency certificates re-uploaded (3.2 MB).", channel: "Partner" },
];

/* ------------------------------------------------------------------ */

function baseCompany(partial: Partial<Company> & Pick<Company, "id" | "name">): Company {
  return {
    regId: partial.id,
    rcNumber: "RC-0000000",
    location: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    incorporated: "2015-01-01",
    fleetSize: 10,
    driverCount: 14,
    status: "Pending Review",
    risk: "Low",
    riskScore: 90,
    submitted: "2026-07-01",
    reviewer: "Unassigned",
    lastActivity: "2026-08-01",
    contactName: "Operations Lead",
    contactEmail: "ops@example.ng",
    contactPhone: "+234 800 000 0000",
    website: "www.example.ng",
    employees: 60,
    annualTonnage: "120,000 t",
    services: ["General haulage"],
    operatingLocations: [],
    scores: { fleet: 90, drivers: 90, insurance: 90, safety: 90, mineral: 0 },
    checks: [],
    documents: [],
    vehicles: [],
    drivers: [],
    activity: [],
    ...partial,
  } as Company;
}

export const PRIMARY_COMPANY_ID = "BLD-2417";

export const companies: Company[] = [
  {
    id: PRIMARY_COMPANY_ID,
    name: "Sahel Haulage & Minerals Ltd",
    regId: "BLD-2417",
    rcNumber: "RC-1284471",
    location: "Kaduna",
    state: "Kaduna",
    country: "Nigeria",
    incorporated: "2016-03-11",
    fleetSize: 24,
    driverCount: 36,
    status: "Under Review",
    risk: "Medium",
    riskScore: 82,
    submitted: "2026-08-04",
    reviewer: "Ngozi Adeyemi",
    lastActivity: "2026-08-20",
    contactName: "Adaeze Okonkwo",
    contactEmail: "compliance@sahelhaulage.ng",
    contactPhone: "+234 803 442 1180",
    website: "www.sahelhaulage.ng",
    employees: 142,
    annualTonnage: "410,000 t",
    services: ["Solid mineral haulage", "Bulk cement & aggregates", "Project cargo", "Warehouse distribution"],
    operatingLocations: [
      { name: "Kaduna Depot (HQ)", type: "Head office & yard", address: "12 Kachia Road, Kaduna South, Kaduna", staff: 78 },
      { name: "Kano Yard", type: "Regional depot", address: "Plot 4 Sharada Industrial Estate, Kano", staff: 34 },
      { name: "Abuja Hub", type: "Distribution hub", address: "Km 18 Abuja–Keffi Expressway, Abuja", staff: 30 },
    ],
    scores: { fleet: 92, drivers: 85, insurance: 100, safety: 72, mineral: 0 },
    checks: sahelChecks,
    documents: sahelDocuments,
    vehicles: sahelVehicles,
    drivers: sahelDrivers,
    activity: sahelActivity,
  },
  baseCompany({
    id: "BLD-2418", name: "Niger Delta Freight Systems Ltd", rcNumber: "RC-1102284", location: "Port Harcourt", state: "Rivers",
    fleetSize: 41, driverCount: 58, status: "Pending Review", risk: "Low", riskScore: 91, submitted: "2026-08-11",
    reviewer: "Unassigned", lastActivity: "2026-08-19", contactName: "Tamuno Briggs", contactEmail: "hse@ndfreight.ng",
    services: ["Oil & gas logistics", "Containerised freight"], employees: 210, annualTonnage: "690,000 t",
    scores: { fleet: 94, drivers: 90, insurance: 100, safety: 88, mineral: 0 },
  }),
  baseCompany({
    id: "BLD-2419", name: "Kano Overland Cargo Ltd", rcNumber: "RC-0994120", location: "Kano", state: "Kano",
    fleetSize: 18, driverCount: 22, status: "Awaiting Information", risk: "High", riskScore: 58, submitted: "2026-07-28",
    reviewer: "Ngozi Adeyemi", lastActivity: "2026-08-18", contactName: "Bashir Lawal", contactEmail: "admin@kanooverland.ng",
    services: ["Cross-border haulage", "Agro commodities"], employees: 74, annualTonnage: "180,000 t",
    scores: { fleet: 61, drivers: 55, insurance: 70, safety: 48, mineral: 0 },
  }),
  baseCompany({
    id: "BLD-2420", name: "Lagos Coastal Logistics Plc", rcNumber: "RC-0781122", location: "Apapa, Lagos", state: "Lagos",
    fleetSize: 66, driverCount: 89, status: "Approved", risk: "Low", riskScore: 95, submitted: "2026-05-12",
    reviewer: "Tunde Ayeni", lastActivity: "2026-08-15", contactName: "Funke Adebayo", contactEmail: "compliance@lagoscoastal.ng",
    services: ["Port haulage", "Bonded warehousing", "Last mile"], employees: 430, annualTonnage: "1,200,000 t",
    scores: { fleet: 97, drivers: 94, insurance: 100, safety: 92, mineral: 0 },
  }),
  baseCompany({
    id: "BLD-2421", name: "Plateau Mineral Movers Ltd", rcNumber: "RC-1339902", location: "Jos", state: "Plateau",
    fleetSize: 12, driverCount: 16, status: "Expiring Documents", risk: "Medium", riskScore: 76, submitted: "2026-04-02",
    reviewer: "Tunde Ayeni", lastActivity: "2026-08-17", contactName: "Danjuma Pam", contactEmail: "ops@plateaumovers.ng",
    services: ["Tin & columbite haulage", "Quarry logistics"], employees: 58, annualTonnage: "95,000 t",
    scores: { fleet: 80, drivers: 78, insurance: 65, safety: 74, mineral: 88 },
  }),
  baseCompany({
    id: "BLD-2422", name: "Benue Agro Transit Ltd", rcNumber: "RC-1440021", location: "Makurdi", state: "Benue",
    fleetSize: 9, driverCount: 11, status: "Rejected", risk: "High", riskScore: 42, submitted: "2026-06-19",
    reviewer: "Ngozi Adeyemi", lastActivity: "2026-08-02", contactName: "Terkula Iorwuese", contactEmail: "info@benueagro.ng",
    services: ["Agro commodities"], employees: 34, annualTonnage: "42,000 t",
    scores: { fleet: 44, drivers: 38, insurance: 30, safety: 40, mineral: 0 },
  }),
  baseCompany({
    id: "BLD-2423", name: "Sokoto Northern Haulage Ltd", rcNumber: "RC-1201883", location: "Sokoto", state: "Sokoto",
    fleetSize: 15, driverCount: 19, status: "Under Review", risk: "Medium", riskScore: 71, submitted: "2026-08-08",
    reviewer: "Tunde Ayeni", lastActivity: "2026-08-20", contactName: "Aliyu Danfodio", contactEmail: "compliance@sokotohaulage.ng",
    services: ["Livestock transport", "General haulage"], employees: 66, annualTonnage: "110,000 t",
    scores: { fleet: 74, drivers: 70, insurance: 85, safety: 63, mineral: 0 },
  }),
  baseCompany({
    id: "BLD-2424", name: "Enugu Coal Freight Ltd", rcNumber: "RC-1288740", location: "Enugu", state: "Enugu",
    fleetSize: 21, driverCount: 27, status: "Conditionally Approved", risk: "Medium", riskScore: 79, submitted: "2026-06-30",
    reviewer: "Ngozi Adeyemi", lastActivity: "2026-08-16", contactName: "Chika Ugwu", contactEmail: "ops@enugucoal.ng",
    services: ["Coal haulage", "Mineral transport"], employees: 118, annualTonnage: "260,000 t",
    scores: { fleet: 84, drivers: 81, insurance: 90, safety: 70, mineral: 92 },
  }),
];

export const complianceTrend = [
  { month: "Mar", approved: 12, rejected: 3, pending: 9, avgRisk: 71 },
  { month: "Apr", approved: 15, rejected: 2, pending: 11, avgRisk: 74 },
  { month: "May", approved: 18, rejected: 4, pending: 8, avgRisk: 76 },
  { month: "Jun", approved: 21, rejected: 3, pending: 12, avgRisk: 79 },
  { month: "Jul", approved: 24, rejected: 5, pending: 14, avgRisk: 78 },
  { month: "Aug", approved: 27, rejected: 2, pending: 16, avgRisk: 82 },
];

export const riskDistribution = [
  { band: "Low", value: 34, color: "#B0E2CD" },
  { band: "Medium", value: 18, color: "#FBBF24" },
  { band: "High", value: 7, color: "#F87171" },
];

export interface ExpiringDoc {
  id: string;
  company: string;
  companyId: string;
  document: string;
  category: string;
  expires: string;
  daysLeft: number;
  severity: "critical" | "warning" | "watch";
}

export const expiringDocuments: ExpiringDoc[] = [
  { id: "EX-1", company: "Plateau Mineral Movers Ltd", companyId: "BLD-2421", document: "Comprehensive Motor Fleet Insurance", category: "Insurance", expires: "2026-08-29", daysLeft: 8, severity: "critical" },
  { id: "EX-2", company: "Sahel Haulage & Minerals Ltd", companyId: "BLD-2417", document: "Roadworthiness — ABJ-772-MN", category: "Fleet", expires: "2026-08-29", daysLeft: 8, severity: "critical" },
  { id: "EX-3", company: "Sahel Haulage & Minerals Ltd", companyId: "BLD-2417", document: "Driver Licence — Emeka Nwachukwu", category: "Driver", expires: "2026-08-30", daysLeft: 9, severity: "critical" },
  { id: "EX-4", company: "Kano Overland Cargo Ltd", companyId: "BLD-2419", document: "Goods-in-Transit Cover", category: "Insurance", expires: "2026-09-06", daysLeft: 16, severity: "warning" },
  { id: "EX-5", company: "Sahel Haulage & Minerals Ltd", companyId: "BLD-2417", document: "Roadworthiness — KD-882-KJA", category: "Fleet", expires: "2026-09-08", daysLeft: 18, severity: "warning" },
  { id: "EX-6", company: "Sahel Haulage & Minerals Ltd", companyId: "BLD-2417", document: "Driver Licence — Sunday Eze", category: "Driver", expires: "2026-09-12", daysLeft: 22, severity: "warning" },
  { id: "EX-7", company: "Sokoto Northern Haulage Ltd", companyId: "BLD-2423", document: "State Operating Permit", category: "Regulatory", expires: "2026-10-02", daysLeft: 42, severity: "watch" },
  { id: "EX-8", company: "Sahel Haulage & Minerals Ltd", companyId: "BLD-2417", document: "Kaduna State Road Transport Licence", category: "Regulatory", expires: "2026-10-30", daysLeft: 70, severity: "watch" },
];

export const regulatoryAlerts = [
  { id: "RA-1", severity: "high", title: "Mineral haulage without licence", body: "Sahel Haulage & Minerals Ltd is operating mineral routes while its Mining Cadastre licence is pending. Mineral scope restricted on the platform.", at: "2026-08-18", operator: "Sahel Haulage & Minerals Ltd" },
  { id: "RA-2", severity: "high", title: "Insurance lapse imminent", body: "Plateau Mineral Movers Ltd fleet insurance expires in 8 days with no renewal filed.", at: "2026-08-21", operator: "Plateau Mineral Movers Ltd" },
  { id: "RA-3", severity: "medium", title: "Repeat information request", body: "Kano Overland Cargo Ltd has not responded to two information requests within SLA.", at: "2026-08-18", operator: "Kano Overland Cargo Ltd" },
  { id: "RA-4", severity: "low", title: "Quarterly return filed", body: "Lagos Coastal Logistics Plc filed its Q2 2026 compliance return on time.", at: "2026-08-15", operator: "Lagos Coastal Logistics Plc" },
];

export const REQUEST_REASONS = [
  "Missing document",
  "Illegible or poor-quality scan",
  "Expired document",
  "Details do not match registry records",
  "Incomplete fleet or driver schedule",
  "Insurance cover below required limit",
  "Additional clarification required",
  "Mineral transport authorisation outstanding",
];

export interface InfoRequest {
  id: string;
  companyId: string;
  company: string;
  reason: string;
  message: string;
  items: string[];
  raisedBy: string;
  raisedAt: string;
  due: string;
  status: "Open" | "Responded" | "Closed";
  response?: { at: string; message: string; files: string[] };
}

export const seedRequests: InfoRequest[] = [
  {
    id: "REQ-3391",
    companyId: PRIMARY_COMPANY_ID,
    company: "Sahel Haulage & Minerals Ltd",
    reason: "Mineral transport authorisation outstanding",
    message:
      "Please provide the Mining Cadastre Office mineral transport licence (or the stamped application acknowledgement), together with your escort and load-sealing arrangements. Mineral haulage remains restricted until this is cleared.",
    items: [
      "Mineral Transport Licence (MCO) or stamped acknowledgement",
      "Escort & security arrangement letter",
      "Tipper load sealing procedure",
    ],
    raisedBy: "Ngozi Adeyemi",
    raisedAt: "2026-08-18",
    due: "2026-08-28",
    status: "Open",
  },
  {
    id: "REQ-3384",
    companyId: PRIMARY_COMPANY_ID,
    company: "Sahel Haulage & Minerals Ltd",
    reason: "Incomplete fleet or driver schedule",
    message:
      "Five driver licences could not be matched to FRSC records and two roadworthiness certificates are missing from the fleet bundle. Please upload the corrected schedule.",
    items: [
      "Driver licences for 5 unmatched drivers",
      "Roadworthiness certificate — KD-882-KJA",
      "Roadworthiness certificate — ABJ-772-MN",
    ],
    raisedBy: "Ngozi Adeyemi",
    raisedAt: "2026-08-12",
    due: "2026-08-22",
    status: "Open",
  },
  {
    id: "REQ-3370",
    companyId: "BLD-2419",
    company: "Kano Overland Cargo Ltd",
    reason: "Expired document",
    message: "The submitted goods-in-transit certificate expired in June 2026. Provide the current cover note.",
    items: ["Current goods-in-transit certificate"],
    raisedBy: "Ngozi Adeyemi",
    raisedAt: "2026-08-05",
    due: "2026-08-15",
    status: "Open",
  },
  {
    id: "REQ-3358",
    companyId: PRIMARY_COMPANY_ID,
    company: "Sahel Haulage & Minerals Ltd",
    reason: "Illegible or poor-quality scan",
    message: "The defensive driving certificates were unreadable. A clearer scan has been received and accepted.",
    items: ["Defensive driving certificates (legible copy)"],
    raisedBy: "Ngozi Adeyemi",
    raisedAt: "2026-08-08",
    due: "2026-08-18",
    status: "Responded",
    response: { at: "2026-08-20", message: "Re-scanned at 300dpi and uploaded.", files: ["driver-competency-certs.pdf"] },
  },
];

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  outcome: string;
}

export const auditHistory: AuditEntry[] = [
  { id: "AU-9021", at: "2026-08-20 10:05", actor: "Adaeze Okonkwo", role: "Logistics Partner", action: "Document uploaded", target: "BLD-2417 / Driver Competency Certificates", outcome: "Pending review" },
  { id: "AU-9020", at: "2026-08-18 16:20", actor: "Ngozi Adeyemi", role: "Compliance Operator", action: "Restriction applied", target: "BLD-2417 / Mineral haulage scope", outcome: "Restricted" },
  { id: "AU-9019", at: "2026-08-18 16:04", actor: "Ngozi Adeyemi", role: "Compliance Operator", action: "Information requested", target: "BLD-2417 / REQ-3391", outcome: "Open" },
  { id: "AU-9018", at: "2026-08-17 09:33", actor: "Beldium Platform", role: "System", action: "Expiry alert raised", target: "BLD-2421 / Fleet insurance", outcome: "Critical" },
  { id: "AU-9017", at: "2026-08-16 13:48", actor: "Ngozi Adeyemi", role: "Compliance Operator", action: "Conditional approval issued", target: "BLD-2424 / Enugu Coal Freight Ltd", outcome: "Conditionally approved" },
  { id: "AU-9016", at: "2026-08-15 11:02", actor: "Federal Road Safety Corps", role: "Regulator", action: "Register exported", target: "Registered operators (42 records)", outcome: "Read-only export" },
  { id: "AU-9015", at: "2026-08-14 08:55", actor: "Beldium Platform", role: "System", action: "Continuous monitoring", target: "BLD-2417 / Kaduna transport licence", outcome: "Warning" },
  { id: "AU-9014", at: "2026-08-10 14:02", actor: "Ngozi Adeyemi", role: "Compliance Operator", action: "Check cleared", target: "BLD-2417 / Corporate verification", outcome: "Passed" },
  { id: "AU-9013", at: "2026-08-06 11:40", actor: "Tunde Ayeni", role: "Compliance Operator", action: "Reviewer assigned", target: "BLD-2417", outcome: "Assigned to Ngozi Adeyemi" },
  { id: "AU-9012", at: "2026-08-04 09:12", actor: "Adaeze Okonkwo", role: "Logistics Partner", action: "Application submitted", target: "BLD-2417", outcome: "Received" },
];

export interface Notification {
  id: string;
  audience: Role[];
  title: string;
  body: string;
  at: string;
  tone: "info" | "warning" | "critical" | "success";
  read: boolean;
}

export const seedNotifications: Notification[] = [
  { id: "N-1", audience: ["operator"], title: "New application received", body: "Niger Delta Freight Systems Ltd submitted an onboarding application.", at: "2026-08-11 08:20", tone: "info", read: false },
  { id: "N-2", audience: ["operator", "regulator"], title: "Insurance expiring in 8 days", body: "Plateau Mineral Movers Ltd fleet insurance expires 29 Aug 2026.", at: "2026-08-21 06:00", tone: "critical", read: false },
  { id: "N-3", audience: ["operator", "partner"], title: "Information request response", body: "Sahel Haulage re-uploaded driver competency certificates.", at: "2026-08-20 10:06", tone: "success", read: false },
  { id: "N-4", audience: ["partner"], title: "Mineral haulage restricted", body: "Your mineral transport scope is restricted until MCO licence is verified.", at: "2026-08-18 16:21", tone: "warning", read: false },
  { id: "N-5", audience: ["partner"], title: "2 open information requests", body: "Respond by 22 Aug 2026 to avoid application suspension.", at: "2026-08-18 16:05", tone: "warning", read: false },
  { id: "N-6", audience: ["regulator"], title: "Monthly oversight report ready", body: "July 2026 compliance oversight report is available to download.", at: "2026-08-01 07:00", tone: "info", read: true },
  { id: "N-7", audience: ["operator"], title: "SLA breach risk", body: "Kano Overland Cargo Ltd has 2 overdue information requests.", at: "2026-08-18 09:00", tone: "warning", read: true },
  { id: "N-8", audience: ["admin"], title: "Role directory updated", body: "3 demo accounts synchronised across portals.", at: "2026-08-19 12:00", tone: "info", read: true },
];

export const demoAccounts = [
  {
    role: "operator" as Role,
    label: "Logistics Compliance Partner",
    person: "Ngozi Adeyemi",
    title: "Senior Compliance Analyst",
    org: "Beldium Compliance Operations",
    email: "ngozi.adeyemi@beldium.ng",
    password: "compliance2026",
    blurb: "Full review workspace: applications, checks, documents, decisions, risk and audit.",
  },
  {
    role: "partner" as Role,
    label: "Logistics Partner Portal",
    person: "Adaeze Okonkwo",
    title: "Compliance Manager",
    org: "Sahel Haulage & Minerals Ltd",
    email: "compliance@sahelhaulage.ng",
    password: "partner2026",
    blurb: "Company portal: verification status, information requests, fleet, drivers, documents.",
  },
  {
    role: "regulator" as Role,
    label: "Regulatory / Oversight Portal",
    person: "Barr. Kelechi Umeh",
    title: "Compliance Oversight Officer",
    org: "Federal Road Safety Corps",
    email: "k.umeh@frsc.gov.ng",
    password: "oversight2026",
    blurb: "Read-only oversight: registered operators, credentials, alerts and reports.",
  },
  {
    role: "admin" as Role,
    label: "Beldium Admin (placeholder)",
    person: "Segun Oyelaran",
    title: "Platform Administrator",
    org: "Beldium",
    email: "admin@beldium.ng",
    password: "admin2026",
    blurb: "Minimal placeholder view for role separation and demo account directory.",
  },
];

export const reviewNotesSeed = [
  note("RN-1", "Ngozi Adeyemi", "2026-08-10 14:05", "Corporate pack is complete and consistent with CAC portal search. No adverse director findings."),
  note("RN-2", "Ngozi Adeyemi", "2026-08-18 16:18", "Mineral transport licence not yet issued. Recommending conditional approval with mineral scope restricted."),
];
