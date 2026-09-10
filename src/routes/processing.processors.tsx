import * as React from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Factory, Search } from "lucide-react";
import {
  Panel,
  PageHeader,
  Pill,
  RegisterState,
  ScoreBar,
  statusTone,
} from "@/verticals/processing/bpc";
import { useAppState } from "@/verticals/processing/store";
import { processingTypeLabel } from "@/verticals/processing/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/processing/processors")({
  head: () => ({
    meta: [
      { title: "Processors & facilities · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Register of licensed mineral processors and facilities with compliance score, standing and inspection history.",
      },
      { property: "og:title", content: "Processors & facilities · Beldium Processing Compliance" },
      {
        property: "og:description",
        content: "Register of licensed mineral processors and their facilities.",
      },
    ],
  }),
  component: ProcessorsLayout,
});

function ProcessorsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/processing/processors") return <Outlet />;
  return <ProcessorsList />;
}

const STATUSES = ["All", "Approved", "Conditional", "Under Review", "Suspended"] as const;

function ProcessorsList() {
  const { processors, isLoading, error } = useAppState();
  const [status, setStatus] = React.useState<(typeof STATUSES)[number]>("All");
  const [q, setQ] = React.useState("");

  const rows = processors.filter(
    (p) =>
      (status === "All" || p.status === status) &&
      `${p.name} ${p.rcNumber} ${p.state}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        eyebrow="Regulatory oversight"
        title="Registered processors & facilities"
        description="National register of licensed processing operators. Oversight is read-only: standing changes are effected by the Beldium compliance partner."
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search processor, RC number or State"
              className="w-full rounded-xl border border-border bg-muted/50 py-2 pr-3 pl-9 text-sm outline-none focus:border-ring"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium",
                  status === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Below `md` the register stacks as cards rather than scrolling
            sideways through seven columns. */}
        <div className="divide-y divide-border md:hidden">
          {rows.map((p) => (
            <Link
              key={p.id}
              to="/processing/processors/$id"
              params={{ id: p.id }}
              className="block px-4 py-4 hover:bg-accent/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Factory className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{p.name}</span>
                  </p>
                  <p className="pl-5 text-[11px] text-muted-foreground">{p.rcNumber}</p>
                </div>
                <Pill tone={statusTone(p.status)}>{p.status}</Pill>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {processingTypeLabel(p.processingType)} · {p.lga} LGA, {p.state} State
              </p>
              <div className="mt-3">
                <p className="mb-1 text-[10px] text-muted-foreground">
                  {p.complianceScore}% compliance · {p.facilities}{" "}
                  {p.facilities === 1 ? "facility" : "facilities"} · {p.openNCs} open
                </p>
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
            </Link>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[940px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3 font-medium">Processor</th>
                <th className="px-5 py-3 font-medium">Processing type</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Facilities</th>
                <th className="px-5 py-3 font-medium">Compliance score</th>
                <th className="px-5 py-3 font-medium">Open NCs</th>
                <th className="px-5 py-3 font-medium">Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-accent/50">
                  <td className="px-5 py-4">
                    <Link
                      to="/processing/processors/$id"
                      params={{ id: p.id }}
                      className="flex items-center gap-2 font-medium hover:underline"
                    >
                      <Factory className="size-3.5 text-muted-foreground" />
                      {p.name}
                    </Link>
                    <p className="pl-5 text-[11px] text-muted-foreground">
                      {p.rcNumber} · TIN {p.tin}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-xs">{processingTypeLabel(p.processingType)}</td>
                  <td className="px-5 py-4 text-xs">
                    {p.lga} LGA
                    <p className="text-[11px] text-muted-foreground">{p.state} State</p>
                  </td>
                  <td className="px-5 py-4 text-xs">{p.facilities}</td>
                  <td className="px-5 py-4">
                    <div className="w-28">
                      <p className="mb-1 text-[10px] text-muted-foreground">{p.complianceScore}%</p>
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
                  </td>
                  <td className="px-5 py-4 text-xs">{p.openNCs}</td>
                  <td className="px-5 py-4">
                    <Pill tone={statusTone(p.status)}>{p.status}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Outside both layouts, so an empty register explains itself at any width. */}
        {rows.length === 0 ? (
          <RegisterState
            isLoading={isLoading}
            error={error}
            empty={{
              title: "No processors on the register",
              body: "A processor joins the register once its application has been decided.",
            }}
          />
        ) : null}
      </Panel>
    </>
  );
}
