import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { ApiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Building blocks shared by every governance page. Ported from the governance
// prototype so the screens keep its look, now reading live records.

export function PageHeader({
  title,
  desc,
  actions,
}: {
  title: string;
  desc?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("min-w-0 rounded-xl border bg-card p-5 shadow-card", className)}>
      {title && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const tone = {
  good: "bg-success/15 text-success border-success/30",
  warn: "bg-warning/20 text-foreground border-warning/40",
  bad: "bg-destructive/12 text-destructive border-destructive/30",
  info: "bg-accent text-accent-foreground border-primary/20",
  muted: "bg-muted text-muted-foreground border-border",
} as const;

// Keyed by the API's machine values; the label shown is the server's own.
const toneFor: Record<string, keyof typeof tone> = {
  approved: "good",
  published: "good",
  verified: "good",
  active: "good",
  complete: "good",
  effective: "good",
  on_track: "good",
  accepted: "good",
  closed: "muted",
  archived: "muted",
  draft: "muted",
  not_started: "muted",
  internal: "muted",
  none: "muted",
  expired: "muted",
  submitted: "info",
  under_review: "info",
  recommended: "info",
  monitoring: "info",
  pending: "warn",
  revision_requested: "warn",
  pending_verification: "warn",
  partial: "warn",
  open: "warn",
  delayed: "warn",
  restricted: "warn",
  escalated: "bad",
  rejected: "bad",
  weak: "bad",
  suspended: "bad",
  declined: "bad",
  revoked: "bad",
  confidential: "bad",
};

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium whitespace-nowrap", tone[toneFor[value] ?? "muted"])}
    >
      {label ?? humanise(value)}
    </Badge>
  );
}

export function humanise(value: string) {
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function Stat({
  label,
  value,
  hint,
  to,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  to:
    | "/governance/policies"
    | "/governance/risks"
    | "/governance/compliance"
    | "/governance/roadmap"
    | "/governance/regulatory";
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl border bg-card p-4 shadow-card transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
      {hint && (
        <div className="mt-1 text-xs text-muted-foreground group-hover:text-link">{hint} →</div>
      )}
    </Link>
  );
}

export function DataTable({
  cols,
  rows,
  empty,
}: {
  cols: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">{empty ?? "No records yet."}</p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
            {cols.map((c, i) => (
              <th key={`${c}-${i}`} className="px-3 py-2 font-medium whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2.5 align-middle">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const riskTone = (score: number) =>
  score >= 15
    ? "bg-destructive text-destructive-foreground"
    : score >= 9
      ? "bg-warning text-foreground"
      : score >= 5
        ? "bg-chart-2 text-primary-foreground"
        : "bg-success text-primary-foreground";

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{label}</p>;
}

export function LoadError({ error }: { error: unknown }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
    >
      {errorMessage(error)}
    </div>
  );
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const fields = error.fieldErrors();
    const first = Object.values(fields)[0];
    return first ? `${error.message} ${first}` : error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: string | undefined;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
