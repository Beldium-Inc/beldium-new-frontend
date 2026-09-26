import { cn } from "@/lib/utils";

type Tone = "default" | "primary" | "success" | "warning" | "danger" | "info";

const toneClass: Record<Tone, string> = {
  default: "bg-secondary text-secondary-foreground border-border",
  primary: "bg-primary/15 text-primary border-primary/40",
  success: "bg-success/15 text-success border-success/40",
  warning: "bg-warning/15 text-warning border-warning/40",
  danger: "bg-destructive/15 text-destructive border-destructive/40",
  info: "bg-info/15 text-info border-info/40",
};

const rules: { match: RegExp; tone: Tone }[] = [
  { match: /(partially paid|not invoiced)/i, tone: "warning" },
  { match: /(exception|hold)/i, tone: "danger" },
  { match: /(completed|delivered|paid|cleared|verified|received|available|approved|accepted|resolved|closed|on schedule|valid|online|no findings|current|ok)/i, tone: "success" },
  { match: /(delay|expiring|variance|pending|under review|awaiting|conditional|due|stale|maintenance|investigation|part paid|warning|discrepanc)/i, tone: "warning" },
  { match: /(expired|blocked|restricted|incident|cancelled|declined|rejected|overdue|action required|offline|theft|loss|critical|outstanding|open)/i, tone: "danger" },
  { match: /(in transit|loading|dispatched|en route|new|live|scheduled|assigned|at pickup|at destination|unloading|loaded|generated|submitted|collected|at origin|at mine|at laboratory|on journey)/i, tone: "primary" },
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
  const resolved = tone ?? inferTone(value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        toneClass[resolved],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}
