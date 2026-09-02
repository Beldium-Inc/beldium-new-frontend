import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Panel, StatusPill } from "@/components/compliance-ui";
import { REGULATOR_REPORTS } from "@/lib/demo/data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/regulator/reports")({
  head: () => ({
    meta: [
      { title: "Reports | Beldium Regulatory Portal" },
      { name: "description", content: "Downloadable regulatory reports: compliance summaries, incident registers, certificate expiry forecasts and stock movement." },
      { property: "og:title", content: "Reports | Beldium Regulatory Portal" },
      { property: "og:description", content: "Periodic compliance reporting for oversight bodies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegulatorReports,
});

function RegulatorReports() {
  return (
    <AppShell role="regulator" title="Reports" subtitle="Periodic extracts prepared by the compliance partner">
      <Panel title="Available reports" description="Demo prototype — downloads are simulated.">
        <div className="grid gap-4 md:grid-cols-2">
          {REGULATOR_REPORTS.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border/70 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.id} · {r.period} · {r.facilities} facilities</p>
                </div>
                <StatusPill tone="info">{r.format}</StatusPill>
              </div>
              <Button
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={() => toast.success(`${r.id} generated`, { description: "Sample data only — no file is produced in this prototype." })}
              >
                Generate
              </Button>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
