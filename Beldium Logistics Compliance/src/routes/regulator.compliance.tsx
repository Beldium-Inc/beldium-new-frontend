import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/beldium/AppShell";
import { PageHeader, Panel, ReadOnlyNotice, ScoreBar } from "@/components/beldium/bits";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/regulator/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance status — Beldium Regulatory Portal" },
      { name: "description", content: "Sector-wide compliance scores across fleet, drivers, insurance and safety domains." },
      { property: "og:title", content: "Compliance status — Beldium Regulatory Portal" },
      { property: "og:description", content: "Aggregate compliance performance of registered operators." },
    ],
  }),
  component: RegulatorCompliance,
});

function RegulatorCompliance() {
  const { companies } = useApp();
  const data = companies.map((c) => ({ name: c.name.split(" ")[0], score: c.riskScore }));
  const avg = (k: "fleet" | "drivers" | "insurance" | "safety" | "mineral") =>
    Math.round(companies.reduce((n, c) => n + c.scores[k], 0) / companies.length);

  return (
    <AppShell role="regulator" breadcrumbs={[{ label: "Regulatory Oversight", to: "/regulator" }, { label: "Compliance status" }]}>
      <PageHeader title="Compliance status" description="Aggregate compliance performance across the registered operator base." />
      <ReadOnlyNotice text="Figures are derived from verified evidence held by Beldium. Regulators cannot alter scores." />
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Operator compliance scores" bodyClassName="p-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F2" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5B6B85" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#5B6B85" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F2", fontSize: 12 }} />
                <Bar dataKey="score" name="Compliance score" fill="#101E3D" radius={[6, 6, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Sector averages">
          <div className="space-y-3">
            <ScoreBar label="Fleet" value={avg("fleet")} />
            <ScoreBar label="Drivers" value={avg("drivers")} />
            <ScoreBar label="Insurance" value={avg("insurance")} />
            <ScoreBar label="Health & safety" value={avg("safety")} />
            <ScoreBar label="Mineral transport" value={avg("mineral")} />
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
