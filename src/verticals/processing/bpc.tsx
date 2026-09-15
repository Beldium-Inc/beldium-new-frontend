import * as React from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(16,30,61,0.05),0_10px_30px_-18px_rgba(16,30,61,0.35)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-accent text-primary">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "primary";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  success: "bg-success/60 text-success-foreground border-success",
  warning: "bg-warning/25 text-warning-foreground border-warning/60",
  danger: "bg-destructive/20 text-destructive-foreground border-destructive/50",
  info: "bg-secondary text-secondary-foreground border-secondary",
  primary: "bg-primary text-primary-foreground border-primary",
};

export function Pill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: Tone;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  const accent: Record<Tone, string> = {
    neutral: "bg-accent text-primary",
    success: "bg-success/60 text-success-foreground",
    warning: "bg-warning/25 text-warning-foreground",
    danger: "bg-destructive/20 text-destructive-foreground",
    info: "bg-secondary text-secondary-foreground",
    primary: "bg-primary text-primary-foreground",
  };
  return (
    <Panel
      onClick={onClick}
      className={cn(
        "p-4 transition-shadow sm:p-5",
        onClick && "cursor-pointer hover:shadow-[0_14px_40px_-18px_rgba(16,30,61,0.45)]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase sm:text-xs">
          {label}
        </p>
        {/* Two tiles fit across a phone only if the badge stands down. */}
        {icon ? (
          <span
            className={cn(
              "hidden size-9 items-center justify-center rounded-xl sm:flex",
              accent[tone],
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground sm:mt-3 sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{hint}</p> : null}
    </Panel>
  );
}

export function RiskBadge({ score }: { score: number }) {
  const tone: Tone = score >= 55 ? "danger" : score >= 30 ? "warning" : "success";
  const label = score >= 55 ? "High" : score >= 30 ? "Medium" : "Low";
  return (
    <Pill tone={tone}>
      <span className="font-semibold">{score}</span> · {label} risk
    </Pill>
  );
}

export function ScoreBar({ value, tone }: { value: number; tone?: Tone }) {
  const color =
    tone === "danger"
      ? "bg-destructive"
      : tone === "warning"
        ? "bg-warning"
        : tone === "success"
          ? "bg-success"
          : "bg-primary";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full", color)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/**
 * A small modal for the desk's one-field actions: assigning an inspector,
 * confirming a date, recording an outcome. The pages that need it each had a
 * button with no handler; this is what they now open, rather than a
 * `window.prompt` in an app that looks like this one.
 */
export function ActionDialog({
  title,
  description,
  label,
  initial = "",
  type = "text",
  placeholder,
  confirmLabel = "Save",
  onConfirm,
  onClose,
}: {
  title: string;
  description?: string;
  label: string;
  initial?: string;
  type?: "text" | "date";
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => Promise<unknown>;
  onClose: () => void;
}) {
  const [value, setValue] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const confirm = () => {
    setBusy(true);
    setError(null);
    void onConfirm(value.trim())
      .then(onClose)
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setBusy(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-[0_30px_80px_-30px_rgba(16,30,61,0.7)]">
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        <label className="mt-4 block">
          <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
          <input
            autoFocus
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !busy) confirm();
            }}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
        </label>
        {error ? <p className="mt-2 text-[11px] text-destructive-foreground">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40"
          >
            {busy ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * What a screen shows while the register is still arriving, when the API
 * refused or failed, and when the query simply matched nothing. Every list
 * page reads live data now, so all three states are real.
 */
export function RegisterState({
  isLoading,
  error,
  empty,
}: {
  isLoading: boolean;
  error: { message: string } | null;
  empty: { title: string; body: string };
}) {
  if (isLoading) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-muted-foreground">Loading the register…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm font-medium text-destructive">The register could not be loaded</p>
        <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
      </div>
    );
  }
  return <EmptyState title={empty.title} body={empty.body} />;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "Approved":
    case "Closed":
    case "Completed":
    case "Resolved":
    case "verified":
    case "Pass":
      return "success";
    case "Conditional":
    case "Conditional Approval":
    case "Under Review":
    case "In Review":
    case "Warning":
    case "Awaiting Info":
    case "More Info Required":
    case "info_requested":
    case "Evidence Submitted":
    case "Acknowledged":
    case "Hold":
    case "Moderate":
      return "warning";
    case "Suspended":
    case "Rejected":
    case "Critical":
    case "Severe":
    case "Open":
    case "rejected":
    case "Fail":
      return "danger";
    case "Scheduled":
    case "Requested":
    case "Inspection":
    case "flagged":
      return "info";
    default:
      return "neutral";
  }
}
