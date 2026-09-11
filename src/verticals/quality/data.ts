import type { Role } from "./types";

export const roleMeta: Record<Role, { label: string; tagline: string; color: string }> = {
  operator: {
    label: "Compliance Operator",
    tagline: "Verifies Quality & Control Partners and owns the decision record",
    color: "navy",
  },
  partner: {
    label: "Quality Partner",
    tagline: "Accredited laboratory executing tests and issuing certificates",
    color: "blue",
  },
  miner: {
    label: "Miner / Producer",
    tagline: "Registers lots and samples, tracks custody to the lab",
    color: "amber",
  },
  buyer: {
    label: "Buyer",
    tagline: "Matches delivered material against purchase specifications",
    color: "mint",
  },
  regulator: {
    label: "Regulatory Oversight",
    tagline: "Read-only supervision of the traceability chain",
    color: "slate",
  },
};
