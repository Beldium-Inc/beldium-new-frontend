import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";

import {
  FilterSelect,
  PillTabs,
  ResourceTable,
  SearchBox,
  errorMessage,
  fmtDate,
  pretty,
  useListQuery,
  type Column,
} from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Button } from "@/components/ui/button";
import { apiDownload } from "@/lib/api/client";
import {
  documentDownloadUrl,
  listLogisticsDocuments,
  type LogisticsDocument,
} from "@/lib/api/logistics";
import { listOperationsDocuments, type OperationsDocument } from "@/lib/api/operations";
import { useOpsList } from "@/lib/api/operations-queries";
import { useState } from "react";

export const Route = createFileRoute("/portal/documents")({
  head: () => ({ meta: [{ title: "Documents - Beldium Logistics Hub" }] }),
  component: DocumentsPage,
});

const validityTone = (v: string) =>
  v === "current" ? "success" : v === "expiring" ? "warning" : "danger";

const evidenceColumns: Column<LogisticsDocument>[] = [
  { header: "Document", cell: (d) => <span className="font-medium">{d.title}</span> },
  { header: "Domain", cell: (d) => pretty(d.domain) },
  { header: "Reference", cell: (d) => d.reference || "-" },
  { header: "Issuer", cell: (d) => d.issuer || "-" },
  { header: "Expires", cell: (d) => fmtDate(d.expires_on) },
  {
    header: "Validity",
    cell: (d) => <StatusBadge value={pretty(d.validity)} tone={validityTone(d.validity)} />,
  },
  { header: "Review", cell: (d) => <StatusBadge value={pretty(d.status)} /> },
  { header: "Version", cell: (d) => `v${d.version}` },
  {
    header: "",
    cell: (d) => (
      <Button
        size="sm"
        variant="ghost"
        onClick={() =>
          apiDownload(documentDownloadUrl(d.id), d.original_name || d.title).catch((e) =>
            toast.error(errorMessage(e)),
          )
        }
      >
        <Download /> Download
      </Button>
    ),
  },
];

const registerColumns: Column<OperationsDocument>[] = [
  { header: "Document", cell: (d) => <span className="font-medium">{d.name}</span> },
  { header: "Type", cell: (d) => d.document_type },
  { header: "Related to", cell: (d) => d.related_asset || "-" },
  { header: "Issued", cell: (d) => fmtDate(d.issue_date) },
  { header: "Expires", cell: (d) => fmtDate(d.expiry_date) },
  { header: "Verification", cell: (d) => <StatusBadge value={d.verification_status} /> },
  { header: "Compliance", cell: (d) => <StatusBadge value={d.compliance_status} /> },
];

function DocumentsPage() {
  const [view, setView] = useState("evidence");
  const evidenceList = useListQuery({ is_current: "true" });
  const registerList = useListQuery();
  const evidence = useOpsList("documents", listLogisticsDocuments, evidenceList.query, {
    enabled: view === "evidence",
  });
  const register = useOpsList("operations-documents", listOperationsDocuments, registerList.query, {
    enabled: view === "register",
  });

  return (
    <>
      <PageHeader
        title="Documents"
        description="Evidence you have submitted to Beldium Logistics Compliance, and the operations document register."
      />
      <Panel title="Documents">
        <div className="space-y-4">
          <PillTabs
            tabs={[
              { value: "evidence", label: "Submitted evidence" },
              { value: "register", label: "Operations register" },
            ]}
            value={view}
            onChange={setView}
          />
          {view === "evidence" ? (
            <>
              <div className="flex flex-wrap gap-2">
                <FilterSelect
                  label="Domain"
                  value={evidenceList.filters["domain"] ?? ""}
                  options={[
                    "corporate",
                    "regulatory",
                    "fleet",
                    "driver",
                    "insurance",
                    "hs",
                    "operational",
                    "mineral",
                    "data",
                  ]}
                  onChange={(v) => evidenceList.setFilter("domain", v)}
                />
                <FilterSelect
                  label="Review"
                  value={evidenceList.filters["status"] ?? ""}
                  options={["pending", "verified", "rejected"]}
                  onChange={(v) => evidenceList.setFilter("status", v)}
                />
              </div>
              <ResourceTable
                columns={evidenceColumns}
                data={evidence.data}
                isLoading={evidence.isLoading}
                error={evidence.error}
                page={evidenceList.page}
                onPage={evidenceList.setPage}
                empty="No evidence uploaded yet."
              />
            </>
          ) : (
            <>
              <SearchBox
                value={registerList.search}
                onChange={registerList.setSearch}
                placeholder="Reference, name, related asset"
              />
              <ResourceTable
                columns={registerColumns}
                data={register.data}
                isLoading={register.isLoading}
                error={register.error}
                page={registerList.page}
                onPage={registerList.setPage}
                empty="No register entries."
              />
            </>
          )}
        </div>
      </Panel>
    </>
  );
}
