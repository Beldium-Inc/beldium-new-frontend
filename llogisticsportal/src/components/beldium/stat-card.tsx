import { cn } from "@/lib/utils";

type Tone = "default" | "primary" | "accent" | "success" | "warning" | "danger";

const accentBar: Record<Tone, string> = {
  default: "bg-border",
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};

const valueColor: Record<Tone, string> = {
  default: "text-foreground",
  primary: "text-primary",
  accent: "text-colorLink",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
};

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="beldium-panel relative overflow-hidden p-4 transition-colors hover:border-primary/50">
      <span className={cn("absolute inset-y-0 left-0 w-0.5", accentBar[tone])} />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-2 text-2xl font-bold leading-none", valueColor[tone])}>{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("beldium-panel", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="beldium-heading text-base text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
