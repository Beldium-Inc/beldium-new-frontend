import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, ClipboardCheck, Factory, Leaf, Lock, Siren } from "lucide-react";
import {
  Panel,
  PanelHeader,
  Pill,
  RegisterState,
  ScoreBar,
  statusTone,
} from "@/verticals/processing/bpc";
import { useAppState } from "@/verticals/processing/store";
import { processingTypeLabel } from "@/verticals/processing/domain";

export const Route = createFileRoute("/processing/processors/$id")({
  head: () => ({
    meta: [
      { title: "Processor detail · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Processor and facility detail: compliance score, licences, inspection history, alerts and incidents.",
      },
      { property: "og:title", content: "Processor detail · Beldium Processing Compliance" },
      {
        property: "og:description",
        content: "Processor and facility oversight detail view.",
      },
    ],
  }),
  component: ProcessorDetail,
});

function ProcessorDetail() {
  const { id } = useParams({ from: "/processing/processors/$id" });
  const {
    inspections,
    nonConformities,
    processors,
    envAlerts,
    incidents,
    traceRuns,
    isLoading,
    error,
  } = useAppState();
  const p = processors.find((x) => x.id === id);

  if (!p) {
    return (
      <Panel className="p-10 text-center">
        <RegisterState
          isLoading={isLoading}
          error={error}
          empty={{
            title: "Processor not found",
            body: "This reference is not on the register, or you do not have access to it.",
          }}
        />
        <Link
          to="/processing/processors"
          className="mt-2 inline-block text-xs text-primary hover:underline"
        >
          Back to register
        </Link>
      </Panel>
    );
  }

  const insp = inspections.filter((i) => i.company === p.name);
  const ncs = nonConformities.filter((n) => n.company === p.name);
  const alerts = envAlerts.filter((a) => a.state === p.state);
  const facilityIncidents = incidents.filter((i) => i.state === p.state);
  const runs = traceRuns.filter((r) =>
    r.facility.toLowerCase().includes((p.lga.split(" ")[0] ?? p.lga).toLowerCase()),
  );

  return (
    <>
      <Link
        to="/processing/processors"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to register
      </Link>

      <Panel>
        <div className="flex flex-wrap items-start gap-4 border-b border-border bg-accent/40 px-5 py-5">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Factory className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{p.name}</h1>
              <Pill tone={statusTone(p.status)}>{p.status}</Pill>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {p.id} · {p.rcNumber} · TIN {p.tin} · registered {p.registered}
            </p>
            <div className="mt-3 grid gap-x-8 gap-y-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
              <M k="Processing type" v={processingTypeLabel(p.processingType)} />
              <M k="Facilities" v={`${p.facilities}`} />
              <M k="Location" v={`${p.lga} LGA, ${p.state} State`} />
              <M k="Last inspection" v={p.lastInspection} />
            </div>
          </div>
          <div className="w-full max-w-56 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Compliance score</p>
            <p className="mt-1 text-3xl font-semibold">{p.complianceScore}</p>
            <div className="mt-2">
              <ScoreBar
                value={p.complianceScore}
                tone={
                  p.complianceScore >= 80
                    ? "success"
                    : p.complianceScore >= 60
                      ? "warning"
                      : "danger"
                }
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {p.openNCs} open non-conformity(ies)
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 border-b border-border bg-secondary/40 px-5 py-3">
          <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-[11px] text-secondary-foreground">
            Oversight role: this record is read-only. Suspension, reinstatement, licence editing and
            user administration are not available here.
          </p>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Facilities monitored" value={p.facilities} />
          <Stat label="Inspections on record" value={insp.length} />
          <Stat label="Environmental alerts in State" value={alerts.length} />
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Inspection history"
            subtitle="Site visits recorded for this processor"
            icon={<ClipboardCheck className="size-4" />}
          />
          {insp.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-muted-foreground">
              No inspections recorded.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {insp.map((i) => (
                <div key={i.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium">
                      {i.id} · {i.type}
                    </p>
                    <Pill tone={statusTone(i.status)}>{i.status}</Pill>
                    <span className="ml-auto text-[11px] text-muted-foreground">{i.scheduled}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {i.facility} · {i.inspector}
                    {i.outcome ? ` · ${i.outcome}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Non-conformities"
            subtitle="Findings and corrective actions"
            icon={<AlertTriangle className="size-4" />}
          />
          {ncs.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-muted-foreground">
              No non-conformities on record.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {ncs.map((n) => (
                <div key={n.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium">{n.id}</p>
                    <Pill tone={statusTone(n.severity)}>{n.severity}</Pill>
                    <Pill tone={statusTone(n.status)}>{n.status}</Pill>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{n.title}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Environmental monitoring"
            subtitle={`${p.state} State readings`}
            icon={<Leaf className="size-4" />}
          />
          <div className="divide-y divide-border">
            {alerts.map((a) => (
              <div key={a.id} className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-medium">{a.parameter}</p>
                  <Pill tone={statusTone(a.severity)}>{a.severity}</Pill>
                  <span className="ml-auto text-[11px] text-muted-foreground">{a.detected}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {a.facility} · {a.reading} against threshold {a.threshold}
                </p>
              </div>
            ))}
            {alerts.length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-muted-foreground">
                No exceedances recorded.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Incidents"
            subtitle="Reported events"
            icon={<Siren className="size-4" />}
          />
          <div className="divide-y divide-border">
            {facilityIncidents.map((i) => (
              <div key={i.id} className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-medium">{i.type}</p>
                  <Pill tone={statusTone(i.severity)}>{i.severity}</Pill>
                  <Pill tone={statusTone(i.status)}>{i.status}</Pill>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{i.summary}</p>
              </div>
            ))}
            {facilityIncidents.length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-muted-foreground">
                No incidents reported.
              </p>
            ) : null}
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Operational context: Beldium Batch records"
          subtitle="Production runs referenced during compliance monitoring, not a compliance control in themselves"
        />
        {runs.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-muted-foreground">
            No production runs published for this processor in the current window.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {runs.map((r) => (
              <div key={r.runId} className="flex flex-wrap items-center gap-3 px-5 py-3 text-xs">
                <span className="font-medium">{r.runId}</span>
                <span className="text-muted-foreground">{r.inputBatch}</span>
                <span className="text-muted-foreground">→ {r.outputBatch}</span>
                <span className="ml-auto text-muted-foreground">Yield {r.yield}</span>
                <Pill tone={statusTone(r.qc.verdict)}>{r.qc.verdict}</Pill>
              </div>
            ))}
          </div>
        )}
        <div className="border-t border-border px-5 py-3">
          <Link
            to="/processing/traceability"
            className="text-xs font-medium text-primary hover:underline"
          >
            Open traceability view
          </Link>
        </div>
      </Panel>
    </>
  );
}

function M({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">{k}</p>
      <p className="font-medium">{v}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-muted/60 px-4 py-3">
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
