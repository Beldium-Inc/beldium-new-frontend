import { cn } from "@/lib/utils";

/**
 * One rule for "how close to expiry is this?" across every sector, so a
 * licence, a vehicle's insurance and a certificate read the same way.
 *
 * The bands follow the reminder offsets in the week plan (90, 60, 30, 7, 0):
 * expired or due within 7 days is urgent, within 30 is a warning, within 90 is
 * a heads-up, anything later is fine.
 */
export type ExpiryBand = "expired" | "urgent" | "warning" | "notice" | "ok" | "none";

const DAY_MS = 86_400_000;

/** Whole days from today to `date` (negative once it has passed). */
export function daysUntil(
  date: string | null | undefined,
  today: Date = new Date(),
): number | null {
  if (!date) return null;
  const target = Date.parse(date.length === 10 ? `${date}T00:00:00` : date);
  if (Number.isNaN(target)) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((target - start) / DAY_MS);
}

export function expiryBand(days: number | null): ExpiryBand {
  if (days === null) return "none";
  if (days < 0) return "expired";
  if (days <= 7) return "urgent";
  if (days <= 30) return "warning";
  if (days <= 90) return "notice";
  return "ok";
}

const bandClass: Record<ExpiryBand, string> = {
  expired: "border-danger/60 bg-danger/20 text-danger-foreground",
  urgent: "border-danger/60 bg-danger/20 text-danger-foreground",
  warning: "border-warning/60 bg-warning/25 text-warning-foreground",
  notice: "border-border bg-muted text-foreground",
  ok: "border-success/60 bg-success/30 text-success-foreground",
  none: "border-border bg-muted text-muted-foreground",
};

export function expiryLabel(days: number | null, mode: "expiry" | "due" = "expiry"): string {
  if (mode === "due") {
    if (days === null) return "No due date";
    if (days < 0) return `Overdue by ${Math.abs(days)} day${days === -1 ? "" : "s"}`;
    if (days === 0) return "Due today";
    return `Due in ${days} day${days === 1 ? "" : "s"}`;
  }
  if (days === null) return "No expiry date";
  if (days < 0) return `Expired ${Math.abs(days)} day${days === -1 ? "" : "s"} ago`;
  if (days === 0) return "Expires today";
  return `Expires in ${days} day${days === 1 ? "" : "s"}`;
}

/**
 * Pass either the expiry date or, when the server already worked it out,
 * `days` (for example `days_to_expiry`). The server's figure wins.
 */
export function ExpiryBadge({
  date,
  days,
  className,
  compact = false,
  mode = "expiry",
}: {
  date?: string | null | undefined;
  days?: number | null | undefined;
  className?: string;
  /** Show "12d" / "Expired" instead of the full sentence. */
  compact?: boolean;
  /** "due" words it as a deadline ("Overdue by 3 days") rather than an expiry. */
  mode?: "expiry" | "due";
}) {
  const value = days ?? daysUntil(date);
  const band = expiryBand(value);
  const text = compact
    ? value === null
      ? "n/a"
      : value < 0
        ? mode === "due"
          ? "Overdue"
          : "Expired"
        : `${value}d`
    : expiryLabel(value, mode);
  return (
    <span
      title={date ? `${mode === "due" ? "Due" : "Expiry"} date: ${date}` : undefined}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap tabular-nums",
        bandClass[band],
        className,
      )}
    >
      {text}
    </span>
  );
}
