import { Link } from "@tanstack/react-router";

import logo from "@/assets/beldium-logo.png.asset.json";
import bg from "@/assets/auth-bg.jpg.asset.json";
import { cn } from "@/lib/utils";

export function BeldiumLogo({ className }: { className?: string }) {
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-lg bg-card", className)}>
      <img src={logo.url} alt="Beldium" className="size-full scale-[1.6] object-contain" />
    </span>
  );
}

export function AuthLayout({
  children,
  wide,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-screen bg-primary">
      <img src={bg.url} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-primary/70" />
      <div className="relative flex min-h-screen flex-col items-center px-4 py-8">
        <Link to="/sign-in" className="mb-6 flex items-center gap-3">
          <BeldiumLogo className="size-11" />
          <span className="text-primary-foreground">
            <span className="block text-lg font-semibold leading-none">Beldium</span>
            <span className="mt-1 block text-xs text-primary-foreground/75">Logistics Operator</span>
          </span>
        </Link>
        <div className={cn("beldium-panel w-full p-5 md:p-8", wide ? "max-w-3xl" : "max-w-md")}>{children}</div>
        <p className="mt-6 text-xs text-primary-foreground/70">© Beldium · Mineral movement you can trust</p>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-base outline-none focus:border-primary md:text-sm";

export function ProgressSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-primary">{steps[current]}</span>
        <span className="text-muted-foreground">
          Step {current + 1} of {steps.length}
        </span>
      </div>
      <div className="flex gap-1">
        {steps.map((s, i) => (
          <span
            key={s}
            title={s}
            className={cn("h-1.5 flex-1 rounded-full", i <= current ? "bg-primary" : "bg-secondary")}
          />
        ))}
      </div>
    </div>
  );
}
