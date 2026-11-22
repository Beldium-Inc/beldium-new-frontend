// Run with: bun test src/verticals/logistics
import { expect, test } from "bun:test";

import { encodeVerification, missingVerificationFields, parseVerification } from "./verification";

const record = {
  source: "CAC public search",
  method: "Registry or portal search",
  findings: "Name and RC number match.\nNo adverse records.",
  decision: "Verified",
  scope: "Full",
  nextReview: "2027-11-20",
};

test("a verification record survives the review_notes round trip", () => {
  const parsed = parseVerification(encodeVerification(record));
  expect(parsed).toEqual({ ...record, findings: "Name and RC number match. No adverse records." });
});

test("verifying needs source, method and findings", () => {
  expect(missingVerificationFields({ ...record, source: " ", findings: "" })).toEqual([
    "source",
    "findings",
  ]);
  expect(missingVerificationFields(record)).toEqual([]);
});

test("older free-text review notes are not mistaken for records", () => {
  expect(parseVerification("Evidence checked and verified.")).toBeNull();
  expect(parseVerification(undefined)).toBeNull();
  expect(parseVerification(encodeVerification({ ...record, nextReview: "" }))?.nextReview).toBe("");
});
