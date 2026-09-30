import { ArrowRight, Clock, GraduationCap, HandHeart, Handshake } from "lucide-react";
import type { Pathway } from "@/lib/careers/application-schemas";
import { PATHWAY_META } from "@/lib/careers/application-schemas";
import { cn } from "@/lib/utils";

const ICONS: Record<Pathway, typeof GraduationCap> = {
  internship: GraduationCap,
  volunteer: HandHeart,
  partnership: Handshake,
};

const HIGHLIGHTS: Record<Pathway, string[]> = {
  internship: ["Mentorship", "Hands-on projects", "Career runway"],
  volunteer: ["Flexible hours", "Purpose-driven", "Skill amplification"],
  partnership: ["Verified fleet partner", "RFQs & assignments", "Document-checked"],
};

// Expected commitment per pathway. Requirements are factual (CV + LinkedIn are
// mandatory on the internship/volunteer forms; partnership now requires the
// full company information + document set). Time estimates are placeholders
// pending confirmation.
const COMMITMENT: Record<Pathway, string> = {
  internship: "About 10–15 min · CV + LinkedIn required",
  volunteer: "About 8–10 min · CV + LinkedIn required",
  partnership: "About 20 min · company details + supporting documents required",
};

interface PathwayCardProps {
  pathway: Pathway;
  index: number;
  active?: boolean;
  id?: string | undefined;
  onSelect: (pathway: Pathway) => void;
}

export function PathwayCard({ pathway, index, active, id, onSelect }: PathwayCardProps) {
  const meta = PATHWAY_META[pathway];
  const Icon = ICONS[pathway];
  return (
    <button
      type="button"
      id={id}
      onClick={() => onSelect(pathway)}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border p-7 text-left transition-all duration-500 scroll-mt-28",
        "border-white/60 bg-white/70 backdrop-blur-md hover:-translate-y-1 hover:shadow-elevated",
        active
          ? "shadow-elevated ring-2 ring-brand-navy ring-offset-2 ring-offset-background"
          : "hover:border-brand-navy/30",
      )}
    >
      <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-brand-navy/10 blur-3xl transition duration-700 group-hover:bg-brand-navy/20" />

      <div className="relative flex items-start justify-between">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <span className="font-display text-xs font-semibold tracking-[0.28em] text-brand-navy-soft uppercase">
          0{index + 1}
        </span>
      </div>

      <h3 className="mt-6 font-display text-2xl font-bold text-brand-navy-deep">{meta.title}</h3>
      <p className="mt-1 text-sm font-medium text-brand-navy-soft">{meta.subtitle}</p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{meta.blurb}</p>

      <ul className="mt-5 flex flex-wrap gap-2">
        {HIGHLIGHTS[pathway].map((h) => (
          <li
            key={h}
            className="rounded-full border border-brand-navy/15 bg-brand-mist/60 px-3 py-1 text-[11px] font-medium text-brand-navy-deep"
          >
            {h}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy-deep">
          Begin application
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{COMMITMENT[pathway]}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-brand-navy-soft">
          <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
          Acknowledged within 24h
        </p>
      </div>
    </button>
  );
}
