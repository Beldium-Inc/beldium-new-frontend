import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Leaf, X } from "lucide-react";
import {
  Panel,
  PanelHeader,
  PageHeader,
  Pill,
  StatCard,
  statusTone,
  RegisterState,
} from "@/verticals/processing/bpc";
import { useAppState } from "@/verticals/processing/store";
import { type EnvAlert } from "@/verticals/processing/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/processing/environmental")({
  /** `?ref=` deep-links a single record, so the notification bell can open it. */
  validateSearch: (search: Record<string, unknown>): { ref?: string } => {
    const ref = search["ref"];
    return typeof ref === "string" && ref.trim() ? { ref: ref.trim() } : {};
  },
  head: () => ({
    meta: [
      { title: "Environmental alerts · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Environmental threshold exceedances across monitored processing facilities, with severity and status.",
      },
      { property: "og:title", content: "Environmental alerts · Beldium Processing Compliance" },
      {
        property: "og:description",
        content: "Environmental exceedance monitoring across processing facilities.",
      },
    ],
  }),
  component: EnvironmentalPage,
});

function EnvironmentalPage() {
  const { envAlerts, setAlertStatus, capabilities, isLoading, error } = useAppState();
  const [busy, setBusy] = React.useState(false);
  // Oversight acknowledges and escalates; only the desk resolves.
  const canAct = capabilities?.audience === "operator" || capabilities?.audience === "regulator";
  const [filter, setFilter] = React.useState<"All" | "Open" | "Acknowledged" | "Resolved">("All");
  const { ref } = Route.useSearch();
  const [detail, setDetail] = React.useState<EnvAlert | null>(null);
  // The alerts arrive after the first render, so this resolves once they land.
  React.useEffect(() => {
    if (!ref) return;
    const match = envAlerts.find((a) => a.id === ref);
    if (match) setDetail(match);
  }, [ref, envAlerts]);
  const rows = envAlerts.filter((a) => filter === "All" || a.status === filter);

  return (
    <>
      <PageHeader
        eyebrow="Regulatory oversight"
        title="Environmental alerts"
        description="Automated exceedance detection from facility monitoring submissions and third-party sampling. Oversight can acknowledge and escalate; remediation is directed through the compliance partner."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="Open exceedances"
          value={envAlerts.filter((a) => a.status === "Open").length}
          tone="danger"
          icon={<Leaf className="size-4" />}
        />
        <StatCard
          label="Critical severity"
          value={envAlerts.filter((a) => a.severity === "Critical").length}
          tone="warning"
        />
        <StatCard
          label="Resolved this quarter"
          value={envAlerts.filter((a) => a.status === "Resolved").length}
          tone="success"
        />
      </div>

      <Panel>
        <div className="flex flex-wrap gap-1.5 border-b border-border px-5 py-4">
          {(["All", "Open", "Acknowledged", "Resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-accent",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="divide-y divide-border">
          {rows.map((a) => (
            <button
              key={a.id}
              onClick={() => setDetail(a)}
              className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left hover:bg-accent/60"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{a.parameter}</p>
                  <Pill tone={statusTone(a.severity)}>{a.severity}</Pill>
                  <Pill tone={statusTone(a.status)}>{a.status}</Pill>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {a.id} · {a.facility} · {a.state} State · detected {a.detected}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-destructive-foreground">{a.reading}</p>
                <p className="text-[11px] text-muted-foreground">limit {a.threshold}</p>
              </div>
            </button>
          ))}
        </div>
      </Panel>

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-primary/45 backdrop-blur-sm"
            onClick={() => setDetail(null)}
          />
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-[0_30px_80px_-30px_rgba(16,30,61,0.7)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">{detail.parameter}</h3>
                <p className="text-xs text-muted-foreground">
                  {detail.id} · {detail.facility}
                </p>
              </div>
              <button onClick={() => setDetail(null)} className="rounded-lg p-1 hover:bg-accent">
                <X className="size-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Box k="Reading" v={detail.reading} />
              <Box k="Regulatory threshold" v={detail.threshold} />
              <Box k="Detected" v={detail.detected} />
              <Box k="State" v={`${detail.state} State`} />
            </div>
            <p className="mt-4 rounded-xl bg-secondary/50 px-3 py-2 text-[11px] text-secondary-foreground">
              Oversight actions available: acknowledge alert, request compliance partner follow-up,
              include in regional brief. Enforcement and facility-level directives are outside this
              role.
            </p>
            {canAct ? (
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  disabled={busy || detail.status !== "Open"}
                  onClick={() => {
                    setBusy(true);
                    void setAlertStatus(detail.id, "acknowledged")
                      .then(() => setDetail(null))
                      .catch((cause: Error) => window.alert(cause.message))
                      .finally(() => setBusy(false));
                  }}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-accent disabled:opacity-40"
                >
                  {detail.status === "Open" ? "Acknowledge" : "Acknowledged"}
                </button>
                <button
                  disabled={busy || detail.status === "Resolved"}
                  onClick={() => {
                    setBusy(true);
                    void setAlertStatus(
                      detail.id,
                      "resolved",
                      "Exceedance closed out by the oversight desk.",
                    )
                      .then(() => setDetail(null))
                      .catch((cause: Error) => window.alert(cause.message))
                      .finally(() => setBusy(false));
                  }}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40"
                >
                  {detail.status === "Resolved" ? "Resolved" : "Mark resolved"}
                </button>
              </div>
            ) : null}
            {rows.length === 0 ? (
              <RegisterState
                isLoading={isLoading}
                error={error}
                empty={{
                  title: "No environmental exceedances",
                  body: "Alerts appear here when a monitored parameter crosses its permitted threshold.",
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function Box({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2">
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">{k}</p>
      <p className="mt-0.5 text-xs font-medium">{v}</p>
    </div>
  );
}
