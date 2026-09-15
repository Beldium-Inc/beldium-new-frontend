import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { useWarehousingReports } from "@/lib/api/warehousing-queries";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/warehousing/regulator/reports")({
  head: () => ({
    meta: [
      { title: "Reports | Beldium Regulatory Portal" },
      { name: "description", content: "Compiled compliance reports for the warehousing register." },
    ],
  }),
  component: RegulatorReports,
});

function RegulatorReports() {
  const { generateReport } = useDemo();
  const reports = useWarehousingReports();

  return (
    <AppShell role="regulator" title="Reports" subtitle="Periodic extracts compiled from the live register">
      <Panel
        title="Generated reports"
        description="Generate a CSV register export spanning every warehouse you can see."
        actions={
          <Button
            onClick={() => {
              generateReport();
              toast.success("Report generation started");
            }}
          >
            Generate register export
          </Button>
        }
      >
        <ul className="space-y-2">
          {(reports.data?.results ?? []).map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-xl border border-border/70 p-3 text-sm">
              <span className="text-foreground">{r.report_type}</span>
              <span className="text-xs text-muted-foreground">{r.created_at}</span>
            </li>
          ))}
          {(reports.data?.results ?? []).length === 0 && (
            <li className="py-8 text-center text-sm text-muted-foreground">No reports generated yet.</li>
          )}
        </ul>
      </Panel>
    </AppShell>
  );
}
