import { cn } from "@/lib/utils";

// Officer verification records for logistics evidence.
//
// Verifying a requirement must record where the officer checked it (source),
// how (method) and what they found (findings), plus the decision or scope and
// when it should be reviewed again. The documents API stores only a free-text
// `review_notes`, so the record is written there in a fixed, labelled format
// and read back from it. Notes written before this format are shown as-is.
// A structured verification-record resource is listed in
// docs/logistics-backend-gaps.md.

export interface VerificationRecord {
  source: string;
  method: string;
  findings: string;
  /** e.g. Verified, Verified with conditions. */
  decision: string;
  /** What the verification covers, e.g. "Full", "Plateau and Kaduna only". */
  scope: string;
  /** ISO date, or empty when none was set. */
  nextReview: string;
}

export const VERIFICATION_DECISIONS = ["Verified", "Verified with conditions"] as const;

export const VERIFICATION_METHODS = [
  "Registry or portal search",
  "Issuer confirmation",
  "Original document sighted",
  "Site inspection",
  "Cross-check with other evidence",
  "Other",
] as const;

const HEADER = "Verification record";
const FIELDS: [keyof VerificationRecord, string][] = [
  ["source", "Source"],
  ["method", "Method"],
  ["findings", "Findings"],
  ["decision", "Decision"],
  ["scope", "Scope"],
  ["nextReview", "Next review"],
];

export function missingVerificationFields(r: VerificationRecord): string[] {
  return FIELDS.slice(0, 3)
    .filter(([key]) => !r[key].trim())
    .map(([, label]) => label.toLowerCase());
}

/** The review_notes text sent with a verification. One field per line; newlines in values are flattened. */
export function encodeVerification(r: VerificationRecord): string {
  return [
    HEADER,
    ...FIELDS.map(([key, label]) => `${label}: ${r[key].replace(/\s*\n\s*/g, " ").trim() || "-"}`),
  ].join("\n");
}

/** Reads a record written by `encodeVerification`; null for any other note. */
export function parseVerification(notes: string | undefined): VerificationRecord | null {
  if (!notes) return null;
  const lines = notes.split("\n");
  if (lines[0]?.trim() !== HEADER) return null;
  const record: VerificationRecord = {
    source: "",
    method: "",
    findings: "",
    decision: "",
    scope: "",
    nextReview: "",
  };
  for (const line of lines.slice(1)) {
    const field = FIELDS.find(([, label]) => line.startsWith(`${label}: `));
    if (field) {
      const value = line.slice(field[1].length + 2).trim();
      record[field[0]] = value === "-" ? "" : value;
    }
  }
  return record;
}

export function VerificationRecordView({
  record,
  officer,
  at,
  className,
}: {
  record: VerificationRecord;
  officer?: string | undefined;
  at?: string | undefined;
  className?: string;
}) {
  const rows: [string, string][] = [
    ["Source", record.source],
    ["Method", record.method],
    ["Findings", record.findings],
    ["Decision", record.decision],
    ["Scope", record.scope],
    ["Next review", record.nextReview || "Not set"],
    ...(officer ? ([["Officer", officer]] as [string, string][]) : []),
    ...(at ? ([["Recorded", at]] as [string, string][]) : []),
  ];
  return (
    <dl className={cn("space-y-1.5 text-xs", className)}>
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[96px_1fr] gap-2">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="font-medium break-words text-[var(--brand)]">{v || "-"}</dd>
        </div>
      ))}
    </dl>
  );
}
