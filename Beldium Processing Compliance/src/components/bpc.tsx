import * as React from "react";
import { cn } from "@/lib/utils";

export function Panel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(16,30,61,0.05),0_10px_30px_-18px_rgba(16,30,61,0.35)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-accent text-primary">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "primary";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  success: "bg-success/60 text-success-foreground border-success",
  warning: "bg-warning/25 text-warning-foreground border-warning/60",
  danger: "bg-destructive/20 text-destructive-foreground border-destructive/50",
  info: "bg-secondary text-secondary-foreground border-secondary",
  primary: "bg-primary text-primary-foreground border-primary",
};

export function Pill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: Tone;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  const accent: Record<Tone, string> = {
    neutral: "bg-accent text-primary",
    success: "bg-success/60 text-success-foreground",
    warning: "bg-warning/25 text-warning-foreground",
    danger: "bg-destructive/20 text-destructive-foreground",
    info: "bg-secondary text-secondary-foreground",
    primary: "bg-primary text-primary-foreground",
  };
  return (
    <Panel
      onClick={onClick}
      className={cn(
        "p-5 transition-shadow",
        onClick && "cursor-pointer hover:shadow-[0_14px_40px_-18px_rgba(16,30,61,0.45)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        {icon ? (
          <span className={cn("flex size-9 items-center justify-center rounded-xl", accent[tone])}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Panel>
  );
}

export function RiskBadge({ score }: { score: number }) {
  const tone: Tone = score >= 55 ? "danger" : score >= 30 ? "warning" : "success";
  const label = score >= 55 ? "High" : score >= 30 ? "Medium" : "Low";
  return (
    <Pill tone={tone}>
      <span className="font-semibold">{score}</span> · {label} risk
    </Pill>
  );
}

export function ScoreBar({ value, tone }: { value: number; tone?: Tone }) {
  const color =
    tone === "danger"
      ? "bg-destructive"
      : tone === "warning"
        ? "bg-warning"
        : tone === "success"
          ? "bg-success"
          : "bg-primary";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "Approved":
    case "Closed":
    case "Completed":
    case "Resolved":
    case "verified":
    case "Pass":
      return "success";
    case "Conditional":
    case "Conditional Approval":
    case "Under Review":
    case "In Review":
    case "Warning":
    case "Awaiting Info":
    case "More Info Required":
    case "info_requested":
    case "Evidence Submitted":
    case "Acknowledged":
    case "Hold":
    case "Moderate":
      return "warning";
    case "Suspended":
    case "Rejected":
    case "Critical":
    case "Severe":
    case "Open":
    case "rejected":
    case "Fail":
      return "danger";
    case "Scheduled":
    case "Requested":
    case "Inspection":
    case "flagged":
      return "info";
    default:
      return "neutral";
  }
}
