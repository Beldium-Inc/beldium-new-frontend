import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { RowAction } from "@/components/beldium/data-table";
import { Btn, FormField, IdLink, Modal, QueueView, WorkspaceTabs, fieldCls, tabSearch } from "@/components/beldium/ops-ui";
import {
  closeNonConformity,
  docState,
  driverBlock,
  fmt,
  movementStatus,
  setCompliance,
  submitCorrectiveAction,
  useOps,
  vehicleBlock,
  type NonConformity,
} from "@/lib/ops-store";
import { useOperator } from "@/lib/onboarding-store";

export const Route = createFileRoute("/_ops/compliance")({
  validateSearch: tabSearch,
  head: () => ({
    meta: [
      { title: "Compliance | Beldium Logistics" },
      { name: "description", content: "Organisation, fleet, vehicle, driver, safety and movement compliance with non conformities and corrective actions." },
      { property: "og:title", content: "Compliance | Beldium Logistics" },
      { property: "og:description", content: "Beldium Logistics Compliance decisions on operator records." },
    ],
  }),
  component: Page,
});

const TABS = ["Organisation", "Fleet", "Vehicles", "Drivers", "Safety", "Movement Compliance", "Non Conformities", "Corrective Actions"];

function Page() {
  const s = useOps();
  const op = useOperator();
  const { tab } = Route.useSearch();
  const [t, setT] = useState(tab && TABS.includes(tab) ? tab : "Non Conformities");
  const [restrict, setRestrict] = useState<{ kind: "Vehicle" | "Driver"; id: string } | null>(null);
  const [reason, setReason] = useState("");
  const [ca, setCa] = useState<NonConformity | null>(null);
  const [caText, setCaText] = useState("");
  const orgDocs = s.documents.filter((d) => d.relatedKind === "Organisation");
  const safetyDocs = orgDocs.filter((d) => d.type === "Safety");

  return (
    <>
      <PageHeader title="Compliance" />
      <WorkspaceTabs tabs={TABS} value={t} onChange={setT} />

      {t === "Organisation" ? (
        <Panel title="Organisation">
          <ul className="space-y-2 text-sm">
            <Line label="Operator application" value={op.application?.status ?? "Approved"} />
            {orgDocs.map((d) => (
              <Line key={d.id} label={d.name} value={docState(d)} />
            ))}
          </ul>
        </Panel>
      ) : null}

      {t === "Fleet" ? (
        <Panel title="Fleet">
          <ul className="space-y-2 text-sm">
            <Line label="Vehicles cleared for assignment" value={`${s.vehicles.filter((v) => !vehicleBlock(s, v)).length} of ${s.vehicles.length}`} />
            <Line label="Vehicles restricted" value={`${s.vehicles.filter((v) => vehicleBlock(s, v)).length} Restricted`} />
            <Line label="Trackers offline" value={`${s.vehicles.filter((v) => v.tracker !== "Online").length} Offline`} />
            <Line label="Vehicles in maintenance" value={`${s.vehicles.filter((v) => v.maintenance).length} Maintenance`} />
          </ul>
        </Panel>
      ) : null}

      {t === "Vehicles" ? (
        <Panel title="Vehicle Compliance">
          <QueueView
            rows={s.vehicles}
            getKey={(v) => v.id}
            tabs={[
              { label: "All", test: () => true },
              { label: "Cleared", test: (v) => !vehicleBlock(s, v) },
              { label: "Restricted", test: (v) => !!vehicleBlock(s, v) },
            ]}
            columns={[
              { key: "id", header: "Vehicle", render: (v) => <IdLink kind="vehicle" id={v.id} />, sort: (v) => v.id },
              { key: "reg", header: "Registration", render: (v) => v.registration },
              { key: "dec", header: "Decision", render: (v) => <StatusBadge value={v.compliance} /> },
              { key: "reason", header: "Reason", render: (v) => vehicleBlock(s, v) ?? "-" },
            ]}
            searchText={(v) => `${v.id} ${v.registration}`}
            actions={(v) =>
              v.compliance === "Cleared" ? (
                <RowAction onClick={() => { setReason(""); setRestrict({ kind: "Vehicle", id: v.id }); }}>Restrict</RowAction>
              ) : (
                <RowAction onClick={() => { setCompliance("Vehicle", v.id, "Cleared"); toast.success(`${v.id} cleared`); }}>Clear</RowAction>
              )
            }
          />
        </Panel>
      ) : null}

      {t === "Drivers" ? (
        <Panel title="Driver Compliance">
          <QueueView
            rows={s.drivers}
            getKey={(d) => d.id}
            tabs={[
              { label: "All", test: () => true },
              { label: "Cleared", test: (d) => !driverBlock(s, d) },
              { label: "Restricted", test: (d) => !!driverBlock(s, d) },
            ]}
            columns={[
              { key: "id", header: "Driver", render: (d) => <IdLink kind="driver" id={d.id} />, sort: (d) => d.id },
              { key: "name", header: "Name", render: (d) => d.name },
              { key: "dec", header: "Decision", render: (d) => <StatusBadge value={d.compliance} /> },
              { key: "reason", header: "Reason", render: (d) => driverBlock(s, d) ?? "-" },
            ]}
            searchText={(d) => `${d.id} ${d.name}`}
            actions={(d) =>
              d.compliance === "Cleared" ? (
                <RowAction onClick={() => { setReason(""); setRestrict({ kind: "Driver", id: d.id }); }}>Restrict</RowAction>
              ) : (
                <RowAction onClick={() => { setCompliance("Driver", d.id, "Cleared"); toast.success(`${d.name} cleared`); }}>Clear</RowAction>
              )
            }
          />
        </Panel>
      ) : null}

      {t === "Safety" ? (
        <Panel title="Safety">
          <ul className="space-y-2 text-sm">
            {safetyDocs.map((d) => (
              <Line key={d.id} label={d.name} value={docState(d)} />
            ))}
            <Line label="Open high-severity incidents" value={`${s.incidents.filter((i) => i.status === "Open" && (i.severity === "High" || i.severity === "Critical")).length} Open`} />
            <Line label="Average driver safety score" value={`${Math.round(s.drivers.reduce((a, d) => a + d.safetyScore, 0) / s.drivers.length)}`} />
          </ul>
        </Panel>
      ) : null}

      {t === "Movement Compliance" ? (
        <Panel title="Movement Compliance">
          <QueueView
            rows={s.movements.filter((m) => m.stage !== "Completed")}
            getKey={(m) => m.id}
            columns={[
              { key: "id", header: "Movement", render: (m) => <IdLink kind="movement" id={m.id} /> },
              { key: "route", header: "Route adherence", render: (m) => <StatusBadge value={m.deviated ? "Deviation" : "On route"} /> },
              { key: "inc", header: "Incidents", render: (m) => s.incidents.filter((i) => i.movementId === m.id && i.status === "Open").length },
              { key: "status", header: "Status", render: (m) => <StatusBadge value={movementStatus(m)} /> },
            ]}
            searchText={(m) => m.id}
          />
        </Panel>
      ) : null}

      {t === "Non Conformities" || t === "Corrective Actions" ? (
        <Panel title={t}>
          <QueueView
            rows={s.nonConformities}
            getKey={(n) => n.id}
            initialTab={t === "Corrective Actions" ? "Corrective Action Submitted" : "Open"}
            tabs={["Open", "Corrective Action Submitted", "Closed"].map((l) => ({ label: l, test: (n: NonConformity) => n.status === l }))}
            columns={[
              { key: "id", header: "Reference", render: (n) => <span className="font-semibold text-primary">{n.id}</span>, sort: (n) => n.id },
              { key: "area", header: "Area", render: (n) => n.area },
              { key: "rel", header: "Record", render: (n) => (n.relatedKind === "Vehicle" ? <IdLink kind="vehicle" id={n.relatedId} /> : n.relatedKind === "Driver" ? <IdLink kind="driver" id={n.relatedId} /> : n.relatedId) },
              { key: "detail", header: "Non conformity", render: (n) => n.detail },
              { key: "action", header: "Corrective action", render: (n) => n.action ?? "-" },
              { key: "raised", header: "Raised", render: (n) => fmt(n.raisedAt), sort: (n) => n.raisedAt },
              { key: "status", header: "Status", render: (n) => <StatusBadge value={n.status} /> },
            ]}
            searchText={(n) => `${n.id} ${n.detail} ${n.relatedId}`}
            filters={[{ label: "Area", get: (n) => n.area }]}
            actions={(n) =>
              n.status === "Open" ? (
                <RowAction onClick={() => { setCaText(""); setCa(n); }}>Submit Action</RowAction>
              ) : n.status === "Corrective Action Submitted" ? (
                <RowAction onClick={() => { closeNonConformity(n.id); toast.success(`${n.id} closed`); }}>Close</RowAction>
              ) : null
            }
          />
        </Panel>
      ) : null}

      <Modal
        open={!!restrict}
        onClose={() => setRestrict(null)}
        title={`Restrict ${restrict?.kind} ${restrict?.id}`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setRestrict(null)}>
              Cancel
            </Btn>
            <Btn
              variant="danger"
              disabled={!reason.trim()}
              onClick={() => {
                setCompliance(restrict!.kind, restrict!.id, "Restricted", reason.trim());
                toast.success("Restriction applied");
                setRestrict(null);
              }}
            >
              Apply Restriction
            </Btn>
          </>
        }
      >
        <FormField label="Reason">
          <select value={reason} onChange={(e) => setReason(e.target.value)} className={fieldCls}>
            <option value="">Select reason</option>
            {restrict?.kind === "Vehicle" ? (
              <>
                <option>Failed roadside inspection</option>
                <option>Insurance under review</option>
                <option>Tracker tampering detected</option>
              </>
            ) : (
              <>
                <option>Driver safety investigation</option>
                <option>Training certificate lapsed</option>
                <option>Medical fitness review</option>
              </>
            )}
          </select>
        </FormField>
      </Modal>

      <Modal
        open={!!ca}
        onClose={() => setCa(null)}
        title={`Corrective action — ${ca?.id}`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setCa(null)}>
              Cancel
            </Btn>
            <Btn
              disabled={!caText.trim()}
              onClick={() => {
                submitCorrectiveAction(ca!.id, caText.trim());
                toast.success("Corrective action submitted");
                setCa(null);
              }}
            >
              Submit
            </Btn>
          </>
        }
      >
        <p className="text-sm">{ca?.detail}</p>
        <FormField label="Corrective action">
          <textarea value={caText} onChange={(e) => setCaText(e.target.value)} rows={3} className={fieldCls} />
        </FormField>
      </Modal>
    </>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
      <span className="font-medium">{label}</span>
      <StatusBadge value={value} />
    </li>
  );
}
