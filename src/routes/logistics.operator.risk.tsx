import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/verticals/logistics/AppShell";
import { PageHeader, Panel, Pill, RiskBadge, ScoreBar } from "@/verticals/logistics/bits";
import { useApp } from "@/verticals/logistics/store";

export const Route = createFileRoute("/logistics/operator/risk")({
  head: () => ({
    meta: [
      { title: "Risk assessment | Beldium Compliance Operations" },
      { name: "description", content: "Portfolio risk scoring across registered logistics operators." },
      { property: "og:title", content: "Risk assessment | Beldium Compliance Operations" },
      { property: "og:description", content: "Compare operator risk bands, domain scores and mitigations." },
    ],
  }),
  component: RiskPage,
});

function RiskPage() {
  const { companies } = useApp();
  const data = [...companies]
    .sort((a, b) => a.riskScore - b.riskScore)
    .map((c) => ({ name: c.name.replace(/ (Ltd|Plc)$/, ""), score: c.riskScore, risk: c.risk }));

  return (
    <AppShell role="operator" breadcrumbs={[{ label: "Compliance Operations", to: "/logistics/operator" }, { label: "Risk assessment" }]}>
      <PageHeader title="Risk assessment" description="Portfolio-wide scoring, weighted across the nine compliance domains." />

      <Panel title="Operator risk ranking" description="Lower scores require earlier intervention" bodyClassName="p-4">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 90, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F2" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#5B6B85" }} />
              <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 11, fill: "#5B6B85" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F2", fontSize: 12 }} />
              <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={16}>
                {data.map((d) => (
                  <Cell key={d.name} fill={d.risk === "Low" ? "#B0E2CD" : d.risk === "Medium" ? "#FBBF24" : "#F87171"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {companies.map((c) => (
          <Panel
            key={c.id}
            title={c.name}
            description={`${c.id} · ${c.location}`}
            actions={<RiskBadge risk={c.risk} score={c.riskScore} />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <ScoreBar label="Fleet" value={c.scores.fleet} />
              <ScoreBar label="Drivers" value={c.scores.drivers} />
              <ScoreBar label="Insurance" value={c.scores.insurance} />
              <ScoreBar label="Safety" value={c.scores.safety} />
              <ScoreBar label="Mineral transport" value={c.scores.mineral} />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Pill tone={c.scores.mineral === 0 ? "warning" : "success"}>
                {c.scores.mineral === 0 ? "Mineral scope restricted" : "Mineral scope cleared"}
              </Pill>
              <Link
                to="/logistics/operator/applications/$companyId"
                params={{ companyId: c.id }}
                search={{ tab: "risk" }}
                className="text-xs font-medium text-[var(--link)] hover:underline"
              >
                Open risk detail
              </Link>
            </div>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
