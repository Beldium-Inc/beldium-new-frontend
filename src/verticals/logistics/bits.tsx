import * as React from "react";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import type { CheckStatus, DocStatus, RiskBand } from "@/verticals/logistics/mock-data";
import { BeldiumLogo } from "@/components/beldium-logo";

export function BeldiumMark({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BeldiumLogo className="h-9 w-9" />
      <span className="leading-tight">
        <span
          className={cn(
            "block font-display text-[15px] font-semibold tracking-tight",
            dark ? "text-white" : "text-[var(--brand)]",
          )}
        >
          Beldium
        </span>
        <span className={cn("block text-[11px]", dark ? "text-white/60" : "text-muted-foreground")}>
          Logistics Compliance
        </span>
      </span>
    </span>
  );
}

const toneMap: Record<string, string> = {
  success: "bg-[var(--success)]/60 text-[var(--success-foreground)] border-[var(--success)]",
  warning: "bg-[var(--warning)]/25 text-[var(--warning-foreground)] border-[var(--warning)]/60",
  danger: "bg-[var(--danger)]/20 text-[var(--danger-foreground)] border-[var(--danger)]/50",
  info: "bg-[var(--brand-soft)] text-[var(--brand)] border-[#b9d3fb]",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function Pill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof toneMap | string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        toneMap[tone] ?? toneMap["neutral"],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Approved"
      ? "success"
      : status === "Rejected"
        ? "danger"
        : status === "Conditionally Approved"
          ? "info"
          : status === "Awaiting Information" || status === "Expiring Documents"
            ? "warning"
            : "neutral";
  return <Pill tone={tone}>{status}</Pill>;
}

export function RiskBadge({ risk, score }: { risk: RiskBand; score?: number }) {
  const tone = risk === "Low" ? "success" : risk === "Medium" ? "warning" : "danger";
  return (
    <Pill tone={tone}>
      {risk}
      {score !== undefined ? ` · ${score}` : ""}
    </Pill>
  );
}

export function DocStatusBadge({ status }: { status: DocStatus }) {
  const map: Record<DocStatus, [string, string]> = {
    verified: ["success", "Verified"],
    rejected: ["danger", "Rejected"],
    replacement: ["warning", "Replacement requested"],
    pending: ["neutral", "Pending review"],
  };
  const [tone, label] = map[status];
  return <Pill tone={tone}>{label}</Pill>;
}

export function CheckStatusBadge({ status }: { status: CheckStatus }) {
  const map: Record<CheckStatus, [string, string]> = {
    passed: ["success", "Passed"],
    attention: ["warning", "Needs attention"],
    pending: ["info", "Pending"],
    failed: ["danger", "Failed"],
  };
  const [tone, label] = map[status];
  return <Pill tone={tone}>{label}</Pill>;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  onClick,
  active,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  onClick?: () => void;
  active?: boolean;
}) {
  const accent = {
    neutral: "bg-muted text-[var(--brand)]",
    info: "bg-[var(--brand-soft)] text-[var(--brand)]",
    success: "bg-[var(--success)]/60 text-[var(--success-foreground)]",
    warning: "bg-[var(--warning)]/25 text-[var(--warning-foreground)]",
    danger: "bg-[var(--danger)]/20 text-[var(--danger-foreground)]",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-[0_1px_2px_rgba(16,30,61,0.04)] transition",
        onClick && "hover:border-[var(--link)]/40 hover:shadow-[0_6px_18px_rgba(16,30,61,0.08)]",
        active ? "border-[var(--link)] ring-1 ring-[var(--link)]/30" : "border-border",
      )}
    >
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", accent)}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-muted-foreground">{label}</span>
        <span className="mt-0.5 block font-display text-2xl leading-none font-semibold text-[var(--brand)]">
          {value}
        </span>
        {hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}
      </span>
    </button>
  );
}

export function ScoreBar({ label, value, suffix = "%" }: { label: string; value: number; suffix?: string }) {
  const color = value >= 90 ? "var(--success-foreground)" : value >= 75 ? "var(--link)" : value >= 50 ? "var(--warning)" : "var(--danger)";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-[var(--brand)]">{label}</span>
        <span className="text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--brand)]">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(16,30,61,0.04)]", className)}>
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
          <div>
            <h2 className="font-display text-sm font-semibold text-[var(--brand)]">{title}</h2>
            {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function KeyValue({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">{i.label}</dt>
          <dd className="mt-0.5 text-sm font-medium text-[var(--brand)]">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ReadOnlyNotice({ text }: { text: string }) {
  return (
    <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#b9d3fb] bg-[var(--brand-soft)]/60 px-4 py-3 text-sm text-[var(--brand)]">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
