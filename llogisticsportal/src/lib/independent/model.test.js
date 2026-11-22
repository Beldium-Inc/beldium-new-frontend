// Run with: bun test src/lib (from llogisticsportal). Ported from the Lovable
// prototype's independent-model and logistics-model rule tests.
import { expect, test } from "bun:test";

import {
  DEMO_OPENINGS,
  IND_STEPS,
  SEED_IND_APP,
  indMissing,
  indRequirements,
  materiallyChanged,
  openingRestrictions,
  operatorStatus,
  seedReview,
} from "./model";
import { applyDelivery, applyEvent, stageForMovement } from "../trips/model";

const draft = () => structuredClone(SEED_IND_APP);
const ON = "2026-11-20";

test("independent journey has exactly eight steps", () => expect(IND_STEPS.length).toBe(8));

test("every logistics operator needs CAC business evidence, registered or not", () => {
  const a = draft();
  a.profile.operatorType = "Independent driver";
  a.profile.registeredBusiness = "No";
  expect(indRequirements(a).find((r) => r.id === "business").applicable).toBe(true);
});

test("sole proprietor only needs business registration when it is claimed", () => {
  const a = draft();
  a.profile.operatorType = "Sole proprietor";
  a.profile.registeredBusiness = "Yes";
  expect(indRequirements(a).find((r) => r.id === "business").applicable).toBe(true);
  expect(indMissing(a, 1)).toContain("Business name (BN) number");
});

test("driver-only can pass the vehicle step and skips vehicle requirements", () => {
  const a = draft();
  a.driverOnly = true;
  a.vehicles = [];
  expect(indMissing(a, 2)).toEqual([]);
  expect(indRequirements(a).find((r) => r.id === "frsc").applicable).toBe(false);
});

test("driver-only cannot accept a vehicle-dependent opening", () => {
  const a = draft();
  a.driverOnly = true;
  expect(openingRestrictions(DEMO_OPENINGS[0], a, seedReview(), [], undefined, ON)).toContain(
    "This assignment requires a vehicle; driver-only operators need a compliant vehicle assigned first",
  );
});

test("expired licence fails onboarding", () => {
  const a = draft();
  a.licence.expiry = "2025-01-01";
  expect(indMissing(a, 3, ON)).toContain("Licence must not be expired");
});

test("submission is distinct from compliance eligibility", () => {
  expect(operatorStatus(draft(), { ...seedReview(), status: "Pending Review" })).toBe("Submitted");
  expect(operatorStatus(draft(), { ...seedReview(), status: "Rejected" })).toBe("Demo Restricted");
  expect(operatorStatus(draft(), undefined)).toBe("Submitted");
});

test("the seeded eligible operator passes every check", () =>
  expect(
    openingRestrictions(DEMO_OPENINGS[0], draft(), seedReview(), [], "IND-VEH-01", ON),
  ).toEqual([]));

test("a declared authorization without officer verification cannot unlock minerals", () => {
  const review = seedReview();
  review.requirements.mineral = { status: "pending" };
  expect(openingRestrictions(DEMO_OPENINGS[0], draft(), review, [], undefined, ON)).toContain(
    "Mineral haulage authorization is not verified for your scope",
  );
});

test("payload and hazardous competence restrict independently", () => {
  const r = openingRestrictions(DEMO_OPENINGS[1], draft(), seedReview(), [], "IND-VEH-01", ON);
  expect(r).toContain("Selected vehicle payload is below 25 t");
  expect(r).toContain("Hazardous cargo competence is not verified");
});

test("an active trip blocks acceptance", () => {
  const trips = [{ operatorId: SEED_IND_APP.operatorId, status: "Accepted" }];
  expect(
    openingRestrictions(DEMO_OPENINGS[0], draft(), seedReview(), trips, undefined, ON),
  ).toContain("You already have an active trip");
});

test("a non-compliant driver blocks acceptance despite operator approval", () => {
  const review = { ...seedReview(), driver: "Non-compliant" };
  expect(openingRestrictions(DEMO_OPENINGS[0], draft(), review, [], undefined, ON)).toContain(
    "Driver credentials are not yet Demo Eligible",
  );
});

test("non-owned vehicles need owner authorization", () => {
  const a = draft();
  a.vehicles[0].ownership = "Leased";
  a.vehicles[0].ownerAuthorization = false;
  expect(indMissing(a, 2)).toContain("PLT-482-JS: owner authorization");
});

test("navigating steps is not a material change; editing declarations is", () => {
  const a = draft();
  expect(materiallyChanged(a, { ...a, step: 2 })).toBe(false);
  expect(materiallyChanged(a, { ...a, scope: { ...a.scope, corridors: "Jos–Abuja" } })).toBe(true);
});

// --- trip lifecycle ---

const actor = { name: "Test operator", canClose: true };
const trip = () => ({
  id: "T1",
  operatorId: "OP",
  sector: "Demo",
  rfq: "RFQ",
  cargo: { reference: "C", mineral: "Tin", description: "", quantity: 18, unit: "tonnes" },
  pickupOrganization: "A",
  pickup: "Bukuru",
  deliveryOrganization: "B",
  destination: "Kaduna",
  pickupDate: "2026-12-02",
  service: "Haulage",
  vehicleId: "V",
  vehicleLabel: "V",
  driverId: "D",
  status: "Accepted",
  milestones: [],
  deliveries: [],
  exceptions: [],
});
const ev = (type, extra = {}) => ({ type, location: "Here", notes: "", evidence: "", ...extra });

test("milestones must be recorded in sequence", () => {
  expect(() => applyEvent(trip(), ev("Loaded", { loaded: 18 }), actor)).toThrow(
    "Record the next milestone in sequence.",
  );
  expect(applyEvent(trip(), ev("Scheduled"), actor).status).toBe("Scheduled");
});

test("exceptions keep the stage to resume from and milestones only append", () => {
  let t = applyEvent(trip(), ev("Scheduled"), actor);
  t = applyEvent(t, ev("Exception", { notes: "Breakdown" }), actor);
  expect(t.status).toBe("Exception");
  expect(t.resumeStatus).toBe("Scheduled");
  expect(() => applyEvent(t, ev("Mobilized"), actor)).toThrow();
  t = applyEvent(t, ev("Resume"), actor);
  expect(t.status).toBe("Scheduled");
  t = applyEvent(t, ev("Correction", { notes: "Fixed location" }), actor);
  expect(t.status).toBe("Scheduled");
  expect(t.milestones.map((m) => m.type)).toEqual([
    "Scheduled",
    "Exception",
    "Resume",
    "Correction",
  ]);
});

test("loading needs a quantity and delivery needs proof and a declaration", () => {
  let t = { ...trip(), status: "Arrived at Pickup" };
  expect(() => applyEvent(t, ev("Loaded"), actor)).toThrow("Enter a positive loaded quantity.");
  t = { ...applyEvent(t, ev("Loaded", { loaded: 17 }), actor), status: "Arrived at Destination" };
  const pod = {
    quantity: 17,
    receiver: "B",
    representative: "R",
    arrival: "2026-12-02T10:00",
    condition: "Good",
    weighbridge: "",
    filename: "pod.pdf",
    discrepancy: "",
    acknowledged: false,
  };
  expect(() => applyDelivery(t, pod, actor)).toThrow(
    "Declare the receiving party's acknowledgment.",
  );
  const done = applyDelivery(t, { ...pod, acknowledged: true }, actor);
  expect(done.status).toBe("Delivered");
  expect(() => applyEvent(done, ev("Closed"), actor)).toThrow(/compliance officer/);
});

test("movement statuses map onto the ten stages", () => {
  expect(stageForMovement("assigned", false)).toEqual({ stage: "Mobilized", inferred: true });
  expect(stageForMovement("delivered", true).stage).toBe("Closed");
});
