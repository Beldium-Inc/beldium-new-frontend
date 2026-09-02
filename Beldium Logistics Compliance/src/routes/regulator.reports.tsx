import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/beldium/AppShell";
import { PageHeader, Panel, Pill, ReadOnlyNotice } from "@/components/beldium/bits";

export const Route = createFileRoute("/regulator/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Beldium Regulatory Portal" },
      { name: "description", content: "Downloadable oversight reports on operator compliance, restrictions and expiries." },
      { property: "og:title", content: "Reports — Beldium Regulatory Portal" },
      { property: "og:description", content: "Oversight reports for regulatory review." },
    ],
  }),
  component: RegulatorReports,
});

const REPORTS = [
  { name: "Sector compliance snapshot — Aug 2026", type: "PDF", scope: "All registered operators" },
  { name: "Operators under restriction", type: "XLSX", scope: "Restricted scopes" },
  { name: "Mineral transport authorisation register", type: "PDF", scope: "Mineral haulers" },
  { name: "Expiring credentials (90 days)", type: "XLSX", scope: "All operators" },
];

function RegulatorReports() {
  return (
    <AppShell role="regulator" breadcrumbs={[{ label: "Regulatory Oversight", to: "/regulator" }, { label: "Reports" }]}>
      <PageHeader title="Reports" description="Export read-only oversight reports for internal regulatory use." />
      <ReadOnlyNotice text="Exports are watermarked and logged in the Beldium audit trail." />
      <Panel className="mt-4" bodyClassName="p-0" title="Available reports">
        <ul className="divide-y divide-border">
          {REPORTS.map((r) => (
            <li key={r.name} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <FileSpreadsheet className="h-4 w-4 text-[var(--link)]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--brand)]">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.scope}</p>
              </div>
              <Pill tone="info">{r.type}</Pill>
              <button
                type="button"
                onClick={() => toast.success(`${r.name} exported (read-only)`)}
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
