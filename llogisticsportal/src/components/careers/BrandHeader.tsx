import beldiumLogo from "@/assets/beldium-logo.png.asset.json";
import { CONTACT_EMAIL } from "@/lib/careers/site-config";

interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 70, className }: BrandMarkProps) {
  return (
    <img
      src={beldiumLogo.url}
      alt="Beldium Inc"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

export function BrandHeader({ onHome }: { onHome?: () => void }) {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
      <button
        type="button"
        onClick={onHome}
        className="flex items-center gap-3 rounded-full transition hover:opacity-90"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl p-1.5 shadow-glow">
          <BrandMark size={42} />
        </span>
        <span className="flex min-w-0 flex-col text-left leading-tight">
          <span className="font-display text-base font-bold text-brand-navy-deep">Beldium Inc</span>
          <span className="truncate text-[11px] font-medium tracking-[0.18em] text-brand-navy-soft uppercase">
            Logistics Talent Portal
          </span>
        </span>
      </button>
      <div className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
        <a href={`mailto:${CONTACT_EMAIL}`} className="transition hover:text-brand-navy-deep">
          {CONTACT_EMAIL}
        </a>
      </div>
    </header>
  );
}
