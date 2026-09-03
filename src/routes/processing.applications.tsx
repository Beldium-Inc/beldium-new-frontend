import * as React from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Panel, PageHeader, Pill, RiskBadge, ScoreBar, statusTone } from "@/verticals/processing/bpc";
import { useAppState } from "@/verticals/processing/store";
import { processingTypeLabel } from "@/verticals/processing/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/processing/applications")({
  head: () => ({
    meta: [
      { title: "Applications · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Processor application review queue with completeness, risk band and stage for each submission.",
      },
      { property: "og:title", content: "Applications · Beldium Processing Compliance" },
      {
        property: "og:description",
        content: "Processor application review queue for the Beldium compliance desk.",
      },
    ],
  }),
  component: ApplicationsLayout,
});

const STAGES = ["All", "New", "In Review", "Awaiting Info", "Inspection", "Decided"] as const;

function ApplicationsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/processing/applications") return <Outlet />;
  return <ApplicationsList />;
}

function ApplicationsList() {
  const { applications } = useAppState();
  const [stage, setStage] = React.useState<(typeof STAGES)[number]>("All");
  const [q, setQ] = React.useState("");

  const rows = applications.filter(
    (a) =>
      (stage === "All" || a.stage === stage) &&
      (q.trim() === "" ||
        `${a.company} ${a.id} ${a.rcNumber} ${a.state}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <>
      <PageHeader
        eyebrow="Compliance operations"
        title="Processor applications"
        description="Every submission carries corporate, regulatory, facility, environmental, safety, equipment, operational, quality, waste and inspection evidence."
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/50 py-2 pr-3 pl-9 text-sm outline-none focus:border-ring"
              placeholder="Search company, RC number, application ID or State"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((s) => (
              <button
                key={s}
                onClick={() => setStage(s)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  stage === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-accent",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3 font-medium">Applicant</th>
                <th className="px-5 py-3 font-medium">Processing type</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
                <th className="px-5 py-3 font-medium">Completeness</th>
                <th className="px-5 py-3 font-medium">Risk</th>
                <th className="px-5 py-3 font-medium">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-accent/50">
                  <td className="px-5 py-4">
                    <Link
                      to="/processing/applications/$id"
                      params={{ id: a.id }}
                      className="font-medium hover:underline"
                    >
                      {a.company}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {a.id} · {a.rcNumber}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-xs">{processingTypeLabel(a.processingType)}</td>
                  <td className="px-5 py-4 text-xs">
                    {a.lga} LGA
                    <p className="text-[11px] text-muted-foreground">{a.state} State</p>
                  </td>
                  <td className="px-5 py-4 text-xs">{a.submitted}</td>
                  <td className="px-5 py-4">
                    <div className="w-28">
                      <p className="mb-1 text-[10px] text-muted-foreground">{a.completeness}%</p>
                      <ScoreBar
                        value={a.completeness}
                        tone={a.completeness > 85 ? "success" : "warning"}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <RiskBadge score={a.riskScore} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <Pill tone={statusTone(a.stage)}>{a.stage}</Pill>
                      {a.decision ? (
                        <Pill tone={statusTone(a.decision)}>{a.decision}</Pill>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
