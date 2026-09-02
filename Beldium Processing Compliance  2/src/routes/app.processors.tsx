import * as React from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Factory, Search } from "lucide-react";
import { Panel, PageHeader, Pill, ScoreBar, statusTone } from "@/components/bpc";
import { PROCESSORS, processingTypeLabel } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/processors")({
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
  if (pathname !== "/app/processors") return <Outlet />;
  return <ProcessorsList />;
}

const STATUSES = ["All", "Approved", "Conditional", "Under Review", "Suspended"] as const;

function ProcessorsList() {
  const [status, setStatus] = React.useState<(typeof STATUSES)[number]>("All");
  const [q, setQ] = React.useState("");

  const rows = PROCESSORS.filter(
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

        <div className="overflow-x-auto">
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
                      to="/app/processors/$id"
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
      </Panel>
    </>
  );
}
