import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";

import {
  ResourceTable,
  errorMessage,
  fmtDateTime,
  pretty,
  useListQuery,
  type Column,
} from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { Button } from "@/components/ui/button";
import { apiDownload } from "@/lib/api/client";
import {
  generateLogisticsReport,
  listReports,
  reportDownloadUrl,
  type LogisticsReport,
} from "@/lib/api/logistics";
import { useOpsList, useOpsMutation } from "@/lib/api/operations-queries";

export const Route = createFileRoute("/portal/reports")({
  head: () => ({ meta: [{ title: "Reports - Beldium Logistics Hub" }] }),
  component: ReportsPage,
});

const columns: Column<LogisticsReport>[] = [
  { header: "Report", cell: (r) => <span className="font-medium">{pretty(r.report_type)}</span> },
  { header: "Generated", cell: (r) => fmtDateTime(r.created_at) },
  {
    header: "",
    cell: (r) => (
      <Button
        size="sm"
        variant="ghost"
        onClick={() =>
          apiDownload(
            reportDownloadUrl(r.id),
            `beldium-logistics-${r.created_at.slice(0, 10)}.csv`,
          ).catch((e) => toast.error(errorMessage(e)))
        }
      >
        <Download /> Download CSV
      </Button>
    ),
  },
];

function ReportsPage() {
  const list = useListQuery();
  const reports = useOpsList("reports", listReports, list.query);
  const generate = useOpsMutation(() => generateLogisticsReport());

  return (
    <>
      <PageHeader
        title="Reports"
        description="CSV exports of your logistics register: company, fleet, drivers, documents and compliance status."
        actions={
          <Button
            disabled={generate.isPending}
            onClick={() =>
              generate.mutate(undefined, {
                onSuccess: () => toast.success("Report generated"),
                onError: (e) => toast.error(errorMessage(e)),
              })
            }
          >
            {generate.isPending ? "Generating…" : "Generate report"}
          </Button>
        }
      />
      <Panel title="Generated reports">
        <ResourceTable
          columns={columns}
          data={reports.data}
          isLoading={reports.isLoading}
          error={reports.error}
          page={list.page}
          onPage={list.setPage}
          empty="No reports generated yet."
        />
      </Panel>
    </>
  );
}
