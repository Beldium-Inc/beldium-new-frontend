import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/beldium/AppShell";
import { PageHeader, Panel, Pill } from "@/components/beldium/bits";
import { complianceTrend } from "@/lib/mock-data";

export const Route = createFileRoute("/operator/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Beldium Compliance Operations" },
      { name: "description", content: "Compliance throughput, decision mix and risk reporting for logistics operators." },
      { property: "og:title", content: "Reports — Beldium Compliance Operations" },
      { property: "og:description", content: "Download compliance, risk and SLA reports." },
    ],
  }),
  component: ReportsPage,
});

const REPORTS = [
  { name: "Monthly compliance summary — Aug 2026", type: "PDF", size: "1.8 MB", scope: "All operators" },
  { name: "Risk exposure register", type: "XLSX", size: "640 KB", scope: "Medium & high risk" },
  { name: "Expiring credentials forecast (90 days)", type: "XLSX", size: "410 KB", scope: "All operators" },
  { name: "Mineral transport authorisation status", type: "PDF", size: "820 KB", scope: "Mineral haulers" },
  { name: "SLA performance — information requests", type: "PDF", size: "520 KB", scope: "Compliance team" },
];

function ReportsPage() {
  return (
    <AppShell role="operator" breadcrumbs={[{ label: "Compliance Operations", to: "/operator" }, { label: "Reports" }]}>
      <PageHeader title="Reports" description="Generated from the live compliance register. Exports are simulated in this prototype." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Decision throughput" bodyClassName="p-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceTrend} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F2" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5B6B85" }} />
                <YAxis tick={{ fontSize: 11, fill: "#5B6B85" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F2", fontSize: 12 }} />
                <Bar dataKey="approved" name="Approved" fill="#101E3D" radius={[6, 6, 0, 0]} barSize={18} />
                <Bar dataKey="rejected" name="Rejected" fill="#F87171" radius={[6, 6, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Average risk score" bodyClassName="p-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complianceTrend} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F2" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5B6B85" }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#5B6B85" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F2", fontSize: 12 }} />
                <Line type="monotone" dataKey="avgRisk" name="Avg risk score" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel className="mt-4" title="Available reports" bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {REPORTS.map((r) => (
            <li key={r.name} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <FileSpreadsheet className="h-4 w-4 text-[var(--link)]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--brand)]">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.scope} · {r.type} · {r.size}
                </p>
              </div>
              <Pill tone="info">{r.type}</Pill>
              <button
                type="button"
                onClick={() => toast.success(`${r.name} exported`)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-[var(--brand)] hover:border-[var(--link)]/50"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </AppShell>
  );
}
