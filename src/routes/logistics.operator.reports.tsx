import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/logistics/AppShell";
import { PageHeader, Panel, Pill } from "@/verticals/logistics/bits";
import { useApp } from "@/verticals/logistics/store";
import { useGenerateLogisticsReport, useLogisticsReports } from "@/lib/api/logistics-queries";
import { reportDownloadUrl } from "@/lib/api/logistics";
import { apiUrl } from "@/lib/api/config";

export const Route = createFileRoute("/logistics/operator/reports")({
  head: () => ({
    meta: [
      { title: "Reports | Beldium Compliance Operations" },
      { name: "description", content: "Compliance throughput, decision mix and risk reporting for logistics operators." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { companies } = useApp();
  const reports = useLogisticsReports();
  const generate = useGenerateLogisticsReport();

  const snapshot = [
    { label: "Approved", value: companies.filter((c) => c.status === "Approved" || c.status === "Conditionally Approved").length, color: "#101E3D" },
    { label: "Pending", value: companies.filter((c) => c.status === "Pending Review" || c.status === "Under Review").length, color: "#FBBF24" },
    { label: "Rejected", value: companies.filter((c) => c.status === "Rejected").length, color: "#F87171" },
  ];
  const riskBands = [
    { label: "Low", value: companies.filter((c) => c.risk === "Low").length, color: "#B0E2CD" },
    { label: "Medium", value: companies.filter((c) => c.risk === "Medium").length, color: "#FBBF24" },
    { label: "High", value: companies.filter((c) => c.risk === "High").length, color: "#F87171" },
  ];

  return (
    <AppShell role="operator" breadcrumbs={[{ label: "Compliance Operations", to: "/logistics/operator" }, { label: "Reports" }]}>
      <PageHeader
        title="Reports"
        description="Generated from the live compliance register."
        actions={
          <button
            type="button"
            onClick={() => {
              generate.mutate(undefined, { onSuccess: () => toast.success("Register export generated") });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-medium text-white transition hover:bg-[var(--brand)]/90"
          >
            Generate register export
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Decision mix" bodyClassName="p-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={snapshot} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F2" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5B6B85" }} />
                <YAxis tick={{ fontSize: 11, fill: "#5B6B85" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F2", fontSize: 12 }} />
                <Bar dataKey="value" name="Companies" radius={[6, 6, 0, 0]} barSize={28}>
                  {snapshot.map((s) => (
                    <Cell key={s.label} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Risk distribution" bodyClassName="p-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskBands} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F2" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5B6B85" }} />
                <YAxis tick={{ fontSize: 11, fill: "#5B6B85" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F2", fontSize: 12 }} />
                <Bar dataKey="value" name="Companies" radius={[6, 6, 0, 0]} barSize={28}>
                  {riskBands.map((s) => (
                    <Cell key={s.label} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel className="mt-4" title="Generated reports" bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {(reports.data?.results ?? []).map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <FileSpreadsheet className="h-4 w-4 text-[var(--link)]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--brand)]">{r.report_type}</p>
                <p className="text-xs text-muted-foreground">{r.created_at}</p>
              </div>
              <Pill tone="info">CSV</Pill>
              <a
                href={apiUrl(reportDownloadUrl(r.id))}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-[var(--brand)] hover:border-[var(--link)]/50"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </a>
            </li>
          ))}
          {(reports.data?.results ?? []).length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-muted-foreground">No reports generated yet.</li>
          )}
        </ul>
      </Panel>
    </AppShell>
  );
}
