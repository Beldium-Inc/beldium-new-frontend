import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Company, VerificationRecord } from "@/lib/mock-data";

export const VERIFICATION_STAGES = [
  "Application submitted",
  "Evidence review",
  "Source verification",
  "Findings recorded",
  "Information requested / decision",
  "Monitoring & reverification",
] as const;

/** Derives the shared workflow stage from a company record. Uploads alone never advance past evidence review. */
export function verificationStage(company: Company): number {
  if (["Approved", "Conditionally Approved", "Rejected"].includes(company.status)) return 5;
  if (company.status === "Awaiting Information") return 4;
  const recorded = company.documents.filter((d) => d.verification).length;
  if (recorded > 0 && recorded >= company.documents.length / 2) return 3;
  if (recorded > 0) return 2;
  if (company.status === "Under Review") return 1;
  return 0;
}

export function VerificationWorkflow({ company }: { company: Company }) {
  const stage = verificationStage(company);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-xs font-semibold text-[var(--brand)]">Independent verification workflow</p>
        <span className="text-[11px] text-muted-foreground">Simulated Beldium verification · not an official regulatory approval</span>
      </div>
      <ol className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {VERIFICATION_STAGES.map((label, i) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px]",
              i < stage ? "border-[var(--success)] bg-[var(--success)]/25" : i === stage ? "border-[var(--link)] bg-[var(--brand-soft)]/50 font-semibold" : "border-border text-muted-foreground",
            )}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px]">
              {i < stage ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function VerificationRecordView({ record }: { record?: VerificationRecord | undefined }) {
  if (!record)
    return <p className="text-xs text-muted-foreground">No verification recorded. An upload or applicant declaration is not verification.</p>;
  const rows: [string, string][] = [
    ["Subject", record.subject],
    ["Requirement", record.requirement],
    ["Evidence reference", record.evidenceRef],
    ["Verification source", record.source],
    ["Method", record.method],
    ["Reviewing officer", record.officer],
    ["Reviewed", record.at],
    ["Findings", record.findings],
    ["Decision / scope", `${record.decision} · ${record.scope}`],
    ["Next review", record.nextReview || "—"],
  ];
  return (
    <dl className="space-y-1.5 text-xs">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-right font-medium text-[var(--brand)]">{v}</dd>
        </div>
      ))}
      <p className="pt-1 text-[11px] text-muted-foreground">Simulated record — no live registry check was performed.</p>
    </dl>
  );
}
