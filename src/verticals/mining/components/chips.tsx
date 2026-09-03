import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "brand";

const toneClass: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-brand-soft text-brand border-brand-soft",
  success: "bg-success/50 text-success-foreground border-success",
  warning: "bg-warning/30 text-warning-foreground border-warning/60",
  danger: "bg-danger/25 text-danger-foreground border-danger/60",
  brand: "bg-brand text-brand-foreground border-brand",
};

export function Chip({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string | undefined }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const map: Record<string, Tone> = {
  // review / generic
  Verified: "success",
  Approved: "success",
  Active: "success",
  Cleared: "success",
  Closed: "success",
  Operational: "success",
  Pass: "success",
  "Within Limit": "success",
  Certified: "success",
  Responded: "success",
  Completed: "success",
  Low: "success",
  Accepted: "success",

  Pending: "neutral",
  Queued: "neutral",
  Intake: "neutral",
  Scheduled: "info",
  "Under Review": "info",
  "In Progress": "info",
  "Care & Maintenance": "info",
  Minor: "info",
  Normal: "neutral",

  Expiring: "warning",
  Watch: "warning",
  Medium: "warning",
  "Info Requested": "warning",
  "Inspection Requested": "warning",
  "Awaiting Review": "warning",
  "Pass with Observations": "warning",
  "Due Inspection": "warning",
  Open: "warning",
  Major: "warning",
  High: "warning",
  Investigating: "warning",
  "Under Query": "warning",
  "More Info Requested": "warning",
  Requested: "warning",

  Rejected: "danger",
  Flagged: "danger",
  Expired: "danger",
  Suspended: "danger",
  Breach: "danger",
  Fail: "danger",
  Critical: "danger",
  Escalated: "danger",
  Overdue: "danger",
  Disputed: "danger",
  "Out of Service": "danger",
};

export function StatusChip({ value, className }: { value: string; className?: string | undefined }) {
  return (
    <Chip tone={map[value] ?? "neutral"} className={className}>
      {value}
    </Chip>
  );
}

export function RiskChip({ value }: { value: "Low" | "Medium" | "High" }) {
  return <Chip tone={value === "Low" ? "success" : value === "Medium" ? "warning" : "danger"}>{value} risk</Chip>;
}

export function ScorePill({ score }: { score: number }) {
  const tone: Tone = score >= 80 ? "success" : score >= 60 ? "warning" : "danger";
  return (
    <Chip tone={tone} className="font-semibold tabular-nums">
      {score}/100
    </Chip>
  );
}
