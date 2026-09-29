import { useSyncExternalStore } from "react";

import type { LogisticsDomainKey } from "./api/logistics";

/**
 * The operator application draft, kept in the browser until it is submitted
 * to the API (lib/api/onboarding.ts). Records the API has already created are
 * remembered in `server`, so a failed submission resumes instead of creating
 * duplicates.
 */

export const participantTypes = [
  "Logistics Company / Fleet Operator",
  "Independent Transport Operator",
  "Sample / Courier Logistics Provider",
  "Mineral Haulage Operator",
  "Freight / Cargo Operator",
] as const;

export type SignupRole = "org_admin" | "org_staff" | "independent";

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

/**
 * Evidence groups, one per backend review domain. The API refuses submission
 * until every applicable domain has at least one current, unexpired document.
 */
export const documentGroups: {
  group: string;
  domain: LogisticsDomainKey;
  related: "Organisation" | "Vehicle" | "Driver";
  items: string[];
}[] = [
  {
    group: "Corporate documents",
    domain: "corporate",
    related: "Organisation",
    items: [
      "CAC Certificate / Business Registration",
      "TIN / Tax Registration",
      "Company Profile",
      "Proof of Registered Address",
      "Authorised Representative Evidence",
    ],
  },
  {
    group: "Regulatory licences",
    domain: "regulatory",
    related: "Organisation",
    items: [
      "Operating / Transport Licence",
      "Relevant Regulatory Registration",
      "Relevant Transport Permit",
      "Regulatory / Transport Compliance Evidence",
    ],
  },
  {
    group: "Fleet documents",
    domain: "fleet",
    related: "Vehicle",
    items: [
      "Vehicle Registration",
      "Proof of Ownership / Lease",
      "Roadworthiness Certificate",
      "Vehicle Inspection Certificate / Report",
      "Maintenance / Service Evidence",
    ],
  },
  {
    group: "Driver documents",
    domain: "driver",
    related: "Driver",
    items: [
      "Driver's Licence",
      "Driver Identification",
      "Driver Training / Competency Evidence",
      "Medical / Fitness Evidence",
    ],
  },
  {
    group: "Insurance",
    domain: "insurance",
    related: "Organisation",
    items: [
      "Vehicle Insurance",
      "Goods In Transit Insurance",
      "Public Liability / Business Insurance",
    ],
  },
  {
    group: "Health & safety",
    domain: "hs",
    related: "Organisation",
    items: [
      "HSE Policy",
      "Transport Safety Policy",
      "Emergency Response Procedure",
      "Incident Reporting Procedure",
    ],
  },
  {
    group: "Operational procedures",
    domain: "operational",
    related: "Organisation",
    items: [
      "Journey Management Procedure",
      "Vehicle Maintenance Procedure",
      "Driver Management Procedure",
      "Security / Cargo Protection Procedure",
    ],
  },
  {
    group: "Mineral transport",
    domain: "mineral",
    related: "Organisation",
    items: [
      "Cargo / Mineral Handling Procedure",
      "Sample Handling Procedure",
      "Chain of Custody Procedure",
      "Mineral Movement Compliance Evidence",
    ],
  },
  {
    group: "Data & tracking",
    domain: "data",
    related: "Organisation",
    items: ["Tracker / Telematics Evidence", "Data Protection Policy"],
  },
];

/** The backend makes the mineral domain applicable when any service mentions minerals. */
export function requiredDomains(servicesChosen: string[]): LogisticsDomainKey[] {
  const mineral = servicesChosen.some((s) => s.toLowerCase().includes("mineral"));
  return documentGroups.map((g) => g.domain).filter((d) => d !== "mineral" || mineral);
}

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

export type VehicleRecord = {
  id: string;
  registration: string;
  vin: string;
  type: string;
  make: string;
  model: string;
  year: string;
  capacity: string;
  ownership: string;
  operatingStatus: string;
  trackerInstalled: string;
  trackerId: string;
  insurer: string;
  insuranceExpiry: string;
  roadworthinessExpiry: string;
};

export type DriverRecord = {
  id: string;
  name: string;
  phone: string;
  nationalId: string;
  licenceNumber: string;
  licenceClass: string;
  expiryDate: string;
  medicalExpiry: string;
  yearsExperience: string;
  assignedVehicle: string;
  training: string;
  safetyStatus: string;
};

export type DocumentRecord = {
  id: string;
  group: string;
  domain: LogisticsDomainKey;
  type: string;
  number: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  related: string;
  fileName: string;
};

export type Organisation = {
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
  employees: string;
};

export type Capability = {
  participantType: string;
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

/** Ids of records the API already holds for this draft, keyed by local id. */
export type ServerIds = {
  organisation?: string | undefined;
  company?: string | undefined;
  application?: string | undefined;
  sections: string[];
  vehicles: Record<string, string>;
  drivers: Record<string, string>;
  documents: Record<string, string>;
};

export type DraftState = {
  /** The account this draft belongs to; a different sign-in starts afresh. */
  owner?: string | undefined;
  organisation?: Organisation | undefined;
  capability?: Capability | undefined;
  vehicles: VehicleRecord[];
  drivers: DriverRecord[];
  documents: DocumentRecord[];
  compliance: Record<string, string>;
  declarations: string[];
  wizard?: { current: number; completed: number[] } | undefined;
  server: ServerIds;
};

export const emptyOrganisation: Organisation = {
  requestedRole: "Organisation Administrator",
  name: "",
  registrationNumber: "",
  tin: "",
  orgType: "Limited Liability Company",
  registeredAddress: "",
  operatingAddress: "",
  state: "",
  lga: "",
  email: "",
  phone: "",
  website: "",
  primaryContact: "",
  yearEstablished: "",
  employees: "",
};

export const emptyCapability: Capability = {
  participantType: participantTypes[0],
  services: [],
  operatingStates: "",
  routesCovered: "",
  minerals: "",
  vehicleCategories: "",
  fleetSize: "",
  maxCapacity: "",
  tracking: "",
  security: "",
  sampleCustody: "",
};

const KEY = "beldium-logistics-application-draft";
const empty = (): DraftState => ({
  vehicles: [],
  drivers: [],
  documents: [],
  compliance: {},
  declarations: [],
  server: { sections: [], vehicles: {}, drivers: {}, documents: {} },
});

let state: DraftState = empty();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...empty(), ...JSON.parse(raw) };
  } catch {
    /* A corrupt or blocked draft just starts empty. */
  }
}

function commit(next: DraftState) {
  state = next;
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* Private mode: the draft lives for this tab only. */
  }
  listeners.forEach((l) => l());
}

export function getState() {
  load();
  return state;
}

export function setState(update: Partial<DraftState> | ((s: DraftState) => Partial<DraftState>)) {
  load();
  const patch = typeof update === "function" ? update(state) : update;
  commit({ ...state, ...patch });
}

/** Replaces rather than merges, so optional keys don't survive. */
export function resetState(owner?: string) {
  load();
  commit({ ...empty(), owner });
}

export function recordServerId(patch: Partial<ServerIds>) {
  setState((s) => ({ server: { ...s.server, ...patch } }));
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const serverSnapshot = empty();
export function useDraft() {
  return useSyncExternalStore(subscribe, getState, () => serverSnapshot);
}

export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
