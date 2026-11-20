// Independent Transport Operator (natural person / owner-driver) model.
//
// Ported from the Lovable logistics prototype (src/lib/independent-model.ts).
// The backend has no independent-operator resource yet, so the application,
// its review record and its trips live in the browser (lib/independent/store).
// Nothing here is a government permit or a real compliance decision.

import { isActiveTrip, type TransportAssignment } from "@/lib/trips/model";

export type Fields = Record<string, string | undefined>;

export const OPERATOR_TYPES = [
  "Owner-driver",
  "Independent driver",
  "Sole proprietor",
  "Contracted haulier",
  "Other",
] as const;

export const IND_STEPS = [
  "Personal identity",
  "Operator profile",
  "Vehicles",
  "Driver credentials",
  "Operating scope",
  "Authorizations",
  "Evidence and declarations",
  "Review and submit",
] as const;

export const IND_DECLARATIONS: [string, string][] = [
  ["truth", "The information I provide is true and complete to the best of my knowledge."],
  ["authorization", "I am authorized to operate, or to be authorized on, every declared vehicle."],
  [
    "custody",
    "I will maintain cargo custody records, quantities and exception reports for every movement.",
  ],
  [
    "roadSafety",
    "I will comply with applicable road-safety, fatigue and load-restraint obligations.",
  ],
  [
    "notGovernment",
    "I understand that Beldium platform status is not a government licence or permit.",
  ],
  [
    "independent",
    "I understand my submission is verified by separate Beldium compliance officers, not by me.",
  ],
  [
    "privacy",
    "I understand these records stay in this browser until Beldium connects them; I will not enter real ID numbers or documents.",
  ],
];

export type OperatorStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Information Requested"
  | "Demo Eligible"
  | "Demo Restricted";

export type VehicleOwnership = "Owned" | "Leased" | "Contracted";

export interface IndVehicle {
  id: string;
  registration: string;
  type: string;
  /** Tonnes. */
  payload: number;
  ownership: VehicleOwnership;
  insuranceExpiry: string;
  roadworthinessExpiry: string;
  ownerAuthorization: boolean;
}

export interface EvidencePlaceholder {
  filename: string;
  declared: boolean;
}

export interface IndependentApplication {
  operatorId: string;
  userId: string;
  step: number;
  completed: number[];
  personal: Fields;
  profile: Fields;
  driverOnly: boolean;
  vehicles: IndVehicle[];
  licence: Fields;
  scope: Fields;
  authorizations: Record<string, boolean>;
  evidence: Record<string, EvidencePlaceholder>;
  declarations: Record<string, boolean>;
  status: "Draft" | "Submitted";
  reference?: string | undefined;
  submittedAt?: string | undefined;
}

export interface IndRequirement {
  id: string;
  name: string;
  reason: string;
  applicable: boolean;
}

/** What a compliance officer recorded when verifying a requirement. */
export interface VerificationRecord {
  subject: string;
  requirement: string;
  evidenceRef: string;
  source: string;
  method: string;
  officer: string;
  at: string;
  findings: string;
  decision: string;
  scope: string;
  nextReview: string;
}

export type Readiness = "Compliant" | "Attention" | "Non-compliant";

export type ReviewStatus =
  | "Pending Review"
  | "Under Review"
  | "Awaiting Information"
  | "Approved"
  | "Conditionally Approved"
  | "Rejected";

export interface RequirementReview {
  status: "pending" | "verified" | "rejected";
  verification?: VerificationRecord | undefined;
}

export interface InformationRequest {
  id: string;
  reason: string;
  message: string;
  items: string[];
  status: "Open" | "Responded";
  response?: { message: string; filename: string; at: string } | undefined;
}

/**
 * The officer-side record for an independent operator: overall status,
 * per-vehicle and driver readiness, and per-requirement verification.
 * Only Beldium compliance officers change it; the operator never does.
 */
export interface OperatorReview {
  status: ReviewStatus;
  reviewer: string;
  decisionSummary?: string | undefined;
  driver: Readiness;
  vehicles: Record<string, Readiness>;
  requirements: Record<string, RequirementReview>;
  requests: InformationRequest[];
}

const val = (f: Fields, k: string) => (f[k] ?? "").trim();
const list = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export function newIndependentApplication(
  operatorId: string,
  userId: string,
  p: { firstName: string; lastName: string; email: string; phone: string },
): IndependentApplication {
  return {
    operatorId,
    userId,
    step: 0,
    completed: [],
    personal: { firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.phone },
    profile: {},
    driverOnly: false,
    vehicles: [],
    licence: {},
    scope: {},
    authorizations: {},
    evidence: {},
    declarations: {},
    status: "Draft",
  };
}

export const claimsRegisteredBusiness = (a: IndependentApplication) =>
  val(a.profile, "registeredBusiness") === "Yes";

export const carriesMinerals = (a: IndependentApplication) =>
  /mineral|ore|bulk|lithium|tin|lead|zinc|gold|granite|coal|barite/i.test(
    `${val(a.scope, "cargo")} ${val(a.scope, "minerals")}`,
  );

export const hazardous = (a: IndependentApplication) =>
  /hazard|lead|chemical|tanker|explosive/i.test(
    `${val(a.scope, "cargo")} ${val(a.scope, "minerals")} ${a.vehicles.map((x) => x.type).join(" ")}`,
  );

export const interstate = (a: IndependentApplication) => list(val(a.scope, "states")).length > 1;

/** Conditional requirements. Nothing here is a universal permit; applicability depends on declared scope. */
export function indRequirements(a: IndependentApplication): IndRequirement[] {
  const hasVehicles = !a.driverOnly && a.vehicles.length > 0;
  const nonOwned = hasVehicles && a.vehicles.some((x) => x.ownership !== "Owned");
  return [
    {
      id: "identity",
      name: "Personal identity evidence",
      reason: "Every operator",
      applicable: true,
    },
    {
      id: "licence",
      name: "Driver's licence evidence",
      reason: "Every operator drives",
      applicable: true,
    },
    {
      id: "business",
      name: "Business name registration (CAC BN)",
      reason: "Only because you declared a registered sole-proprietor business",
      applicable: claimsRegisteredBusiness(a),
    },
    {
      id: "frsc",
      name: "FRSC / RTSSS compliance information where applicable",
      reason: "You declared a commercial vehicle; applicability is confirmed during review",
      applicable: hasVehicles,
    },
    {
      id: "vehicleDocs",
      name: "Vehicle registration, insurance and roadworthiness",
      reason: "You declared at least one vehicle",
      applicable: hasVehicles,
    },
    {
      id: "ownerAuth",
      name: "Vehicle owner authorization",
      reason: "A declared vehicle is leased or contracted",
      applicable: nonOwned,
    },
    {
      id: "mineral",
      name: "Mineral haulage authorization where applicable",
      reason: "Your declared cargo includes minerals",
      applicable: carriesMinerals(a),
    },
    {
      id: "hazard",
      name: "Hazardous cargo handling competence",
      reason: "Declared cargo or vehicle type indicates hazardous material",
      applicable: hazardous(a),
    },
    {
      id: "corridor",
      name: "Interstate journey-management arrangement",
      reason: "You declared more than one operating state",
      applicable: interstate(a),
    },
  ];
}

export const applicableReqs = (a: IndependentApplication) =>
  indRequirements(a).filter((r) => r.applicable);

export const today = () => new Date().toISOString().slice(0, 10);

/** What is still missing on one wizard step (0-7). Empty means the step is complete. */
export function indMissing(a: IndependentApplication, step: number, on = today()): string[] {
  const need = (f: Fields, keys: [string, string][]) =>
    keys.filter(([k]) => !val(f, k)).map(([, label]) => label);
  switch (step) {
    case 0:
      return need(a.personal, [
        ["firstName", "First name"],
        ["lastName", "Last name"],
        ["email", "Email"],
        ["phone", "Phone"],
        ["state", "State"],
        ["lga", "LGA"],
        ["address", "Residential address"],
        ["idType", "ID type"],
        ["idFilename", "ID evidence filename"],
      ]);
    case 1:
      return [
        ...need(a.profile, [
          ["operatorType", "Operator type"],
          ["experience", "Years of experience"],
          ["services", "Services offered"],
        ]),
        ...(claimsRegisteredBusiness(a)
          ? need(a.profile, [
              ["businessName", "Registered business name"],
              ["bnNumber", "Business name (BN) number"],
            ])
          : []),
      ];
    case 2:
      if (a.driverOnly) return [];
      if (!a.vehicles.length) return ["Add a vehicle or declare driver-only"];
      return a.vehicles.flatMap((x) => [
        ...(!x.registration || !x.type || !x.insuranceExpiry || !x.roadworthinessExpiry
          ? [`${x.registration || "Vehicle"}: vehicle details and expiry dates`]
          : []),
        ...(x.ownership !== "Owned" && !x.ownerAuthorization
          ? [`${x.registration}: owner authorization`]
          : []),
        ...(x.payload > 0 ? [] : [`${x.registration}: payload`]),
      ]);
    case 3: {
      const missing = need(a.licence, [
        ["number", "Licence number"],
        ["class", "Licence class"],
        ["expiry", "Licence expiry"],
        ["competence", "Competence summary"],
      ]);
      const expiry = val(a.licence, "expiry");
      if (expiry && expiry <= on) missing.push("Licence must not be expired");
      return missing;
    }
    case 4:
      return need(a.scope, [
        ["states", "Operating states"],
        ["corridors", "Corridors / routes"],
        ["cargo", "Cargo types"],
        ["monthlyCapacity", "Monthly capacity"],
        ["safety", "Safety and incident arrangements"],
      ]);
    case 5:
      return applicableReqs(a)
        .filter((r) => !a.authorizations[r.id])
        .map((r) => `Declare: ${r.name}`);
    case 6:
      return [
        ...applicableReqs(a)
          .filter((r) => !a.evidence[r.id]?.filename.trim())
          .map((r) => `Filename: ${r.name}`),
        ...IND_DECLARATIONS.filter(([k]) => !a.declarations[k]).map(
          ([, label]) => `${label.split(" ").slice(0, 5).join(" ")}…`,
        ),
      ];
    default:
      return a.declarations["submit"] ? [] : ["Confirm submission"];
  }
}

export const indSubmissionMissing = (a: IndependentApplication) =>
  IND_STEPS.slice(0, 7).flatMap((name, i) => indMissing(a, i).map((m) => `${name}: ${m}`));

/** Submission is not eligibility: only the officer's review moves the operator past "Submitted". */
export function operatorStatus(
  a: IndependentApplication | undefined,
  review: OperatorReview | undefined,
): OperatorStatus {
  if (!a || a.status === "Draft") return "Draft";
  if (!review) return "Submitted";
  switch (review.status) {
    case "Approved":
    case "Conditionally Approved":
      return "Demo Eligible";
    case "Rejected":
      return "Demo Restricted";
    case "Awaiting Information":
      return "Information Requested";
    case "Under Review":
      return "Under Review";
    default:
      return "Submitted";
  }
}

export const driverIdFor = (operatorId: string) => `${operatorId}-DRV`;

/** A fresh review record for a newly submitted (or materially edited) application. */
export function pendingReview(a: IndependentApplication): OperatorReview {
  return {
    status: "Pending Review",
    reviewer: "Unassigned",
    driver: "Attention",
    vehicles: Object.fromEntries(a.vehicles.map((x) => [x.id, "Attention" as Readiness])),
    requirements: Object.fromEntries(
      applicableReqs(a).map((r) => [r.id, { status: "pending" } as RequirementReview]),
    ),
    requests: [],
  };
}

/** The declarations an officer reviewed; navigation state (step, completed) is excluded. */
const operational = (a: IndependentApplication) =>
  JSON.stringify({
    ...a,
    step: 0,
    completed: [],
    declarations: { ...a.declarations, submit: true },
  });

/** Editing submitted operational declarations resets readiness for separate review. */
export const materiallyChanged = (prev: IndependentApplication, next: IndependentApplication) =>
  prev.status === "Submitted" && operational(prev) !== operational(next);

// --- assignment gating -------------------------------------------------------------------

export interface Opening {
  id: string;
  client: string;
  mineral: string;
  quantity: number;
  unit: string;
  pickup: string;
  destination: string;
  date: string;
  minPayload: number;
  requiresMineralAuth: boolean;
  vehicleRequired: true;
}

export const DEMO_OPENINGS: Opening[] = [
  {
    id: "RFQ-DEMO-301",
    client: "Jos Plateau Tin Cooperative",
    mineral: "Tin concentrate",
    quantity: 18,
    unit: "tonnes",
    pickup: "Bukuru, Plateau",
    destination: "Kaduna inland dry port",
    date: "2026-12-02",
    minPayload: 18,
    requiresMineralAuth: true,
    vehicleRequired: true,
  },
  {
    id: "RFQ-DEMO-302",
    client: "Ebonyi Lead-Zinc Aggregators",
    mineral: "Lead-zinc ore (hazardous handling)",
    quantity: 25,
    unit: "tonnes",
    pickup: "Abakaliki, Ebonyi",
    destination: "Enugu processing yard",
    date: "2026-12-05",
    minPayload: 25,
    requiresMineralAuth: true,
    vehicleRequired: true,
  },
  {
    id: "RFQ-DEMO-303",
    client: "Ogun Granite Quarry",
    mineral: "Granite aggregate",
    quantity: 10,
    unit: "tonnes",
    pickup: "Abeokuta, Ogun",
    destination: "Ikeja, Lagos",
    date: "2026-12-08",
    minPayload: 10,
    requiresMineralAuth: false,
    vehicleRequired: true,
  },
];

const verified = (review: OperatorReview, id: string) => {
  const r = review.requirements[id];
  return r?.status === "verified" && Boolean(r.verification);
};

/** The vehicles a compliance officer has marked Demo Eligible. */
export const eligibleVehicles = (a: IndependentApplication, review: OperatorReview | undefined) =>
  a.driverOnly ? [] : a.vehicles.filter((x) => review?.vehicles[x.id] === "Compliant");

/** Picks the first eligible vehicle big enough for the opening. */
export const defaultVehicleFor = (
  o: Opening,
  a: IndependentApplication,
  review: OperatorReview | undefined,
) => eligibleVehicles(a, review).find((x) => x.payload >= o.minPayload)?.id ?? "";

/** Why the operator cannot accept the opening; an empty list means eligible. */
export function openingRestrictions(
  o: Opening,
  a: IndependentApplication | undefined,
  review: OperatorReview | undefined,
  trips: Pick<TransportAssignment, "operatorId" | "status">[],
  vehicleId?: string,
  on = today(),
): string[] {
  if (!a || a.status !== "Submitted" || !review)
    return ["Submit your onboarding application first"];
  const reasons: string[] = [];
  const status = operatorStatus(a, review);
  if (status !== "Demo Eligible")
    reasons.push(`Operator compliance status is "${status}"; Demo Eligible is required`);
  if (review.driver !== "Compliant") reasons.push("Driver credentials are not yet Demo Eligible");
  if (val(a.licence, "expiry") && val(a.licence, "expiry") <= on)
    reasons.push("Driver licence has expired");

  const declared = a.driverOnly ? [] : a.vehicles;
  if (!declared.length) {
    reasons.push(
      "This assignment requires a vehicle; driver-only operators need a compliant vehicle assigned first",
    );
  } else {
    const eligible = eligibleVehicles(a, review);
    if (!eligible.length) reasons.push("No vehicle is Demo Eligible yet");
    const chosen = vehicleId
      ? eligible.find((x) => x.id === vehicleId)
      : eligible.find((x) => x.payload >= o.minPayload);
    if (eligible.length && !chosen)
      reasons.push(
        vehicleId
          ? "Selected vehicle is not Demo Eligible"
          : `No Demo Eligible vehicle with ≥ ${o.minPayload} t payload`,
      );
    if (chosen && (chosen.insuranceExpiry <= on || chosen.roadworthinessExpiry <= on))
      reasons.push("Selected vehicle insurance or roadworthiness has expired");
    if (chosen && chosen.payload < o.minPayload)
      reasons.push(`Selected vehicle payload is below ${o.minPayload} t`);
  }
  if (o.requiresMineralAuth && !(a.authorizations["mineral"] && verified(review, "mineral")))
    reasons.push("Mineral haulage authorization is not verified for your scope");
  if (/hazard/i.test(o.mineral) && !(a.authorizations["hazard"] && verified(review, "hazard")))
    reasons.push("Hazardous cargo competence is not verified");
  if (trips.some((t) => t.operatorId === a.operatorId && isActiveTrip(t)))
    reasons.push("You already have an active trip");
  return reasons;
}

// --- seeded demo operator ----------------------------------------------------------------

export const SEED_IND_ID = "BLC-IND-DEMO01";

export const SEED_IND_APP: IndependentApplication = {
  operatorId: SEED_IND_ID,
  userId: "demo-independent",
  step: 7,
  completed: [0, 1, 2, 3, 4, 5, 6, 7],
  personal: {
    firstName: "Danladi",
    lastName: "Yusuf",
    email: "independent.demo@beldium.test",
    phone: "Demo contact",
    state: "Plateau",
    lga: "Jos South",
    address: "Demo address, Bukuru",
    idType: "NIN slip",
    idFilename: "demo-id-placeholder.pdf",
  },
  profile: {
    operatorType: "Owner-driver",
    experience: "9",
    services: "Bulk mineral haulage, Mine-to-warehouse",
    registeredBusiness: "No",
  },
  driverOnly: false,
  vehicles: [
    {
      id: "IND-VEH-01",
      registration: "PLT-482-JS",
      type: "Tipper truck",
      payload: 20,
      ownership: "Owned",
      insuranceExpiry: "2027-06-30",
      roadworthinessExpiry: "2027-03-31",
      ownerAuthorization: true,
    },
  ],
  licence: {
    number: "DEMO-LIC-0001",
    class: "Class E",
    expiry: "2028-04-30",
    competence: "Defensive driving; load restraint",
    certifications: "Defensive driving, Mineral cargo handling",
  },
  scope: {
    states: "Plateau, Kaduna",
    corridors: "Jos–Kaduna",
    cargo: "Bulk minerals",
    minerals: "Tin concentrate, columbite",
    monthlyCapacity: "160 tonnes",
    safety: "Phone check-ins every 2 hours; breakdown partner in Kaduna",
  },
  authorizations: {
    identity: true,
    licence: true,
    frsc: true,
    vehicleDocs: true,
    mineral: true,
    corridor: true,
  },
  evidence: Object.fromEntries(
    ["identity", "licence", "frsc", "vehicleDocs", "mineral", "corridor"].map((k) => [
      k,
      { filename: `demo-${k}.pdf`, declared: true },
    ]),
  ),
  declarations: { ...Object.fromEntries(IND_DECLARATIONS.map(([k]) => [k, true])), submit: true },
  status: "Submitted",
  reference: "BLC-IND-DEMO0001",
  submittedAt: "2026-10-01T09:00:00.000Z",
};

/** The seeded demo operator's review: a recorded demo decision, not a real registry check. */
export function seedReview(): OperatorReview {
  const base = pendingReview(SEED_IND_APP);
  return {
    ...base,
    status: "Approved",
    reviewer: "Seeded demo decision",
    decisionSummary: "Seeded demo approval for walkthroughs; no real registry check was made.",
    driver: "Compliant",
    vehicles: Object.fromEntries(
      SEED_IND_APP.vehicles.map((x) => [x.id, "Compliant" as Readiness]),
    ),
    requirements: Object.fromEntries(
      applicableReqs(SEED_IND_APP).map((r) => [
        r.id,
        {
          status: "verified",
          verification: {
            subject: SEED_IND_ID,
            requirement: r.name,
            evidenceRef: SEED_IND_APP.evidence[r.id]?.filename ?? "",
            source: "Seeded simulated source",
            method: "Demo evidence review",
            officer: "Demo compliance officer",
            at: "2026-10-02T10:00:00Z",
            findings: "Seeded demo record; no real registry check",
            decision: "Demo verified",
            scope: "Prototype only",
            nextReview: "2027-01-01",
          },
        } as RequirementReview,
      ]),
    ),
  };
}
