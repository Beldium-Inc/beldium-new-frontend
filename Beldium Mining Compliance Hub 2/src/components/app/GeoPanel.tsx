import { MapPin, Ruler, Satellite } from "lucide-react";
import type { MineSite } from "@/lib/prototype/types";
import { Field, Panel } from "./primitives";
import { Chip } from "./chips";

/** Schematic geolocation panel — draws the cadastral boundary locally, no external map service. */
export function GeoPanel({ site }: { site: MineSite }) {
  const boundary = "12,18 68,10 88,34 82,74 46,90 14,66";
  const encroach = site.id === "NL-024";

  return (
    <Panel
      title="Geolocation & boundary"
      description="Schematic cadastral view rendered locally from stored coordinates."
      actions={<Chip tone={encroach ? "warning" : "success"}>{encroach ? "Boundary anomaly" : "Within boundary"}</Chip>}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="relative overflow-hidden rounded-md border border-border bg-muted">
          <svg viewBox="0 0 100 100" className="h-72 w-full" role="img" aria-label="Schematic site boundary map">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M10 0 L0 0 0 10" fill="none" stroke="var(--color-border)" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
            <path d="M0,72 C22,64 34,80 52,74 C70,68 84,84 100,78" fill="none" stroke="var(--color-chart-5)" strokeWidth="1.4" opacity="0.8" />
            <polygon points={boundary} fill="var(--color-brand-soft)" fillOpacity="0.75" stroke="var(--color-brand)" strokeWidth="1" />
            {encroach && (
              <polygon points="82,74 96,66 98,84 84,88" fill="var(--color-danger)" fillOpacity="0.45" stroke="var(--color-danger)" strokeWidth="0.9" />
            )}
            <circle cx="50" cy="48" r="2.2" fill="var(--color-brand)" />
            <text x="53" y="47" fontSize="3.4" fill="var(--color-brand)">
              {site.code} centroid
            </text>
            {encroach && (
              <text x="70" y="94" fontSize="3.2" fill="var(--color-danger-foreground)">
                6.5 ha outside boundary
              </text>
            )}
            <text x="4" y="70" fontSize="3" fill="var(--color-muted-foreground)">
              Doka Stream
            </text>
          </svg>
          <div className="flex flex-wrap items-center gap-3 border-t border-border bg-surface px-4 py-2.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-brand-soft ring-1 ring-brand" /> Licensed cadastral unit
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-danger/50 ring-1 ring-danger" /> Observed activity outside boundary
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-chart-5" /> Watercourse
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Centroid coordinates">
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <MapPin className="size-3.5 text-muted-foreground" />
              {site.lat.toFixed(4)}° N, {site.lng.toFixed(4)}° E
            </span>
          </Field>
          <Field label="Licensed area">
            <span className="inline-flex items-center gap-1.5">
              <Ruler className="size-3.5 text-muted-foreground" />
              {site.areaHa} ha
            </span>
          </Field>
          <Field label="Local government area" value={`${site.lga}, ${site.state} State`} />
          <Field label="GPS verification">
            <Chip tone={site.verification.gps ? "success" : "warning"}>{site.verification.gps ? "Verified" : "Re-survey required"}</Chip>
          </Field>
          <Field label="Imagery source">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Satellite className="size-3.5" /> Drone overlay, 22 Jul 2026 (demo)
            </span>
          </Field>
        </div>
      </div>
    </Panel>
  );
}
