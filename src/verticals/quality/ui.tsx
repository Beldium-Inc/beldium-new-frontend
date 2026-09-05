import * as React from "react";
import { cn } from "@/lib/utils";

export function Surface({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-[24px] border border-border bg-card shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string | undefined;
  action?: React.ReactNode | undefined;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-6 py-4">
      <div>
        <h3 className="text-sm font-semibold tracking-wide text-navy uppercase">{title}</h3>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "navy";

const toneClass: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-pale text-navy border-pale",
  success: "bg-success text-success-foreground border-transparent",
  warning: "bg-warning/25 text-warning-foreground border-warning/40",
  danger: "bg-danger/20 text-danger-foreground border-danger/40",
  navy: "bg-navy text-navy-foreground border-navy",
};

export function Pill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusTone: Record<string, Tone> = {
  submitted: "info",
  in_review: "warning",
  info_requested: "warning",
  approved: "success",
  rejected: "danger",
  verified: "success",
  pending: "info",
  flagged: "danger",
  expired: "danger",
  registered: "info",
  in_transit: "info",
  received: "info",
  testing: "warning",
  reviewed: "info",
  certified: "success",
  pass: "success",
  fail: "danger",
  conditional: "warning",
  active: "success",
  revoked: "danger",
  draft: "neutral",
  open: "danger",
  capa_submitted: "warning",
  closed: "success",
  complete: "success",
  in_progress: "warning",
  minor: "info",
  major: "warning",
  critical: "danger",
  low: "info",
  medium: "warning",
  high: "danger",
};

export function StatusPill({
  value,
  className,
}: {
  value: string;
  className?: string | undefined;
}) {
  return (
    <Pill tone={statusTone[value] ?? "neutral"} className={className}>
      {value.replace(/_/g, " ")}
    </Pill>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "navy",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string | undefined;
  tone?: "navy" | "pale" | undefined;
}) {
  return (
    <Surface
      className={cn(
        "p-5",
        tone === "navy" ? "bg-card" : "border-pale bg-pale/50",
      )}
    >
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-navy">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </Surface>
  );
}

export function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-navy">{value}</dd>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  actions?: React.ReactNode | undefined;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-[0.18em] text-link uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 font-display text-2xl font-semibold text-navy sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string | undefined }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm font-medium text-navy">{title}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
