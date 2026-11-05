import { describe, expect, it } from "bun:test";
import { can, canReview, canAccessPath, makeVerification } from "./compliance";

const user = (id, role, memberships) => ({ id, role, org: "Lab A", name: "Test User", title: "Test", initials: "TU", blurb: "", ...(memberships ? { memberships } : {}) });
describe("Universal compliance boundaries", () => {
  it("public compliance role titles cannot grant reviewer permissions", () => expect(can(user("public", "operator"), "review")).toBe(false));
  it("public regulatory role cannot grant oversight access", () => expect(canAccessPath(user("public", "regulator"), "/applications")).toBe(false));
  it("compliance reviewer cannot execute ordinary operations", () => expect(can(user("u-op", "operator"), "operate")).toBe(false));
  it("regulatory oversight cannot issue verification decisions", () => expect(can(user("u-re", "regulator"), "review")).toBe(false));
  it("operators cannot access independent application review", () => expect(canAccessPath(user("provider", "partner"), "/compliance-review")).toBe(false));
  it("operator membership cannot operate another organisation", () => expect(can(user("provider", "partner"), "operate", "Lab B")).toBe(false));
  it("facility permissions are scoped", () => expect(can(user("provider", "partner", [{ id: "m", organization: "Lab A", sector: "Quality & Control", role: "partner", environment: "operations", permissions: ["operate"], facilities: ["facility-a"] }]), "operate", "Lab A", "facility-b")).toBe(false));
  it("sector permissions are scoped", () => expect(can(user("u-op", "operator"), "review", undefined, undefined, "Logistics")).toBe(false));
  it("reviewers cannot approve their own organisation", () => expect(canReview(user("u-op", "operator"), "Lab A")).toBe(false));
  it("verification records require provenance and label simulation", () => {
    const input = { subject: "Lab A", requirement: "Registration", evidence: "DOC-1", source: "Demo issuer", method: "Manual evidence review", findings: "Reference aligns", decision: "accepted", scope: "Facility A", nextReview: "2027-01-01" };
    expect(() => makeVerification({ ...input, source: "" }, "Reviewer")).toThrow();
    const record = makeVerification(input, "Reviewer");
    expect(record.simulated).toBe(true);
    expect(record.officer).toBe("Reviewer");
    expect(record.audit).toHaveLength(1);
  });
});