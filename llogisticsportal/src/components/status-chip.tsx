import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-primary/10 text-primary border-primary/25",
  success: "bg-success/12 text-success border-success/30",
  warning: "bg-warning/18 text-warning-foreground border-warning/40",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
  accent: "bg-accent/15 text-accent border-accent/30",
} as const;

export type ChipTone = keyof typeof tones;

export function StatusChip({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function complianceTone(status: string): ChipTone {
  switch (status) {
    case "compliant":
    case "closed":
    case "approved":
    case "verified":
      return "success";
    case "due_soon":
    case "in_progress":
    case "in_review":
    case "under_review":
    case "pending":
    case "submitted":
      return "warning";
    case "overdue":
    case "open":
    case "declined":
      return "danger";
    default:
      return "neutral";
  }
}

export function prettify(value: string) {
  return value.replace(/_/g, " ");
}
