import { useSyncExternalStore } from "react";

/**
 * Demo store for the Logistics Operator application.
 * One record set (organisation, vehicles, drivers, documents) is shared by
 * onboarding, the operator dashboard and the Logistics Compliance review —
 * nothing is copied between them.
 */

export const participantTypes = [
  "Logistics Company / Fleet Operator",
  "Independent Transport Operator",
  "Sample / Courier Logistics Provider",
  "Mineral Haulage Operator",
  "Freight / Cargo Operator",
  "Authorised Employee of Existing Logistics Organisation",
] as const;

export const roles = [
  "Organisation Administrator",
  "Logistics Manager",
  "Operations Manager",
  "Fleet Manager",
  "Transport Coordinator",
  "Dispatcher",
  "Driver Manager",
  "Safety / HSE Officer",
  "Compliance Officer",
  "Finance Officer",
  "Driver",
  "Read Only User",
  "Other",
];

export const services = [
  "Sample Transportation",
  "Mineral Haulage",
  "Mine to Laboratory",
  "Mine to Warehouse",
  "Mine to Processor",
  "Warehouse to Processor",
  "Processor to Export",
  "Port Transportation",
  "Long Haul Transportation",
  "Interstate Transportation",
  "Last Mile Delivery",
  "Other",
];

export const documentGroups: { group: string; related: "Organisation" | "Vehicle" | "Driver"; items: string[] }[] = [
  {
    group: "Organisation documents",
    related: "Organisation",
    items: [
      "CAC Certificate / Business Registration",
      "TIN / Tax Registration",
      "Company Profile",
      "Operating / Transport Licence (where applicable)",
      "Relevant Regulatory Registration",
      "Proof of Registered Address",
      "Authorised Representative Evidence",
    ],
  },
  {
    group: "Vehicle documents",
    related: "Vehicle",
    items: [
      "Vehicle Registration",
      "Proof of Ownership / Lease",
      "Roadworthiness Certificate",
      "Vehicle Inspection Certificate / Report",
      "Vehicle Insurance",
      "Relevant Transport Permit",
      "Maintenance / Service Evidence",
      "Tracker / Telematics Evidence (where applicable)",
    ],
  },
  {
    group: "Driver documents",
    related: "Driver",
    items: [
      "Driver's Licence",
      "Driver Identification",
      "Driver Training / Competency Evidence",
      "Safety Training Evidence",
      "Medical / Fitness Evidence (where required)",
      "Other relevant driver authorisations",
    ],
  },
  {
    group: "Safety & operations documents",
    related: "Organisation",
    items: [
      "HSE Policy",
      "Transport Safety Policy",
      "Journey Management Procedure",
      "Emergency Response Procedure",
      "Incident Reporting Procedure",
      "Vehicle Maintenance Procedure",
      "Driver Management Procedure",
      "Cargo / Mineral Handling Procedure",
      "Sample Handling Procedure (where applicable)",
      "Chain of Custody Procedure (where applicable)",
      "Security / Cargo Protection Procedure",
    ],
  },
  {
    group: "Compliance documents",
    related: "Organisation",
    items: [
      "Fleet Compliance Records",
      "Vehicle Inspection Records",
      "Driver Verification Records",
      "Safety Inspection Records",
      "Incident Records (where applicable)",
      "Corrective Action Records (where applicable)",
      "Regulatory / Transport Compliance Evidence",
      "Mineral Movement Compliance Evidence (where applicable)",
    ],
  },
  {
    group: "Insurance",
    related: "Organisation",
    items: [
      "Vehicle Insurance",
      "Goods In Transit Insurance (where applicable)",
      "Public Liability / Relevant Business Insurance (where applicable)",
    ],
  },
];

export const complianceQuestions = [
  "Do vehicles have active tracking?",
  "Do you maintain vehicle inspection records?",
  "Do you verify drivers before assignment?",
  "Do you maintain driver licence expiry records?",
  "Do you operate journey management procedures?",
  "Do you maintain incident records?",
  "Do you maintain vehicle maintenance records?",
  "Do you support chain of custody?",
  "Do you maintain pickup and delivery evidence?",
  "Do you maintain quantity / cargo handover records?",
  "Do you have emergency response procedures?",
];

export const declarations = [
  "Information provided is accurate",
  "Documents are authentic",
  "Vehicles and drivers submitted belong to or are authorised for the organisation",
  "Beldium may verify submitted information",
  "The organisation agrees to Beldium compliance and audit requirements",
];

export const applicationStatuses = [
  "Submitted",
  "Under Review",
  "Information Required",
  "Enhanced Review Required",
  "Inspection Required",
  "Conditionally Approved",
  "Approved",
  "Rejected",
  "Suspended",
] as const;
export type ApplicationStatus = (typeof applicationStatuses)[number];

export const docStatuses = [
  "Uploaded",
  "Under Review",
  "Verified",
  "Information Required",
  "Rejected",
  "Expiring",
  "Expired",
] as const;

export type VehicleRecord = {
  id: string;
  registration: string;
  type: string;
  make: string;
  model: string;
  year: string;
  capacity: string;
  ownership: string;
  operatingStatus: string;
  trackerInstalled: string;
  trackerId: string;
  inspection: string;
  insurance: string;
  roadworthiness: string;
  maintenance: string;
  reviewStatus: string;
};

export type DriverRecord = {
  id: string;
  name: string;
  phone: string;
  driverId: string;
  licenceNumber: string;
  licenceClass: string;
  issueDate: string;
  expiryDate: string;
  assignedVehicle: string;
  training: string;
  safetyStatus: string;
  reviewStatus: string;
};

export type DocumentRecord = {
  id: string;
  group: string;
  type: string;
  number: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  related: string;
  fileName: string;
  status: (typeof docStatuses)[number];
};

export type InfoRequest = {
  id: string;
  area: string;
  message: string;
  requestedAt: string;
  response?: string;
  evidence?: string;
  respondedAt?: string;
  status: "Open" | "Responded" | "Closed";
};

export type Account = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  password: string;
  participantType: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

export type Organisation = {
  mode: "register" | "join";
  joinOrgId?: string;
  requestedRole: string;
  name: string;
  registrationNumber: string;
  tin: string;
  orgType: string;
  registeredAddress: string;
  operatingAddress: string;
  state: string;
  lga: string;
  email: string;
  phone: string;
  website: string;
  primaryContact: string;
  yearEstablished: string;
};

export type Capability = {
  services: string[];
  operatingStates: string;
  routesCovered: string;
  minerals: string;
  vehicleCategories: string;
  fleetSize: string;
  maxCapacity: string;
  tracking: string;
  security: string;
  sampleCustody: string;
};

export type Application = {
  applicationId: string;
  organisationId: string;
  submittedAt: string;
  status: ApplicationStatus;
  reviews: Record<"Organisation" | "Fleet" | "Driver" | "Document" | "Compliance", string>;
  timeline: { at: string; by: string; event: string }[];
  infoRequests: InfoRequest[];
  approval?: {
    logisticsId: string;
    services: string[];
    vehicleCategories: string;
    coverage: string;
    capabilities: string[];
  };
};

export type OperatorState = {
  account?: Account;
  organisation?: Organisation;
  capability?: Capability;
  vehicles: VehicleRecord[];
  drivers: DriverRecord[];
  documents: DocumentRecord[];
  compliance: Record<string, string>;
  declarations: string[];
  application?: Application;
  signedIn: boolean;
};

export const existingOrganisations = [
  { id: "BLD-LOG-00412", name: "Trans Sahel Haulage Ltd", reg: "RC 1482231" },
  { id: "BLD-LOG-00388", name: "Jos Plateau Mineral Movers", reg: "RC 1320945" },
  { id: "BLD-LOG-00455", name: "Kaduna Courier & Sample Logistics", reg: "RC 1598810" },
];

const KEY = "beldium-logistics-operator";
const empty: OperatorState = {
  vehicles: [],
  drivers: [],
  documents: [],
  compliance: {},
  declarations: [],
  signedIn: false,
};

let state: OperatorState = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...empty, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
}

export function getState() {
  load();
  return state;
}

export function setState(update: Partial<OperatorState> | ((s: OperatorState) => Partial<OperatorState>)) {
  load();
  const patch = typeof update === "function" ? update(state) : update;
  state = { ...state, ...patch };
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function resetState() {
  setState({ ...empty });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useOperator() {
  return useSyncExternalStore(subscribe, getState, () => empty);
}

export const now = () => new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export function submitApplication() {
  const s = getState();
  const at = now();
  const year = new Date().getFullYear();
  const orgId =
    s.organisation?.mode === "join" && s.organisation.joinOrgId
      ? s.organisation.joinOrgId
      : `BLD-ORG-${Math.floor(10000 + Math.random() * 89999)}`;
  setState({
    vehicles: s.vehicles.map((v) => ({ ...v, reviewStatus: "Under Review" })),
    drivers: s.drivers.map((d) => ({ ...d, reviewStatus: "Under Review" })),
    documents: s.documents.map((d) => ({ ...d, status: "Under Review" })),
    application: {
      applicationId: `BLD-LAPP-${year}-${Math.floor(1000 + Math.random() * 8999)}`,
      organisationId: orgId,
      submittedAt: at,
      status: "Under Review",
      reviews: {
        Organisation: "Under Review",
        Fleet: "Under Review",
        Driver: "Under Review",
        Document: "Under Review",
        Compliance: "Under Review",
      },
      timeline: [
        { at, by: `${s.account?.firstName ?? ""} ${s.account?.lastName ?? ""}`.trim(), event: "Application submitted" },
        { at, by: "Beldium Logistics Compliance", event: "Added to Compliance Review Queue" },
      ],
      infoRequests: [],
    },
  });
}

/** Simulated actions performed by Beldium Logistics Compliance on the same records. */
export function complianceRequestInfo() {
  const s = getState();
  if (!s.application) return;
  const at = now();
  const req: InfoRequest = {
    id: uid("IR"),
    area: "Vehicle documents",
    message: `Please upload a current Roadworthiness Certificate for ${s.vehicles[0]?.registration ?? "your first vehicle"}. The uploaded copy is not legible.`,
    requestedAt: at,
    status: "Open",
  };
  setState({
    documents: s.documents.map((d, i) => (i === 0 ? { ...d, status: "Information Required" } : d)),
    application: {
      ...s.application,
      status: "Information Required",
      reviews: { ...s.application.reviews, Fleet: "Information Required" },
      infoRequests: [req, ...s.application.infoRequests],
      timeline: [{ at, by: "Beldium Logistics Compliance", event: "Information requested: Vehicle documents" }, ...s.application.timeline],
    },
  });
}

export function respondToRequest(id: string, response: string, evidence: string) {
  const s = getState();
  if (!s.application) return;
  const at = now();
  setState({
    application: {
      ...s.application,
      status: "Under Review",
      reviews: { ...s.application.reviews, Fleet: "Under Review" },
      infoRequests: s.application.infoRequests.map((r) =>
        r.id === id ? { ...r, response, evidence, respondedAt: at, status: "Responded" } : r,
      ),
      timeline: [{ at, by: "Operator", event: "Response submitted — returned to Compliance Review Queue" }, ...s.application.timeline],
    },
  });
}

export function complianceApprove() {
  const s = getState();
  if (!s.application) return;
  const at = now();
  setState({
    vehicles: s.vehicles.map((v) => ({ ...v, reviewStatus: "Verified" })),
    drivers: s.drivers.map((d) => ({ ...d, reviewStatus: "Verified" })),
    documents: s.documents.map((d) => ({ ...d, status: "Verified" })),
    application: {
      ...s.application,
      status: "Approved",
      reviews: { Organisation: "Approved", Fleet: "Approved", Driver: "Approved", Document: "Verified", Compliance: "Approved" },
      infoRequests: s.application.infoRequests.map((r) => ({ ...r, status: "Closed" })),
      approval: {
        logisticsId: `BLD-LOG-${Math.floor(10000 + Math.random() * 89999)}`,
        services: s.capability?.services ?? [],
        vehicleCategories: s.capability?.vehicleCategories || "—",
        coverage: s.capability?.operatingStates || "—",
        capabilities: [
          s.capability?.tracking === "Yes" ? "GPS tracking" : "",
          s.capability?.security === "Yes" ? "Cargo security" : "",
          s.capability?.sampleCustody === "Yes" ? "Sample chain of custody" : "",
        ].filter(Boolean),
      },
      timeline: [{ at, by: "Beldium Logistics Compliance", event: "Organisation approved — account upgraded to Verified Logistics Operator" }, ...s.application.timeline],
    },
  });
}
