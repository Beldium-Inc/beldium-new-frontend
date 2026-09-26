import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { FieldGrid, RowAction } from "@/components/beldium/data-table";
import { ReportIncidentDialog } from "@/components/beldium/ops-dialogs";
import { Btn, FormField, IdLink, Modal, QueueView, fieldCls, tabSearch } from "@/components/beldium/ops-ui";
import { fmt, resolveIncident, severities, useOps, type Incident } from "@/lib/ops-store";

export const Route = createFileRoute("/_ops/incidents")({
  validateSearch: tabSearch,
  head: () => ({
    meta: [
      { title: "Incidents | Beldium Logistics" },
      { name: "description", content: "Incident queue with severity, affected material, immediate action and resolution." },
      { property: "og:title", content: "Incidents | Beldium Logistics" },
      { property: "og:description", content: "Report and resolve movement incidents across the Beldium network." },
    ],
  }),
  component: Page,
});

function Page() {
  const s = useOps();
  const { tab } = Route.useSearch();
  const [report, setReport] = useState(false);
  const [view, setView] = useState<Incident | null>(null);
  const [resolution, setResolution] = useState("");
  const current = view ? s.incidents.find((i) => i.id === view.id) ?? null : null;

  return (
    <>
      <PageHeader title="Incidents">
        <Btn variant="danger" onClick={() => setReport(true)}>
          Report Incident
        </Btn>
      </PageHeader>
      <Panel title="Incident Queue">
        <QueueView
          rows={s.incidents}
          getKey={(i) => i.id}
          initialTab={tab ?? "Open"}
          tabs={[
            { label: "Open", test: (i) => i.status === "Open" },
            { label: "Resolved", test: (i) => i.status === "Resolved" },
            { label: "All", test: () => true },
          ]}
          columns={[
            { key: "id", header: "Incident", render: (i) => <span className="font-semibold text-primary">{i.id}</span>, sort: (i) => i.id },
            { key: "mov", header: "Movement", render: (i) => <IdLink kind="movement" id={i.movementId} /> },
            { key: "type", header: "Type", render: (i) => i.type, sort: (i) => i.type },
            { key: "sev", header: "Severity", render: (i) => <StatusBadge value={i.severity} tone={i.severity === "High" || i.severity === "Critical" ? "danger" : "warning"} />, sort: (i) => severities.indexOf(i.severity) },
            { key: "loc", header: "Location", render: (i) => i.location },
            { key: "mat", header: "Material", render: (i) => i.material },
            { key: "qty", header: "Qty affected", render: (i) => i.quantityAffected || "-" },
            { key: "at", header: "Reported", render: (i) => fmt(i.reportedAt), sort: (i) => i.reportedAt },
            { key: "status", header: "Status", render: (i) => <StatusBadge value={i.status} /> },
          ]}
          searchText={(i) => `${i.id} ${i.movementId} ${i.type} ${i.location} ${i.description}`}
          filters={[
            { label: "Type", get: (i) => i.type },
            { label: "Severity", get: (i) => i.severity },
          ]}
          onOpen={setView}
          actions={(i) => <RowAction onClick={() => setView(i)}>{i.status === "Open" ? "Resolve" : "View"}</RowAction>}
        />
      </Panel>

      {report ? <ReportIncidentDialog open={report} onClose={() => setReport(false)} /> : null}

      <Modal
        open={!!current}
        onClose={() => setView(null)}
        wide
        title={current ? `${current.id} · ${current.type}` : ""}
        footer={
          current?.status === "Open" ? (
            <>
              <Btn variant="outline" onClick={() => setView(null)}>
                Close
              </Btn>
              <Btn
                disabled={!resolution.trim()}
                onClick={() => {
                  resolveIncident(current.id, resolution.trim());
                  toast.success(`${current.id} resolved`);
                  setResolution("");
                  setView(null);
                }}
              >
                Resolve Incident
              </Btn>
            </>
          ) : (
            <Btn variant="outline" onClick={() => setView(null)}>
              Close
            </Btn>
          )
        }
      >
        {current ? (
          <div className="space-y-4">
            <FieldGrid
              items={[
                { label: "Movement", value: <IdLink kind="movement" id={current.movementId} /> },
                { label: "Severity", value: current.severity },
                { label: "Status", value: <StatusBadge value={current.status} /> },
                { label: "Location", value: current.location },
                { label: "Material", value: current.material },
                { label: "Quantity affected", value: current.quantityAffected || "-" },
                { label: "Evidence", value: current.evidence || "-" },
                { label: "Immediate action", value: current.immediateAction },
                { label: "Reported", value: fmt(current.reportedAt) },
                ...(current.resolvedAt ? [{ label: "Resolved", value: fmt(current.resolvedAt) }, { label: "Resolution", value: current.resolution }] : []),
              ]}
            />
            <p className="text-sm">{current.description}</p>
            {current.status === "Open" ? (
              <FormField label="Resolution">
                <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} className={fieldCls} />
              </FormField>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
