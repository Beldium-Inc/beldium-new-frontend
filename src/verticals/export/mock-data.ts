// Vocabulary for the Beldium Export Compliance dashboard. The data itself
// comes straight from the API (see src/lib/api/export.ts and store.tsx);
// the register is close enough to the wire format that a separate `domain.ts`
// adapter wasn't needed, the same call `quality`'s store.tsx makes. Nothing
// here is seeded; these are type/label constants only.

import { EXPORT_DOMAIN_KEYS, EXPORT_DOMAIN_LABELS, type ExportDomainKey } from "@/lib/api/export";

export type Role = "operator" | "exporter" | "regulator";

export const SECTION_KEYS = EXPORT_DOMAIN_KEYS;
export type SectionKey = ExportDomainKey;
export const SECTION_LABELS = EXPORT_DOMAIN_LABELS;

export const DISCLAIMER =
  "Beldium issues an independent compliance verification record. It is not a government permit, licence, or customs clearance and does not replace any statutory approval.";
