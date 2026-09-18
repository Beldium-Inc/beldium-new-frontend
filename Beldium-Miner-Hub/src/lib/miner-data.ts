import { emptyEcosystem, type EcosystemSlice } from "./ecosystem-data";

export type OrgStatus = "draft" | "submitted" | "under_review" | "verified";
export type MinerRole = "org_admin" | "org_staff" | "individual";

export type Account = {
  fullName: string;
  position?: string;
  email: string;
  phone: string;
  role: MinerRole;
  organisationName: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

export type JoinRequest = {
  organisationName: string;
  reference: string;
  status: "pending" | "approved" | "declined";
  submittedAt: string;
};

export type ApplicationSite = {
  id: string;
  name: string;
  licenceNo: string;
  region: string;
  mineral: string;
  method: "Open pit" | "Underground" | "Alluvial";
  hectares: string;
  workforce: string;
  status: "Operating" | "Care & maintenance" | "Development";
};

export type ApplicationEquipment = {
  id: string;
  name: string;
  type: string;
  serial: string;
  siteId: string;
  year: string;
  condition: "Good" | "Fair" | "Needs service";
};

export type ApplicationDoc = {
  id: string;
  label: string;
  fileName: string | null;
  required: boolean;
  uploadedAt: string | null;
};

export type ApplicationData = {
  currentStep: number;
  completedSteps: number[];
  org: {
    legalName: string;
    tradingName: string;
    registrationNo: string;
    taxId: string;
    entityType: string;
    incorporatedOn: string;
    address: string;
    country: string;
  };
  contacts: {
    primaryName: string;
    primaryRole: string;
    primaryEmail: string;
    primaryPhone: string;
    beneficialOwners: string;
    ownershipStructure: string;
  };
  licences: {
    licenceNumber: string;
    licenceType: string;
    issuingAuthority: string;
    issuedOn: string;
    expiresOn: string;
    minerals: string;
  };
  sites: ApplicationSite[];
  equipment: ApplicationEquipment[];
  environment: {
    empNumber: string;
    rehabBond: string;
    waterUsePermit: string;
    incidentsLast12m: string;
    safetyOfficer: string;
    notes: string;
  };
  documents: ApplicationDoc[];
  declaration: {
    signatory: string;
    position: string;
    accurate: boolean;
    authorised: boolean;
    consent: boolean;
    signedOn: string;
  };
};

export type ActivityEvent = {
  id: string;
  at: string;
  actor: string;
  message: string;
  kind: "submission" | "review" | "request" | "response" | "system";
};

export type TimelineStage = {
  id: string;
  label: string;
  description: string;
  state: "complete" | "active" | "pending";
  at: string | null;
};

export type InformationRequest = {
  id: string;
  reference: string;
  subject: string;
  detail: string;
  raisedBy: string;
  raisedAt: string;
  dueAt: string;
  status: "open" | "answered" | "closed";
  responses: {
    id: string;
    at: string;
    note: string;
    fileName: string | null;
  }[];
};

export type ProductionRecord = {
  id: string;
  siteId: string;
  period: string;
  mineral: string;
  tonnesMined: number;
  tonnesProcessed: number;
  grade: number;
  recovery: number;
  downtimeHours: number;
};

export type InventoryItem = {
  id: string;
  siteId: string;
  sku: string;
  name: string;
  category: "Stockpile" | "Consumable" | "Spare part" | "Explosive";
  quantity: number;
  unit: string;
  reorderLevel: number;
  updatedAt: string;
};

export type ComplianceItem = {
  id: string;
  siteId: string;
  obligation: string;
  authority: string;
  frequency: string;
  dueAt: string;
  status: "compliant" | "due_soon" | "overdue" | "in_review";
  lastSubmitted?: string;
  evidence?: string;
};

export type CorrectiveAction = {
  id: string;
  siteId: string;
  reference: string;
  finding: string;
  requiredAction: string;
  source: string;
  owner: string;
  raisedAt: string;
  dueAt: string;
  severity: "low" | "medium" | "high";
  status: "open" | "in_progress" | "submitted" | "closed";
  evidence: { id: string; at: string; note: string; fileName: string | null }[];
};

export type OrgMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "invited" | "pending";
};

export type MinerState = {
  account: Account | null;
  signedIn: boolean;
  orgStatus: OrgStatus;
  joinRequest: JoinRequest | null;
  application: ApplicationData;
  activity: ActivityEvent[];
  timeline: TimelineStage[];
  informationRequests: InformationRequest[];
  production: ProductionRecord[];
  inventory: InventoryItem[];
  compliance: ComplianceItem[];
  correctiveActions: CorrectiveAction[];
  members: OrgMember[];
  notifications: { id: string; at: string; title: string; body: string; read: boolean }[];
} & EcosystemSlice;

const now = "2026-09-03";

export const APPLICATION_STEPS = [
  { id: 1, title: "Organisation details", blurb: "Legal identity and registration" },
  { id: 2, title: "Ownership & contacts", blurb: "Directors, owners, primary contact" },
  { id: 3, title: "Licences & permits", blurb: "Mining rights and authorisations" },
  { id: 4, title: "Mining sites", blurb: "One entry per operating site" },
  { id: 5, title: "Equipment", blurb: "Fleet and fixed plant register" },
  { id: 6, title: "Environment & safety", blurb: "EMP, rehabilitation, incidents" },
  { id: 7, title: "Supporting documents", blurb: "Certificates and evidence" },
  { id: 8, title: "Review & declaration", blurb: "Confirm and sign off" },
] as const;

export function emptyApplication(orgName = ""): ApplicationData {
  return {
    currentStep: 1,
    completedSteps: [],
    org: {
      legalName: orgName,
      tradingName: "",
      registrationNo: "",
      taxId: "",
      entityType: "Private company",
      incorporatedOn: "",
      address: "",
      country: "",
    },
    contacts: {
      primaryName: "",
      primaryRole: "",
      primaryEmail: "",
      primaryPhone: "",
      beneficialOwners: "",
      ownershipStructure: "",
    },
    licences: {
      licenceNumber: "",
      licenceType: "Mining licence",
      issuingAuthority: "",
      issuedOn: "",
      expiresOn: "",
      minerals: "",
    },
    sites: [],
    equipment: [],
    environment: {
      empNumber: "",
      rehabBond: "",
      waterUsePermit: "",
      incidentsLast12m: "0",
      safetyOfficer: "",
      notes: "",
    },
    documents: [
      { id: "d1", label: "Certificate of incorporation", fileName: null, required: true, uploadedAt: null },
      { id: "d2", label: "Mining licence / right", fileName: null, required: true, uploadedAt: null },
      { id: "d3", label: "Tax clearance certificate", fileName: null, required: true, uploadedAt: null },
      { id: "d4", label: "Environmental management plan", fileName: null, required: true, uploadedAt: null },
      { id: "d5", label: "Proof of rehabilitation bond", fileName: null, required: false, uploadedAt: null },
      { id: "d6", label: "Site survey plan", fileName: null, required: false, uploadedAt: null },
    ],
    declaration: {
      signatory: "",
      position: "",
      accurate: false,
      authorised: false,
      consent: false,
      signedOn: "",
    },
  };
}

export const seedSites: ApplicationSite[] = [
  {
    id: "site-kabwe",
    name: "Kabwe North Pit",
    licenceNo: "ML-2291-KN",
    region: "Central Province",
    mineral: "Copper",
    method: "Open pit",
    hectares: "418",
    workforce: "184",
    status: "Operating",
  },
  {
    id: "site-lunga",
    name: "Lunga Alluvial Block C",
    licenceNo: "ML-3310-LA",
    region: "North Western",
    mineral: "Gold",
    method: "Alluvial",
    hectares: "126",
    workforce: "63",
    status: "Operating",
  },
  {
    id: "site-mopani",
    name: "Mopani Shaft 4",
    licenceNo: "ML-1180-MS",
    region: "Copperbelt",
    mineral: "Cobalt",
    method: "Underground",
    hectares: "92",
    workforce: "212",
    status: "Development",
  },
];

export const seedEquipment: ApplicationEquipment[] = [
  { id: "eq-1", name: "Excavator EX-220", type: "Excavator", serial: "EX220-88431", siteId: "site-kabwe", year: "2021", condition: "Good" },
  { id: "eq-2", name: "Haul truck HT-40", type: "Haul truck", serial: "HT40-22190", siteId: "site-kabwe", year: "2019", condition: "Fair" },
  { id: "eq-3", name: "Wash plant WP-2", type: "Processing plant", serial: "WP2-55012", siteId: "site-lunga", year: "2022", condition: "Good" },
  { id: "eq-4", name: "Hoist winder H-4", type: "Winder", serial: "H4-71004", siteId: "site-mopani", year: "2018", condition: "Needs service" },
];

function baseTimeline(): TimelineStage[] {
  return [
    { id: "t1", label: "Application submitted", description: "Organisation application received by Beldium.", state: "complete", at: "2026-08-14" },
    { id: "t2", label: "Completeness check", description: "Documents and mandatory fields validated.", state: "complete", at: "2026-08-18" },
    { id: "t3", label: "Technical review", description: "Licences, sites and equipment assessed by a reviewer.", state: "active", at: null },
    { id: "t4", label: "Site verification", description: "Field verification of declared sites.", state: "pending", at: null },
    { id: "t5", label: "Decision", description: "Verification outcome issued.", state: "pending", at: null },
  ];
}

export function seedState(): MinerState {
  return {
    account: null,
    signedIn: false,
    orgStatus: "draft",
    joinRequest: null,
    application: emptyApplication(),
    activity: [],
    timeline: baseTimeline(),
    informationRequests: [],
    production: [],
    inventory: [],
    compliance: [],
    correctiveActions: [],
    members: [],
    notifications: [],
    ...emptyEcosystem(),
  };
}

/** Rich data used once an application is submitted / verified. */
export function operationalSeed(): Pick<
  MinerState,
  "production" | "inventory" | "compliance" | "correctiveActions" | "members" | "informationRequests" | "notifications"
> {
  return {
    production: [
      { id: "p1", siteId: "site-kabwe", period: "2026-08", mineral: "Copper", tonnesMined: 42800, tonnesProcessed: 39950, grade: 1.42, recovery: 88.4, downtimeHours: 46 },
      { id: "p2", siteId: "site-kabwe", period: "2026-07", mineral: "Copper", tonnesMined: 40120, tonnesProcessed: 38310, grade: 1.38, recovery: 87.1, downtimeHours: 61 },
      { id: "p3", siteId: "site-kabwe", period: "2026-06", mineral: "Copper", tonnesMined: 37650, tonnesProcessed: 35900, grade: 1.31, recovery: 86.2, downtimeHours: 88 },
      { id: "p4", siteId: "site-lunga", period: "2026-08", mineral: "Gold", tonnesMined: 9800, tonnesProcessed: 9410, grade: 0.92, recovery: 91.2, downtimeHours: 22 },
      { id: "p5", siteId: "site-lunga", period: "2026-07", mineral: "Gold", tonnesMined: 9210, tonnesProcessed: 8980, grade: 0.88, recovery: 90.4, downtimeHours: 31 },
      { id: "p6", siteId: "site-mopani", period: "2026-08", mineral: "Cobalt", tonnesMined: 4100, tonnesProcessed: 3820, grade: 0.41, recovery: 79.8, downtimeHours: 57 },
    ],
    inventory: [
      { id: "i1", siteId: "site-kabwe", sku: "STK-CU-01", name: "Copper ore stockpile", category: "Stockpile", quantity: 18400, unit: "t", reorderLevel: 5000, updatedAt: "2026-09-01" },
      { id: "i2", siteId: "site-kabwe", sku: "CON-DSL-01", name: "Diesel", category: "Consumable", quantity: 46200, unit: "L", reorderLevel: 60000, updatedAt: "2026-09-02" },
      { id: "i3", siteId: "site-kabwe", sku: "EXP-ANFO", name: "ANFO explosive", category: "Explosive", quantity: 12.5, unit: "t", reorderLevel: 10, updatedAt: "2026-08-30" },
      { id: "i4", siteId: "site-lunga", sku: "SPR-PMP-04", name: "Slurry pump impeller", category: "Spare part", quantity: 3, unit: "ea", reorderLevel: 4, updatedAt: "2026-08-27" },
      { id: "i5", siteId: "site-mopani", sku: "CON-LIME", name: "Lime", category: "Consumable", quantity: 82, unit: "t", reorderLevel: 40, updatedAt: "2026-09-01" },
    ],
    compliance: [
      { id: "c1", siteId: "site-kabwe", obligation: "Quarterly production return", authority: "Mines Department", frequency: "Quarterly", dueAt: "2026-10-15", status: "compliant", lastSubmitted: "2026-07-14", evidence: "Q2 production return.pdf" },
      { id: "c2", siteId: "site-kabwe", obligation: "Air quality monitoring report", authority: "Environment Agency", frequency: "Monthly", dueAt: "2026-09-10", status: "due_soon", lastSubmitted: "2026-08-08", evidence: "Air quality Aug.pdf" },
      { id: "c3", siteId: "site-lunga", obligation: "Water use permit renewal", authority: "Water Authority", frequency: "Annual", dueAt: "2026-08-20", status: "overdue", lastSubmitted: "2025-08-15", evidence: "Water permit 2025.pdf" },
      { id: "c4", siteId: "site-mopani", obligation: "Mine safety audit", authority: "Mine Safety Inspectorate", frequency: "Bi-annual", dueAt: "2026-11-02", status: "in_review", lastSubmitted: "2026-05-04", evidence: "Safety audit H1.pdf" },
      { id: "c5", siteId: "site-mopani", obligation: "Rehabilitation bond top-up", authority: "Mines Department", frequency: "Annual", dueAt: "2026-12-01", status: "compliant", lastSubmitted: "2025-12-02", evidence: "Bond receipt 2025.pdf" },
    ],
    correctiveActions: [
      {
        id: "ca1",
        reference: "CA-2026-0091",
        finding: "Water use permit for Lunga Alluvial Block C has lapsed",
        requiredAction: "Submit a renewal application to the Water Authority and provide the acknowledgement receipt.",
        siteId: "site-lunga",
        source: "Compliance obligation overdue",
        owner: "N. Mwale",
        raisedAt: "2026-08-21",
        dueAt: "2026-09-12",
        severity: "high",
        status: "in_progress",
        evidence: [],
      },
      {
        id: "ca2",
        reference: "CA-2026-0104",
        finding: "Dust suppression sprayers inoperative on haul road 2",
        requiredAction: "Repair or replace the sprayer line and provide photographic evidence plus a dust monitoring reading.",
        siteId: "site-kabwe",
        source: "Internal inspection",
        owner: "T. Banda",
        raisedAt: "2026-08-25",
        dueAt: "2026-09-20",
        severity: "medium",
        status: "open",
        evidence: [],
      },
      {
        id: "ca3",
        reference: "CA-2026-0077",
        finding: "Winder H-4 brake system overdue for service",
        requiredAction: "Complete OEM service and upload the signed service report.",
        siteId: "site-mopani",
        source: "Equipment condition report",
        owner: "K. Phiri",
        raisedAt: "2026-08-10",
        dueAt: "2026-08-28",
        severity: "high",
        status: "submitted",
        evidence: [{ id: "ev1", at: "2026-08-27", note: "Service completed by OEM technician, report attached.", fileName: "winder-h4-service.pdf" }],
      },
    ],
    members: [
      { id: "m1", name: "You", email: "", role: "Organisation admin", status: "active" },
      { id: "m2", name: "N. Mwale", email: "n.mwale@example.com", role: "Compliance officer", status: "active" },
      { id: "m3", name: "T. Banda", email: "t.banda@example.com", role: "Site manager", status: "active" },
      { id: "m4", name: "K. Phiri", email: "k.phiri@example.com", role: "Engineering lead", status: "invited" },
      { id: "m5", name: "L. Zulu", email: "l.zulu@example.com", role: "Production clerk", status: "pending" },
    ],
    informationRequests: [
      {
        id: "ir1",
        reference: "IR-2026-0418",
        subject: "Certified copy of mining licence ML-3310-LA",
        detail:
          "The uploaded licence for Lunga Alluvial Block C is not certified. Please upload a certified copy issued within the last 6 months.",
        raisedBy: "Beldium review team",
        raisedAt: "2026-08-26",
        dueAt: "2026-09-09",
        status: "open",
        responses: [],
      },
      {
        id: "ir2",
        reference: "IR-2026-0431",
        subject: "Clarify workforce numbers for Mopani Shaft 4",
        detail:
          "Declared workforce (212) exceeds the figure in your safety plan (150). Provide a reconciliation or an updated plan.",
        raisedBy: "Beldium review team",
        raisedAt: "2026-08-29",
        dueAt: "2026-09-12",
        status: "open",
        responses: [],
      },
    ],
    notifications: [
      { id: "n1", at: now, title: "Information request IR-2026-0431 raised", body: "A reviewer needs a workforce reconciliation for Mopani Shaft 4.", read: false },
      { id: "n2", at: "2026-08-26", title: "Information request IR-2026-0418 raised", body: "Certified licence copy required for Lunga Alluvial Block C.", read: false },
      { id: "n3", at: "2026-08-18", title: "Completeness check passed", body: "Your application moved to technical review.", read: true },
    ],
  };
}

export function submittedActivity(orgName: string): ActivityEvent[] {
  return [
    { id: "a1", at: "2026-08-14", actor: orgName || "Your organisation", message: "Organisation application submitted for verification.", kind: "submission" },
    { id: "a2", at: "2026-08-18", actor: "Beldium review team", message: "Completeness check passed - moved to technical review.", kind: "review" },
    { id: "a3", at: "2026-08-26", actor: "Beldium review team", message: "Information request IR-2026-0418 raised.", kind: "request" },
    { id: "a4", at: "2026-08-29", actor: "Beldium review team", message: "Information request IR-2026-0431 raised.", kind: "request" },
  ];
}

export const statusLabel: Record<OrgStatus, string> = {
  draft: "Application in progress",
  submitted: "Submitted",
  under_review: "Under review",
  verified: "Verified miner",
};

export const roleLabel: Record<MinerRole, string> = {
  org_admin: "Organisation admin",
  org_staff: "Organisation staff",
  individual: "Individual / artisanal miner",
};
