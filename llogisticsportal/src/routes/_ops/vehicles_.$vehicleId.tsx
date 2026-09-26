import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { FieldGrid } from "@/components/beldium/data-table";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Btn, FormField, IdLink, Modal, WorkspaceTabs, fieldCls } from "@/components/beldium/ops-ui";
import { docState, fmt, fmtDate, movementOf, movementStatus, setMaintenance, siteName, useOps, vehicleAvailability, vehicleBlock } from "@/lib/ops-store";

export const Route = createFileRoute("/_ops/vehicles_/$vehicleId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.vehicleId} | Vehicle | Beldium Logistics` },
      { name: "description", content: `Vehicle ${params.vehicleId} profile: assignment, documents, compliance, maintenance and history.` },
      { property: "og:title", content: `${params.vehicleId} | Beldium Logistics` },
      { property: "og:description", content: "Vehicle profile on the Beldium logistics platform." },
    ],
  }),
  component: VehicleProfile,
});

const TABS = ["Details", "Current Assignment", "Documents", "Compliance", "Maintenance", "Movement History"];

function VehicleProfile() {
  const { vehicleId } = Route.useParams();
  const s = useOps();
  const [tab, setTab] = useState("Details");
  const [maint, setMaint] = useState(false);
  const [note, setNote] = useState("");
  const v = s.vehicles.find((x) => x.id === vehicleId);
  if (!v) {
    return (
      <Panel title="Vehicle not found">
        <Link to="/fleet" className="text-sm font-semibold text-colorLink">
          Back to Fleet
        </Link>
      </Panel>
    );
  }
  const m = movementOf(s, v.movementId);
  const block = vehicleBlock(s, v);
  const history = s.movements.filter((x) => x.vehicleId === v.id);
  const docs = s.documents.filter((d) => d.relatedKind === "Vehicle" && d.relatedId === v.id);
  const ncs = s.nonConformities.filter((n) => n.relatedId === v.id);

  return (
    <>
      <PageHeader title={`${v.id} · ${v.registration}`}>
        <div className="flex items-center gap-2">
          <StatusBadge value={vehicleAvailability(v, s)} />
          {v.maintenance ? (
            <Btn onClick={() => setMaint(true)}>Return to Service</Btn>
          ) : (
            <Btn variant="outline" disabled={!!v.movementId} title={v.movementId ? `Assigned to ${v.movementId}` : undefined} onClick={() => setMaint(true)}>
              Send to Maintenance
            </Btn>
          )}
        </div>
      </PageHeader>
      <WorkspaceTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "Details" ? (
        <Panel title="Details">
          <FieldGrid
            items={[
              { label: "Vehicle ID", value: v.id },
              { label: "Registration", value: v.registration },
              { label: "Type", value: v.type },
              { label: "Make", value: v.make },
              { label: "Year", value: v.year },
              { label: "Capacity", value: `${v.capacity} t` },
              { label: "Tracker", value: <StatusBadge value={v.tracker} /> },
              { label: "Owner", value: "Trans Sahel Haulage Ltd" },
            ]}
          />
        </Panel>
      ) : null}
      {tab === "Current Assignment" ? (
        <Panel title="Current Assignment">
          {m ? (
            <FieldGrid
              items={[
                { label: "Movement", value: <IdLink kind="movement" id={m.id} /> },
                { label: "Status", value: <StatusBadge value={movementStatus(m)} /> },
                { label: "Route", value: `${siteName(s, m.originId)} → ${siteName(s, m.destinationId)}` },
                { label: "Load", value: `${m.loaded ?? m.quantity} ${m.unit}` },
                { label: "Pickup", value: fmt(m.pickupAt) },
              ]}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Not assigned.</p>
          )}
        </Panel>
      ) : null}
      {tab === "Documents" ? (
        <Panel title="Documents" action={<Link to="/documents" search={{ tab: "All" }} className="text-xs font-semibold text-colorLink">Document register</Link>}>
          <ul className="divide-y divide-border">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  {d.name}
                  <span className="beldium-small ml-2">
                    {d.number} · expires {fmtDate(d.expiryDate)}
                  </span>
                </span>
                <StatusBadge value={docState(d)} />
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      {tab === "Compliance" ? (
        <Panel title="Compliance">
          <FieldGrid
            items={[
              { label: "Beldium compliance decision", value: <StatusBadge value={v.compliance} /> },
              { label: "Assignment eligibility", value: <StatusBadge value={block ? "Restricted" : "Eligible"} /> },
              { label: "Reason", value: block ?? "-" },
            ]}
          />
          <ul className="mt-4 space-y-2">
            {ncs.map((n) => (
              <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <span>
                  {n.id} · {n.detail}
                </span>
                <StatusBadge value={n.status} />
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      {tab === "Maintenance" ? (
        <Panel title="Maintenance">
          <FieldGrid
            items={[
              { label: "Status", value: <StatusBadge value={v.maintenance ? "In maintenance" : "In service"} /> },
              { label: "Last service", value: fmtDate(v.lastService) },
              { label: "Next service", value: fmtDate(v.nextService) },
            ]}
          />
          <ul className="mt-4 space-y-1.5 text-sm">
            {v.maintenanceLog.map((l, i) => (
              <li key={i}>
                <span className="beldium-mono mr-2 font-semibold text-primary">{fmt(l.at)}</span>
                {l.note}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      {tab === "Movement History" ? (
        <Panel title="Movement History">
          <ul className="divide-y divide-border">
            {history.length === 0 ? <li className="py-2 text-sm text-muted-foreground">No movements.</li> : null}
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <IdLink kind="movement" id={h.id} /> <span className="beldium-small ml-2">{h.movementType} · {siteName(s, h.originId)} → {siteName(s, h.destinationId)}</span>
                </span>
                <StatusBadge value={movementStatus(h)} />
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Modal
        open={maint}
        onClose={() => setMaint(false)}
        title={v.maintenance ? "Return to Service" : "Send to Maintenance"}
        footer={
          <>
            <Btn variant="outline" onClick={() => setMaint(false)}>
              Cancel
            </Btn>
            <Btn
              disabled={!note.trim()}
              onClick={() => {
                setMaintenance(v.id, !v.maintenance, note.trim());
                toast.success(v.maintenance ? "Returned to service" : "Sent to maintenance");
                setMaint(false);
                setNote("");
              }}
            >
              Confirm
            </Btn>
          </>
        }
      >
        <FormField label="Work note">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={fieldCls} />
        </FormField>
      </Modal>
    </>
  );
}
