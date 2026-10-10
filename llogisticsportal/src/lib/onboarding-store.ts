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
 * The onboarding evidence checklist: Beldium's "Logistics Partner Required
 * Documents" for Nigeria, sections 1 to 6. Section 7 of that list (mineral
 * movement documents) is collected per shipment, not at onboarding.
 *
 * Every item is required unless the list marks it conditional ("where
 * applicable"). Each files under a backend review domain; the API itself only
 * refuses submission when an applicable domain has no current document.
 */
export type DocumentItem = {
  name: string;
  domain: LogisticsDomainKey;
  note?: string;
  /** Owed only where it applies to the operator, so never blocks submission. */
  conditional: boolean;
};

const WHERE_APPLICABLE = "where applicable";
const BELDIUM_REQUIREMENT = "Beldium requirement";
const CONDITIONAL_NOTES = [WHERE_APPLICABLE, "where required", "sample couriers"];

const items = (domain: LogisticsDomainKey, list: (string | [string, string])[]): DocumentItem[] =>
  list.map((entry) =>
    typeof entry === "string"
      ? { name: entry, domain, conditional: false }
      : {
          name: entry[0],
          domain,
          note: entry[1],
          conditional: CONDITIONAL_NOTES.includes(entry[1]),
        },
  );

export const documentGroups: {
  group: string;
  related: "Organisation" | "Vehicle" | "Driver";
  items: DocumentItem[];
}[] = [
  {
    group: "Organisation and business registration",
    related: "Organisation",
    items: items("corporate", [
      ["CAC Certificate of Incorporation or Business Name Registration", "as applicable"],
      "Tax Identification Number (TIN)",
      "Company Profile",
      "Proof of Registered Business Address",
      "Authorised Representative Identification",
      ["Letter of Authorisation", WHERE_APPLICABLE],
      ["Tax Clearance Certificate", "where required"],
      ["Transport or Haulage Operating Permit", WHERE_APPLICABLE],
    ]),
  },
  {
    group: "FRSC and fleet safety",
    related: "Organisation",
    items: items("regulatory", [
      ["FRSC RTSSS Registration/Certification", WHERE_APPLICABLE],
      "Fleet Register",
      "Fleet Safety Policy",
      ["Safety Unit and Safety Manager Details", WHERE_APPLICABLE],
      "Driver Training Records",
      "Fleet Vehicle Inspection Records",
      "Vehicle Maintenance Records",
      ["Speed Limiter Compliance Evidence", WHERE_APPLICABLE],
    ]),
  },
  {
    group: "Vehicle documents",
    related: "Vehicle",
    items: [
      ...items("fleet", [
        "Vehicle Registration Certificate / Particulars",
        "Proof of Vehicle Ownership or Lease",
        ["Valid Roadworthiness Certificate", WHERE_APPLICABLE],
        "Valid Motor Insurance Certificate",
        "Vehicle Inspection Report",
        "Vehicle Maintenance / Service Records",
        ["Commercial Vehicle or Haulage Permit", WHERE_APPLICABLE],
        ["Speed Limiter Compliance Evidence", WHERE_APPLICABLE],
      ]),
      ...items("data", [["GPS Tracker / Telematics Evidence", BELDIUM_REQUIREMENT]]),
      ...items("fleet", [
        "Vehicle Photographs and Load Capacity Evidence",
        ["Trailer Registration and Documents", WHERE_APPLICABLE],
      ]),
    ],
  },
  {
    group: "Driver documents",
    related: "Driver",
    items: items("driver", [
      ["Valid Driver's Licence", "appropriate vehicle class"],
      "Driver Identification",
      "Driver Photograph",
      "Employment or Engagement Evidence",
      ["Heavy Vehicle Training Certificate", WHERE_APPLICABLE],
      "Safety Training Records",
      ["Medical Fitness Evidence", WHERE_APPLICABLE],
      ["Driver Competency Assessment", BELDIUM_REQUIREMENT],
    ]),
  },
  {
    group: "Insurance documents",
    related: "Organisation",
    items: items("insurance", [
      "Motor Vehicle Insurance Certificate",
      ["Goods-in-Transit Insurance", WHERE_APPLICABLE],
      ["Carrier's Liability Insurance", WHERE_APPLICABLE],
      ["Public Liability Insurance", WHERE_APPLICABLE],
      ["Employee Compensation / Insurance Evidence", WHERE_APPLICABLE],
      ["Shipment-Specific Cargo Insurance", WHERE_APPLICABLE],
    ]),
  },
  {
    group: "Safety and operational documents",
    related: "Organisation",
    items: [
      ...items("hs", ["Health, Safety and Environment (HSE) Policy", "Transport Safety Policy"]),
      ...items("operational", ["Journey Management Procedure"]),
      ...items("hs", ["Emergency Response Procedure", "Incident Reporting Procedure"]),
      ...items("operational", [
        "Vehicle Maintenance Procedure",
        "Driver Management Procedure",
        "Cargo Loading and Securing Procedure",
      ]),
      ...items("mineral", ["Mineral Handling Procedure"]),
      ...items("operational", ["Security and Cargo Protection Procedure"]),
      ...items("mineral", [
        ["Sample Handling Procedure", "sample couriers"],
        ["Chain of Custody Procedure", WHERE_APPLICABLE],
      ]),
      ...items("hs", [["Corrective Action Records", WHERE_APPLICABLE]]),
    ],
  },
];

const ALL_DOMAINS: LogisticsDomainKey[] = [
  "corporate",
  "regulatory",
  "fleet",
  "driver",
  "insurance",
  "hs",
  "operational",
  "mineral",
  "data",
];

/** The backend makes the mineral domain applicable when any service mentions minerals. */
export function requiredDomains(servicesChosen: string[]): LogisticsDomainKey[] {
  const mineral = servicesChosen.some((s) => s.toLowerCase().includes("mineral"));
  return ALL_DOMAINS.filter((d) => d !== "mineral" || mineral);
}

/** Who a group's documents are filed against: each vehicle, each driver, or the organisation. */
export function documentSubjects(
  related: "Organisation" | "Vehicle" | "Driver",
  vehicles: { id: string; registration: string }[],
  drivers: { id: string; name: string }[],
  orgName: string,
) {
  if (related === "Vehicle") return vehicles.map((v) => v.registration || v.id);
  if (related === "Driver") return drivers.map((d) => d.name || d.id);
  return [orgName || "Organisation"];
}

/**
 * Required documents not yet attached. Every item is owed unless it is
 * conditional; vehicle and driver items are owed once per vehicle and driver
 * (`missingFor`). Mineral procedures are owed only by mineral operators.
 */
export function outstandingDocuments(
  servicesChosen: string[],
  docs: { group: string; type: string; related: string }[],
  vehicles: { id: string; registration: string }[],
  drivers: { id: string; name: string }[],
) {
  const domains = requiredDomains(servicesChosen);
  return documentGroups.flatMap((g) =>
    g.items
      .filter((i) => !i.conditional && domains.includes(i.domain))
      .map((i) => {
        const have = docs.filter((d) => d.group === g.group && d.type === i.name);
        const missingFor =
          g.related === "Organisation"
            ? []
            : documentSubjects(g.related, vehicles, drivers, "").filter(
                (subject) => !have.some((d) => d.related === subject),
              );
        return {
          group: g.group,
          name: i.name,
          missingFor,
          missing: g.related === "Organisation" ? have.length === 0 : missingFor.length > 0,
        };
      })
      .filter((i) => i.missing),
  );
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
    // A draft started against an older checklist keeps only what is still on it
    // (or already with the API).
    state.documents = state.documents.filter(
      (d) =>
        state.server.documents[d.id] ||
        documentGroups.some(
          (g) =>
            g.group === d.group && g.items.some((i) => i.name === d.type && i.domain === d.domain),
        ),
    );
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
