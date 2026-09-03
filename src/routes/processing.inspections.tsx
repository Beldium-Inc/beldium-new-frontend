import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, ClipboardCheck, MapPin, UserCheck } from "lucide-react";
import { Panel, PanelHeader, PageHeader, Pill, statusTone } from "@/verticals/processing/bpc";
import { useAppState } from "@/verticals/processing/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/processing/inspections")({
  head: () => ({
    meta: [
      { title: "Inspections · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Inspection queue covering pre-approval, routine, follow-up and incident-triggered site visits.",
      },
      { property: "og:title", content: "Inspections · Beldium Processing Compliance" },
      {
        property: "og:description",
        content: "Inspection queue and site-visit outcomes across registered facilities.",
      },
    ],
  }),
  component: InspectionsPage,
});

const CHECKLIST = [
  "Gate control, visitor register and site induction",
  "Weighbridge calibration seal and ticket sequence",
  "Reagent store bunding and secondary containment",
  "Effluent sump, sampling point and discharge route",
  "PPE issuance and worker interview sample",
  "Beldium Batch ID reconciliation for last 3 production runs",
  "Waste manifest cross-check against handler receipts",
];

function InspectionsPage() {
  const { inspections, user } = useAppState();
  const readOnly = user?.role !== "operator";
  const [selected, setSelected] = React.useState(inspections[0]?.id ?? "");
  const active = inspections.find((i) => i.id === selected) ?? inspections[0];

  return (
    <>
      <PageHeader
        eyebrow={readOnly ? "Regulatory oversight" : "Compliance operations"}
        title={readOnly ? "National inspection queue" : "Inspection queue"}
        description={
          readOnly
            ? "Visibility of scheduled, requested and completed inspections. Scheduling and assignment are performed by the compliance partner."
            : "Site visits flagged from application review, plus routine and follow-up inspections."
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Panel>
          <PanelHeader
            title="Inspections"
            subtitle={`${inspections.length} records`}
            icon={<ClipboardCheck className="size-4" />}
          />
          <div className="divide-y divide-border">
            {inspections.map((i) => (
              <button
                key={i.id}
                onClick={() => setSelected(i.id)}
                className={cn(
                  "flex w-full flex-wrap items-center gap-2 px-5 py-4 text-left hover:bg-accent/60",
                  active?.id === i.id && "bg-accent",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{i.facility}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {i.id} · {i.company}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" /> {i.state} State
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="size-3" /> {i.scheduled}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <UserCheck className="size-3" /> {i.inspector}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Pill tone={statusTone(i.status)}>{i.status}</Pill>
                  <Pill tone="neutral">{i.type}</Pill>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        {active ? (
          <div className="space-y-6">
            <Panel>
              <PanelHeader
                title={`${active.id}: inspection brief`}
                subtitle={`${active.facility} · ${active.company}`}
                icon={<ClipboardCheck className="size-4" />}
              />
              <div className="grid gap-3 px-5 py-4 text-xs sm:grid-cols-2">
                <Info k="Inspection type" v={active.type} />
                <Info k="Status" v={active.status} />
                <Info k="Scheduled" v={active.scheduled} />
                <Info k="Assigned inspector" v={active.inspector} />
                <Info k="State" v={`${active.state} State`} />
                <Info k="Linked application" v={active.applicationId} />
              </div>
              {active.outcome ? (
                <p className="mx-5 mb-4 rounded-xl border border-success bg-success/40 px-3 py-2 text-xs text-success-foreground">
                  Outcome: {active.outcome}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
                <Link
                  to="/processing/applications/$id"
                  params={{ id: active.applicationId }}
                  className="rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
                >
                  Open application
                </Link>
                {!readOnly ? (
                  <>
                    <button className="rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-accent">
                      Assign inspector
                    </button>
                    <button className="rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
                      Confirm schedule
                    </button>
                  </>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Oversight role: scheduling actions unavailable.
                  </p>
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Site inspection checklist" subtitle="Standard processing protocol" />
              <ul className="divide-y divide-border">
                {CHECKLIST.map((c) => (
                  <li key={c} className="flex items-start gap-3 px-5 py-3 text-xs">
                    <span className="mt-1 size-3.5 shrink-0 rounded border border-border" />
                    {c}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        ) : null}
      </div>
    </>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2">
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">{k}</p>
      <p className="mt-0.5 font-medium">{v}</p>
    </div>
  );
}
