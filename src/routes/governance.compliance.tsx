import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, OctagonAlert } from "lucide-react";

import { useGovernanceCompliance } from "@/lib/api";
import { DataTable, LoadError, Loading, PageHeader, Panel } from "@/verticals/governance/ui";

export const Route = createFileRoute("/governance/compliance")({ component: Compliance });

function Measure({ value }: { value: number | null }) {
  return value === null ? (
    <span className="text-xs text-muted-foreground">Not tracked</span>
  ) : (
    <>{value}</>
  );
}

function Compliance() {
  const { data, isPending, error } = useGovernanceCompliance();
  return (
    <>
      <PageHeader
        title="Cross Sector Compliance Intelligence"
        desc="Read only, drawn live from each sector's register. Governance users cannot change sector verification decisions."
      />
      {isPending ? (
        <Loading />
      ) : error ? (
        <LoadError error={error} />
      ) : (
        <>
          {data.alerts.length > 0 && (
            <div className="mb-6 grid gap-3 md:grid-cols-2">
              {data.alerts.map((a, i) => (
                <div
                  key={`${a.sector}-${i}`}
                  className={`flex gap-3 rounded-xl border p-4 text-sm ${a.level === "critical" ? "border-destructive/40 bg-destructive/5" : "border-warning/40 bg-warning/10"}`}
                >
                  {a.level === "critical" ? (
                    <OctagonAlert className="h-5 w-5 shrink-0 text-destructive" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
                  )}
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-muted-foreground">{a.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Panel title="Sector comparison">
            <DataTable
              cols={[
                "Sector",
                "Verified",
                "Registered",
                "Open findings",
                `Expiring in ${data.window_days} days`,
                "Open requests",
              ]}
              rows={data.sectors.map((c) => [
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="max-w-56 text-xs text-muted-foreground">
                    {c.available ? c.source : "Register unavailable"}
                  </div>
                </div>,
                c.verified_rate === null ? (
                  <span className="text-xs text-muted-foreground">No entities yet</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-28 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${c.verified_rate}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs">
                      {c.verified_rate}% ({c.verified})
                    </span>
                  </div>
                ),
                <Measure value={c.registered} />,
                <Measure value={c.open_findings} />,
                <Measure value={c.expiring_30d} />,
                <Measure value={c.open_requests} />,
              ])}
            />
            <p className="mt-4 text-xs text-muted-foreground">
              Open findings are non-conformities, findings, incidents or disputes each sector has
              not yet closed. “Not tracked” means the sector does not record that measure, not that
              it is zero.
            </p>
          </Panel>
        </>
      )}
    </>
  );
}
