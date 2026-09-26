import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { OpsMap } from "@/components/beldium/ops-map";
import { TrackingControls } from "@/components/beldium/ops-dialogs";
import { IdLink } from "@/components/beldium/ops-ui";
import { distanceKm, movementStatus, siteName, useOps } from "@/lib/ops-store";

export const Route = createFileRoute("/portal/routes-tracking")({
  head: () => ({
    meta: [
      { title: "Routes & Tracking - Beldium Logistics Hub" },
      { name: "description", content: "Live GPS tracking of Beldium movements with progress, ETA, stops, delays and route deviations." },
      { property: "og:title", content: "Routes & Tracking - Beldium Logistics Hub" },
      { property: "og:description", content: "Live corridor tracking for every vehicle in transit." },
    ],
  }),
  component: Page,
});

function Page() {
  const s = useOps();
  const transit = s.movements.filter((m) => m.stage === "In Transit");
  return (
    <>
      <PageHeader title="Routes & Tracking" />
      <div className="space-y-5">
        <Panel title="Live Map">
          <OpsMap />
        </Panel>
        <Panel title="In Transit" action={<span className="text-xs font-semibold text-muted-foreground">{transit.length} records</span>}>
          {transit.length === 0 ? <p className="text-sm text-muted-foreground">No vehicles in transit.</p> : null}
          <ul className="space-y-4">
            {transit.map((m) => (
              <li key={m.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <IdLink kind="movement" id={m.id} />
                    <p className="beldium-small">
                      {m.vehicleId} · {siteName(s, m.originId)} → {siteName(s, m.destinationId)} · {distanceKm(s, m)} km
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.stopped ? <StatusBadge value="Stopped" tone="warning" /> : null}
                    {m.deviated ? <StatusBadge value="Route deviation" tone="warning" /> : null}
                    <StatusBadge value={movementStatus(m)} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-colorLink transition-all" style={{ width: `${m.progress}%` }} />
                  </div>
                  <span className="text-xs font-semibold">
                    {m.progress}% · ETA {m.etaMin} min
                  </span>
                </div>
                {!m.exception ? (
                  <div className="mt-3">
                    <TrackingControls m={m} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
