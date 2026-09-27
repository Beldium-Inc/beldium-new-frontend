import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { FieldGrid } from "@/components/beldium/data-table";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Btn, IdLink, WorkspaceTabs } from "@/components/beldium/ops-ui";
import { docState, driverAvailability, driverBlock, fmt, fmtDate, movementOf, movementStatus, setDuty, siteName, useOps } from "@/lib/ops-store";

export const Route = createFileRoute("/portal/drivers_/$driverId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.driverId} | Driver - Beldium Logistics Hub` },
      { name: "description", content: `Driver ${params.driverId} profile: licence, documents, training, assignment, history and incidents.` },
      { property: "og:title", content: `${params.driverId} - Beldium Logistics Hub` },
      { property: "og:description", content: "Driver profile on the Beldium logistics platform." },
    ],
  }),
  component: DriverProfile,
});

const TABS = ["Details", "Licence", "Documents", "Training", "Current Assignment", "Movement History", "Incidents"];

function DriverProfile() {
  const { driverId } = Route.useParams();
  const s = useOps();
  const [tab, setTab] = useState("Details");
  const d = s.drivers.find((x) => x.id === driverId);
  if (!d) {
    return (
      <Panel title="Driver not found">
        <Link to="/portal/drivers" className="text-sm font-semibold text-colorLink">
          Back to Drivers
        </Link>
      </Panel>
    );
  }
  const m = movementOf(s, d.movementId);
  const history = s.movements.filter((x) => x.driverId === d.id);
  const incidents = s.incidents.filter((i) => history.some((h) => h.id === i.movementId));
  const docs = s.documents.filter((x) => x.relatedKind === "Driver" && x.relatedId === d.id);
  const block = driverBlock(s, d);

  return (
    <>
      <PageHeader title={d.name}>
        <div className="flex items-center gap-2">
          <StatusBadge value={driverAvailability(d, s)} />
          <Btn
            variant="outline"
            disabled={!!d.movementId && d.onDuty}
            title={d.movementId ? `Assigned to ${d.movementId}` : undefined}
            onClick={() => {
              setDuty(d.id, !d.onDuty);
              toast.success(d.onDuty ? "Marked off duty" : "Marked on duty");
            }}
          >
            {d.onDuty ? "Mark Off Duty" : "Mark On Duty"}
          </Btn>
        </div>
      </PageHeader>
      <WorkspaceTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "Details" ? (
        <Panel title="Details">
          <FieldGrid
            items={[
              { label: "Driver ID", value: d.id },
              { label: "Name", value: d.name },
              { label: "Phone", value: d.phone },
              { label: "Safety score", value: d.safetyScore },
              { label: "Compliance", value: <StatusBadge value={block ? "Restricted" : "Cleared"} /> },
              { label: "Restriction", value: block ?? "-" },
            ]}
          />
        </Panel>
      ) : null}
      {tab === "Licence" ? (
        <Panel title="Licence">
          <FieldGrid
            items={[
              { label: "Licence number", value: d.licence },
              { label: "Class", value: d.licenceClass },
              { label: "Expiry", value: fmtDate(d.licenceExpiry) },
              { label: "Status", value: <StatusBadge value={new Date(d.licenceExpiry).getTime() < Date.now() ? "Expired" : "Valid"} /> },
            ]}
          />
        </Panel>
      ) : null}
      {tab === "Documents" ? (
        <Panel title="Documents" action={<Link to="/portal/documents" className="text-xs font-semibold text-colorLink">Document register</Link>}>
          <ul className="divide-y divide-border">
            {docs.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  {x.name}
                  <span className="beldium-small ml-2">expires {fmtDate(x.expiryDate)}</span>
                </span>
                <StatusBadge value={docState(x)} />
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      {tab === "Training" ? (
        <Panel title="Training">
          {d.training.length === 0 ? <p className="text-sm text-muted-foreground">No training recorded.</p> : null}
          <ul className="flex flex-wrap gap-2">
            {d.training.map((t) => (
              <li key={t}>
                <StatusBadge value={t} tone="success" />
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      {tab === "Current Assignment" ? (
        <Panel title="Current Assignment">
          {m ? (
            <FieldGrid
              items={[
                { label: "Movement", value: <IdLink kind="movement" id={m.id} /> },
                { label: "Status", value: <StatusBadge value={movementStatus(m)} /> },
                { label: "Vehicle", value: <IdLink kind="vehicle" id={m.vehicleId} /> },
                { label: "Route", value: `${siteName(s, m.originId)} → ${siteName(s, m.destinationId)}` },
                { label: "Pickup", value: fmt(m.pickupAt) },
              ]}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Not assigned.</p>
          )}
        </Panel>
      ) : null}
      {tab === "Movement History" ? (
        <Panel title="Movement History">
          <ul className="divide-y divide-border">
            {history.length === 0 ? <li className="py-2 text-sm text-muted-foreground">No movements.</li> : null}
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <IdLink kind="movement" id={h.id} /> <span className="beldium-small ml-2">{h.movementType}</span>
                </span>
                <StatusBadge value={movementStatus(h)} />
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      {tab === "Incidents" ? (
        <Panel title="Incidents">
          <ul className="divide-y divide-border">
            {incidents.length === 0 ? <li className="py-2 text-sm text-muted-foreground">No incidents.</li> : null}
            {incidents.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  {i.id} · {i.type} · <IdLink kind="movement" id={i.movementId} />
                </span>
                <StatusBadge value={i.status} />
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </>
  );
}
