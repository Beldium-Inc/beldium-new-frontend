import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  icon?: ReactNode;
}) {
  const tones = {
    default: "bg-muted text-foreground",
    success: "bg-success text-success-foreground",
    warning: "bg-warning/40 text-warning-foreground",
    danger: "bg-destructive/25 text-destructive-foreground",
    info: "bg-secondary text-secondary-foreground",
  } as const;
  return (
    <Card className="rounded-2xl border-border/70 shadow-card">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 font-heading text-3xl font-semibold text-primary">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? (
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
            {icon}
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-2xl border-border/70 shadow-card", className)}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="font-heading text-base font-semibold text-primary">{title}</CardTitle>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

const STATUS_TONES: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-secondary text-secondary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning/40 text-warning-foreground",
  danger: "bg-destructive/25 text-destructive-foreground",
  brand: "bg-primary text-primary-foreground",
};

export type Tone = keyof typeof STATUS_TONES;

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function toneForStatus(status: string): Tone {
  const s = status.toLowerCase();
  if (["approved", "authorised", "active", "valid", "closed", "completed", "available", "verified"].includes(s))
    return "success";
  if (["pending", "under review", "pending authorisation", "scheduled", "in progress", "under investigation", "info-requested", "conditional", "expiring", "quarantine", "allocated", "action required", "attention", "minor", "medium"].includes(s))
    return "warning";
  if (["rejected", "suspended", "declined", "overdue", "open", "critical", "major", "high", "missing"].includes(s))
    return "danger";
  return "info";
}

export function DemoDataBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-link/40 bg-secondary/60 px-4 py-3 text-sm text-primary",
        className,
      )}
    >
      <span className="font-heading font-semibold">Sample data</span>: all companies, CAC/TIN numbers,
      facilities and documents shown are fictional and for demonstration only.
    </div>
  );
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/60 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
