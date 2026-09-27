import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { movementStatus, positionOf, site, useOps, vehicleOf, type Movement } from "@/lib/ops-store";
import { StatusBadge } from "./status-badge";

const tone = (m: Movement) => {
  const st = movementStatus(m);
  if (st === "Exception" || st === "Delayed") return "bg-destructive";
  if (m.deviated) return "bg-warning";
  if (st === "In Transit") return "bg-colorLink";
  if (["Loading", "Loaded", "Collected", "At Origin", "At Mine"].includes(st)) return "bg-warning";
  if (["At Destination", "At Laboratory", "Unloading", "Delivered"].includes(st)) return "bg-success";
  return "bg-muted-foreground";
};

const siteTone: Record<string, string> = {
  Mine: "bg-primary",
  Laboratory: "bg-info",
  Warehouse: "bg-accent",
  Processor: "bg-secondary-foreground",
  Port: "bg-success",
};

/** Live operations map: sites and every non-completed movement plotted from shared state. */
export function OpsMap({ focusId, compact }: { focusId?: string; compact?: boolean }) {
  const s = useOps();
  const live = s.movements.filter((m) => m.stage !== "Completed" && m.stage !== "Awaiting Assignment" && (!focusId || m.id === focusId));
  return (
    <div className={cn("grid gap-4", !compact && "lg:grid-cols-[1.6fr_1fr]")}>
      <div className={cn("relative overflow-hidden rounded-xl border border-border bg-light-secondary", compact ? "h-[260px]" : "h-[320px] md:h-[380px]")}>
        <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M8 0H0V8" fill="none" stroke="currentColor" strokeWidth="0.2" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" className="text-primary/20" />
          {live.map((m) => {
            const a = site(s, m.originId);
            const b = site(s, m.destinationId);
            if (!a || !b) return null;
            const bend = m.deviated ? 6 : 3;
            const pts = Array.from({ length: 11 }, (_, i) => {
              const p = i / 10;
              return `${a.x + (b.x - a.x) * p + Math.sin(p * Math.PI) * bend},${a.y + (b.y - a.y) * p - Math.sin(p * Math.PI) * bend}`;
            }).join(" ");
            return <polyline key={m.id} points={pts} fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 1.5" className={m.deviated ? "text-warning" : "text-primary/50"} />;
          })}
        </svg>

        {s.sites.map((x) => (
          <span key={x.id} className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x.x}%`, top: `${x.y}%` }}>
            <span className={cn("block size-2 rotate-45", siteTone[x.kind])} />
            <span className="pointer-events-none absolute left-3 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded bg-card px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow group-hover:block">
              {x.name}
            </span>
          </span>
        ))}

        {live.map((m) => {
          const p = positionOf(s, m);
          const v = vehicleOf(s, m.vehicleId);
          return (
            <Link
              key={m.id}
              to="/portal/movements/$movementId"
              params={{ movementId: m.id }}
              className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <span className={cn("block size-3.5 rounded-full ring-4 ring-card", tone(m), m.stage === "In Transit" && !m.stopped && "animate-pulse")} />
              <span className="pointer-events-none absolute left-4 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground group-hover:block">
                {m.id} · {v?.id ?? "-"} · {movementStatus(m)}
              </span>
            </Link>
          );
        })}

        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-lg bg-card/90 px-2.5 py-2 text-[11px]">
          <Legend c="bg-colorLink" l="In transit" />
          <Legend c="bg-warning" l="At origin / deviation" />
          <Legend c="bg-success" l="At destination" />
          <Legend c="bg-destructive" l="Exception / delay" />
        </div>
      </div>

      {!compact ? (
        <ul className="max-h-[380px] space-y-2 overflow-y-auto">
          {live.length === 0 ? <li className="text-sm text-muted-foreground">No vehicles on the move.</li> : null}
          {live.map((m) => (
            <li key={m.id}>
              <Link to="/portal/movements/$movementId" params={{ movementId: m.id }} className="block rounded-lg border border-border px-3 py-2 hover:border-primary">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-primary">
                    {m.id} · {m.vehicleId ?? "-"}
                  </span>
                  <StatusBadge value={movementStatus(m)} />
                </div>
                <p className="beldium-small">
                  {site(s, m.originId)?.name} → {site(s, m.destinationId)?.name}
                  {m.stage === "In Transit" ? ` · ${m.progress}% · ETA ${m.etaMin} min` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Legend({ c, l }: { c: string; l: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", c)} />
      {l}
    </span>
  );
}
