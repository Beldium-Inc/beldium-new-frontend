import { StatusChip, type ChipTone } from "@/components/status-chip";
import { cn } from "@/lib/utils";

// Logistics statuses are free text ("In Transit", "Partially Paid"…), so the
// chip tone is inferred from the wording. Rendering is Miner Hub's StatusChip.

type Tone = "default" | "primary" | "success" | "warning" | "danger" | "info";

const chipTone: Record<Tone, ChipTone> = {
  default: "neutral",
  primary: "info",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
};

const rules: { match: RegExp; tone: Tone }[] = [
  { match: /(partially paid|not invoiced)/i, tone: "warning" },
  { match: /(exception|hold)/i, tone: "danger" },
  {
    match:
      /(completed|delivered|paid|cleared|verified|received|available|approved|accepted|resolved|closed|on schedule|valid|online|no findings|current|ok)/i,
    tone: "success",
  },
  {
    match:
      /(delay|expiring|variance|pending|under review|awaiting|conditional|due|stale|maintenance|investigation|part paid|warning|discrepanc)/i,
    tone: "warning",
  },
  {
    match:
      /(expired|blocked|restricted|incident|cancelled|declined|rejected|overdue|action required|information required|offline|theft|loss|critical|outstanding|open)/i,
    tone: "danger",
  },
  {
    match:
      /(in transit|loading|dispatched|en route|new|live|scheduled|assigned|at pickup|at destination|unloading|loaded|generated|submitted|collected|at origin|at mine|at laboratory|on journey|responded)/i,
    tone: "primary",
  },
];

export function inferTone(value: string): Tone {
  for (const rule of rules) if (rule.match.test(value)) return rule.tone;
  return "default";
}

export function StatusBadge({
  value,
  tone,
  className,
}: {
  value: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <StatusChip
      tone={chipTone[tone ?? inferTone(value)]}
      className={cn("whitespace-nowrap", className)}
    >
      {value}
    </StatusChip>
  );
}
