import * as React from "react";
import { cn } from "@/lib/utils";
import { DISCLAIMER, type DocStatus, type ShipmentStatus } from "@/verticals/export/mock-data";
import { ShieldAlert } from "lucide-react";

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("card-surface overflow-hidden", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
  icon?: React.ReactNode;
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  }[tone];
  return (
    <div className="card-surface px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className={cn("mt-2 font-display text-2xl font-semibold", toneClass)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground border-border",
  info: "bg-accent text-accent-foreground border-transparent",
  success: "bg-success-soft text-success border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
  danger: "bg-danger-soft text-destructive border-transparent",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const shipmentStatusMap: Record<ShipmentStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted", tone: "info" },
  in_review: { label: "In review", tone: "info" },
  info_requested: { label: "Information requested", tone: "warning" },
  cleared: { label: "Cleared", tone: "success" },
  conditionally_cleared: { label: "Conditionally cleared", tone: "warning" },
  declined: { label: "Declined", tone: "danger" },
};

export function ShipmentStatusPill({ status }: { status: ShipmentStatus }) {
  const s = shipmentStatusMap[status];
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

export const docStatusMap: Record<DocStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pending review", tone: "neutral" },
  verified: { label: "Verified", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  replacement_requested: { label: "Replacement requested", tone: "warning" },
  clarification_requested: { label: "Clarification requested", tone: "warning" },
};

export function DocStatusPill({ status }: { status: DocStatus }) {
  const s = docStatusMap[status];
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

export function RiskPill({ score, band }: { score: number; band: "low" | "medium" | "high" }) {
  const tone: Tone = band === "low" ? "success" : band === "medium" ? "warning" : "danger";
  return (
    <Pill tone={tone}>
      Risk {score} · {band}
    </Pill>
  );
}

export function FieldGrid({
  fields,
}: {
  fields: { label: string; value: string; flag?: "warn" | "fail" }[];
}) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.label} className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {f.label}
          </dt>
          <dd
            className={cn(
              "mt-1 text-sm font-medium break-words",
              f.flag === "fail" && "text-destructive",
              f.flag === "warn" && "text-warning",
            )}
          >
            {f.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function DisclaimerNote({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs leading-relaxed text-muted-foreground",
        className,
      )}
    >
      <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
      <span>{DISCLAIMER}</span>
    </p>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-5 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ScoreBar({ value }: { value: number }) {
  const tone = value >= 75 ? "bg-success" : value >= 55 ? "bg-warning" : "bg-destructive";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} />
    </div>
  );
}
