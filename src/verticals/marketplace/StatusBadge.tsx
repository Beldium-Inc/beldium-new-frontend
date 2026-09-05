import { cn } from "@/lib/utils";
import type { AppStatus } from "@/verticals/marketplace/demo-data";

const MAP: Record<AppStatus | string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-secondary text-secondary-foreground" },
  under_review: { label: "Under review", className: "bg-info/12 text-info border-info/30" },
  info_requested: { label: "Info requested", className: "bg-warning/15 text-warning-foreground border-warning/40" },
  flagged: { label: "Flagged", className: "bg-destructive/10 text-destructive border-destructive/30" },
  escalated: { label: "Escalated", className: "bg-primary text-primary-foreground border-primary" },
  verified: { label: "Verified", className: "bg-success/12 text-success border-success/30" },
  restricted: { label: "Restricted", className: "bg-warning/20 text-warning-foreground border-warning/50" },
  rejected: { label: "Rejected", className: "bg-destructive text-destructive-foreground border-destructive" },
  open: { label: "Open", className: "bg-destructive/10 text-destructive border-destructive/30" },
  remediation: { label: "In remediation", className: "bg-warning/15 text-warning-foreground border-warning/40" },
  closed: { label: "Closed", className: "bg-success/12 text-success border-success/30" },
  expired: { label: "Expired", className: "bg-destructive/10 text-destructive border-destructive/30" },
  clear: { label: "Clear", className: "bg-success/12 text-success border-success/30" },
  review: { label: "Review", className: "bg-warning/15 text-warning-foreground border-warning/40" },
  hit: { label: "Match", className: "bg-destructive text-destructive-foreground border-destructive" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const entry = MAP[status] ?? {
    label: status.replace(/_/g, " "),
    className: "bg-secondary text-secondary-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium capitalize whitespace-nowrap",
        entry.className,
        className,
      )}
    >
      {entry.label}
    </span>
  );
}
