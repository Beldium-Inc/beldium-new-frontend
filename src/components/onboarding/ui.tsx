import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BeldiumLogo } from "@/components/beldium-logo";
import type { VerificationState } from "@/lib/onboarding/types";

export function ProgressHeader({
  step,
  total,
  onBack,
}: {
  step: number;
  total: number;
  onBack?: () => void;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
        ) : (
          <span />
        )}
        <span className="text-sm font-medium text-muted-foreground">
          Step {step} of {total}
        </span>
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  );
}


export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  aside,
  width = "md",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  aside?: ReactNode;
  width?: "sm" | "md" | "lg";
}) {
  const max = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-5xl" }[width];
  return (
    <div className="min-h-screen bg-muted/40 px-4 py-8 sm:px-6 sm:py-12">
      <div className={cn("mx-auto w-full", max)}>
        <Link to="/" className="mb-8 flex items-center gap-3">
          <BeldiumLogo className="size-10" />
          <span>
            <span className="block font-display text-sm font-semibold">Beldium</span>
            <span className="block text-xs text-muted-foreground">Compliance Platform</span>
          </span>
        </Link>

        <div className="rounded-[24px] border border-border bg-surface p-6 shadow-panel sm:p-9">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
          )}
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
          <div className="mt-7">{children}</div>
        </div>

        {aside && <div className="mt-6">{aside}</div>}

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          Accounts, the organisation register and the organisation compliance application are live.
          The independent-professional and regulator applications, and phone verification, are still
          simulated in your browser.
        </p>
      </div>
    </div>
  );
}

export function StepBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="mb-8 flex flex-wrap gap-2">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={s}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
              active
                ? "border-brand bg-brand text-brand-foreground"
                : done
                  ? "border-success/50 bg-success/25 text-foreground"
                  : "border-border bg-muted/60 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full text-[10px] font-semibold",
                active ? "bg-brand-foreground/20" : done ? "bg-success/60" : "bg-background",
              )}
            >
              {done ? "✓" : i + 1}
            </span>
            {s}
          </li>
        );
      })}
    </ol>
  );
}

export function OptionCard({
  active,
  title,
  description,
  meta,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  meta?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-start gap-4 rounded-[18px] border-2 bg-surface p-5 text-left transition-colors sm:p-6",
        active ? "border-brand" : "border-border hover:border-brand/40",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-semibold text-brand">{title}</span>
        <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">{description}</span>
        {meta && <span className="mt-2 block">{meta}</span>}
      </span>
      <span
        className={cn(
          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
          active ? "border-brand bg-brand text-brand-foreground" : "border-border",
        )}
      >
        {active && <Check className="size-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}

const stateStyles: Record<VerificationState, string> = {
  Draft: "border-border bg-muted text-muted-foreground",
  "Under Review": "border-brand/30 bg-brand-soft text-brand",
  "Information Required": "border-warning/40 bg-warning/20 text-foreground",
  "Conditionally Verified": "border-warning/40 bg-warning/15 text-foreground",
  Verified: "border-success/50 bg-success/30 text-foreground",
  Rejected: "border-danger/40 bg-danger/20 text-foreground",
};

export function StateChip({ state }: { state: VerificationState }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", stateStyles[state])}>
      <span className="size-1.5 rounded-full bg-current" />
      {state}
    </span>
  );
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || <span className="text-muted-foreground">-</span>}</span>
    </div>
  );
}
