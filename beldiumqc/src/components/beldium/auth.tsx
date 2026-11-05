import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Fingerprint, ShieldCheck, Waypoints } from "lucide-react";
import { cn } from "@/lib/utils";
import { Surface } from "./ui";

export function AuthLayout({
  children,
  wide,
  aside,
}: {
  children: React.ReactNode;
  wide?: boolean;
  aside?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-navy text-navy-foreground">
      <div
        className={cn(
          "mx-auto grid gap-8 px-4 py-8 sm:px-6 lg:px-10 lg:py-12",
          wide ? "max-w-7xl lg:grid-cols-[300px_1fr]" : "max-w-6xl lg:grid-cols-[1fr_1.1fr]",
        )}
      >
        <div className="flex flex-col">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-pale font-display text-xl font-bold text-navy">
              B
            </span>
            <span>
              <span className="block font-display text-lg font-semibold">Beldium</span>
              <span className="block text-xs tracking-[0.2em] text-pale/70 uppercase">
                Quality &amp; Control
              </span>
            </span>
          </Link>
          {aside ?? <BrandAside />}
        </div>
        <Surface className="bg-card p-5 text-foreground sm:p-8">{children}</Surface>
      </div>
    </div>
  );
}

function BrandAside() {
  return (
    <div className="mt-10 hidden lg:block">
      <h1 className="font-display text-4xl leading-tight font-semibold">
        Every gram carries its own proof.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-pale/80">
        One account binds your organisation, laboratories, accreditation scope, methods, equipment
        and people into a verifiable record buyers can trust.
      </p>
      <ul className="mt-8 space-y-4 text-sm">
        {[
          [ShieldCheck, "Verified partners", "Organisation → Laboratory → Scope → Methods → Equipment → Personnel."],
          [Waypoints, "Unbroken custody", "Sealed sample events hashed from pit face to bench."],
          [Fingerprint, "Verifiable certificates", "Buyer-spec matched, revocable and publicly checkable."],
        ].map(([Icon, t, d]) => {
          const I = Icon as typeof ShieldCheck;
          return (
            <li key={t as string} className="flex gap-3">
              <I className="mt-0.5 size-5 shrink-0 text-pale" />
              <span>
                <span className="font-semibold">{t as string}.</span>{" "}
                <span className="text-pale/75">{d as string}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-navy">
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-navy outline-none transition placeholder:text-muted-foreground/70 focus:border-link focus:ring-2 focus:ring-link/20 aria-[invalid=true]:border-danger";

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-xs font-medium text-danger-foreground">{children}</p>;
}

export function Btn({
  variant = "primary",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" | "danger" }) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-navy text-navy-foreground hover:bg-navy/90",
        variant === "outline" && "border border-border bg-card text-navy hover:border-link",
        variant === "ghost" && "text-link hover:bg-accent",
        variant === "danger" && "bg-danger text-danger-foreground hover:bg-danger/90",
        className,
      )}
    />
  );
}

export function CodeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      placeholder="••••••"
      aria-label="Verification code"
      className={cn(inputClass, "text-center font-display text-2xl tracking-[0.6em]")}
    />
  );
}
