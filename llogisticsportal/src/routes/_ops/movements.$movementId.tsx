import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { FieldGrid } from "@/components/beldium/data-table";
import { StatusBadge } from "@/components/beldium/status-badge";
import { OpsMap } from "@/components/beldium/ops-map";
import { ReportIncidentDialog, StageActionButton, AssignmentWizard, TrackingControls } from "@/components/beldium/ops-dialogs";
import { Btn, FormField, IdLink, Modal, Stages, Timeline, WorkspaceTabs, fieldCls } from "@/components/beldium/ops-ui";
import {
  distanceKm,
  docState,
  driverBlock,
  driverOf,
  flowOf,
  fmt,
  fmtDate,
  movementStatus,
  naira,
  partyName,
  qualityGate,
  resolveIncident,
  site,
  siteName,
  txnOf,
  useOps,
  vehicleBlock,
  vehicleOf,
  type Movement,
} from "@/lib/ops-store";

export const Route = createFileRoute("/_ops/movements/$movementId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.movementId} | Movement | Beldium Logistics` },
      { name: "description", content: `Movement ${params.movementId}: timeline, tracking, cargo, resources, documents, compliance and transaction.` },
      { property: "og:title", content: `${params.movementId} | Beldium Logistics` },
      { property: "og:description", content: "Operational workspace for a Beldium logistics movement." },
    ],
  }),
  component: MovementWorkspace,
});

const TABS = ["Overview", "Timeline", "Tracking", "Cargo", "Driver", "Vehicle", "Documents", "Compliance", "Incidents", "Transaction"];

function MovementWorkspace() {
  const { movementId } = Route.useParams();
  const s = useOps();
  const m = s.movements.find((x) => x.id === movementId);
  const [tab, setTab] = useState("Overview");
  const [incident, setIncident] = useState(false);
  const [reassign, setReassign] = useState(false);

  if (!m) {
    return (
      <Panel title="Movement not found">
        <Link to="/active-movements" className="text-sm font-semibold text-colorLink">
          Back to Active Movements
        </Link>
      </Panel>
    );
  }
  const t = txnOf(s, m.txnId);
  const v = vehicleOf(s, m.vehicleId);
  const d = driverOf(s, m.driverId);
  const status = movementStatus(m);
  const openIncidents = s.incidents.filter((i) => i.movementId === m.id && i.status === "Open");

  return (
    <>
      <PageHeader title={`Movement ${m.id}`}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={status} />
          {m.exception ? (
            <Btn variant="danger" onClick={() => setTab("Incidents")}>
              Resolve Incident
            </Btn>
          ) : null}
          {m.stage !== "Completed" ? (
            <Btn variant="outline" onClick={() => setIncident(true)}>
              Report Incident
            </Btn>
          ) : null}
          {m.stage === "Scheduled" ? (
            <Btn variant="outline" onClick={() => setReassign(true)}>
              Reassign
            </Btn>
          ) : null}
          <StageActionButton movement={m} />
        </div>
      </PageHeader>

      <div className="beldium-panel mb-5 p-4">
        <Stages stages={flowOf(m)} current={m.stage} />
      </div>

      <WorkspaceTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "Overview" ? (
        <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <Panel title="Overview">
            <FieldGrid
              items={[
                { label: "Movement ID", value: m.id },
                { label: "RFQ ID", value: t?.rfqId },
                { label: "Transaction ID", value: <IdLink kind="transaction" id={m.txnId} /> },
                { label: "Request", value: <IdLink kind="request" id={m.requestId} /> },
                { label: "Batch", value: t?.batchId },
                { label: "Miner", value: partyName(s, t?.minerId) },
                { label: "Mining site", value: siteName(s, t?.mineId) },
                { label: "Buyer", value: partyName(s, t?.buyerId) },
                { label: "Mineral", value: t?.mineral },
                { label: "Quantity", value: `${m.quantity} ${m.unit}` },
                { label: "Origin", value: siteName(s, m.originId) },
                { label: "Destination", value: siteName(s, m.destinationId) },
                { label: "Movement type", value: m.movementType },
                { label: "Vehicle", value: m.vehicleId ? <IdLink kind="vehicle" id={m.vehicleId} /> : "-" },
                { label: "Driver", value: m.driverId ? <IdLink kind="driver" id={m.driverId} /> : "-" },
                { label: "Transport company", value: "Trans Sahel Haulage Ltd" },
                { label: "Current status", value: <StatusBadge value={status} /> },
                { label: "ETA", value: m.stage === "In Transit" ? `${m.etaMin} min` : "-" },
                { label: "Distance", value: `${distanceKm(s, m)} km` },
                { label: "Pickup", value: fmt(m.pickupAt) },
                { label: "Delivery deadline", value: fmt(m.deliverBy) },
                { label: "Quality status", value: <StatusBadge value={t?.quality ?? "-"} /> },
                { label: "Payment", value: <StatusBadge value={s.invoices.find((i) => i.movementId === m.id)?.status ?? "Not Invoiced"} /> },
              ]}
            />
          </Panel>
          <Panel title="Latest events">
            <Timeline events={m.timeline.slice(-6)} />
          </Panel>
        </div>
      ) : null}

      {tab === "Timeline" ? (
        <Panel title="Live Timeline">
          <Timeline events={m.timeline} />
        </Panel>
      ) : null}

      {tab === "Tracking" ? <Tracking m={m} /> : null}

      {tab === "Cargo" ? (
        <Panel title="Cargo">
          <FieldGrid
            items={[
              { label: "Material", value: t?.mineral },
              { label: "Batch", value: t?.batchId },
              { label: "Requested", value: `${m.quantity} ${m.unit}` },
              { label: m.kind === "Sample" ? "Collected" : "Loaded tonnage", value: m.loaded ? `${m.loaded} ${m.unit}` : "-" },
              { label: m.kind === "Sample" ? "Received at lab" : "Weighbridge quantity", value: m.received ? `${m.received} ${m.unit}` : "-" },
              { label: "Variance", value: m.loaded && m.received ? `${(m.loaded - m.received).toFixed(2)} ${m.unit}` : "-" },
              ...(m.kind === "Sample" ? [{ label: "Sample ID", value: m.sampleId ?? "-" }, { label: "Chain of custody", value: m.custodyId ?? "-" }] : []),
              { label: "Proof of delivery", value: m.podId ?? "-" },
              { label: "Quality result", value: t?.qualityResult ?? "-" },
            ]}
          />
        </Panel>
      ) : null}

      {tab === "Driver" ? (
        <Panel title="Driver">
          {d ? (
            <FieldGrid
              items={[
                { label: "Driver", value: <IdLink kind="driver" id={d.id} /> },
                { label: "Name", value: d.name },
                { label: "Phone", value: d.phone },
                { label: "Licence", value: `${d.licence} · ${d.licenceClass}` },
                { label: "Licence expiry", value: fmtDate(d.licenceExpiry) },
                { label: "Compliance", value: <StatusBadge value={driverBlock(s, d) ? "Restricted" : "Cleared"} /> },
                { label: "Training", value: d.training.join(", ") },
                { label: "Safety score", value: d.safetyScore },
              ]}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No driver assigned.</p>
          )}
        </Panel>
      ) : null}

      {tab === "Vehicle" ? (
        <Panel title="Vehicle">
          {v ? (
            <FieldGrid
              items={[
                { label: "Vehicle", value: <IdLink kind="vehicle" id={v.id} /> },
                { label: "Registration", value: v.registration },
                { label: "Type", value: v.type },
                { label: "Make", value: v.make },
                { label: "Capacity", value: `${v.capacity} t` },
                { label: "Tracker", value: <StatusBadge value={v.tracker} /> },
                { label: "Compliance", value: <StatusBadge value={vehicleBlock(s, v) ? "Restricted" : "Cleared"} /> },
                { label: "Next service", value: fmtDate(v.nextService) },
              ]}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No vehicle assigned.</p>
          )}
        </Panel>
      ) : null}

      {tab === "Documents" ? (
        <Panel title="Documents">
          <DocList
            ids={[
              { kind: "Movement", id: m.id },
              ...(v ? [{ kind: "Vehicle", id: v.id }] : []),
              ...(d ? [{ kind: "Driver", id: d.id }] : []),
            ]}
          />
        </Panel>
      ) : null}

      {tab === "Compliance" ? (
        <Panel title="Compliance">
          <ul className="space-y-2 text-sm">
            <Row label="Vehicle compliance" value={v ? (vehicleBlock(s, v) ?? "Cleared") : "Not assigned"} />
            <Row label="Driver compliance" value={d ? (driverBlock(s, d) ?? "Cleared") : "Not assigned"} />
            <Row label="Quality gate" value={qualityGate(s, m) ?? "Cleared"} />
            <Row label="Route adherence" value={m.deviated ? "Route deviation" : "On approved route"} />
            <Row label="Open incidents" value={openIncidents.length ? `${openIncidents.length} open` : "None"} />
            {site(s, m.destinationId)?.kind === "Port" ? <Row label="Export clearance" value="Managed by Export — pending customs" /> : null}
          </ul>
        </Panel>
      ) : null}

      {tab === "Incidents" ? <Incidents m={m} onReport={() => setIncident(true)} /> : null}

      {tab === "Transaction" && t ? (
        <Panel title={`Transaction ${t.id}`} action={<IdLink kind="transaction" id={t.id} />}>
          <FieldGrid
            items={[
              { label: "RFQ", value: t.rfqId },
              { label: "Supply commitment", value: t.commitmentId },
              { label: "Stage", value: <StatusBadge value={t.stage} /> },
              { label: "Buyer", value: partyName(s, t.buyerId) },
              { label: "Miner", value: partyName(s, t.minerId) },
              { label: "Contract value", value: naira(t.quantity * t.unitPrice) },
            ]}
          />
          <div className="mt-4 space-y-1.5">
            {[...t.timeline].reverse().slice(0, 10).map((e, i) => (
              <p key={i} className="text-sm">
                <span className="beldium-mono mr-2 font-semibold text-primary">{fmt(e.at)}</span>
                <span className="mr-2 text-muted-foreground">{e.sector}</span>
                {e.event}
              </p>
            ))}
          </div>
        </Panel>
      ) : null}

      {incident ? <ReportIncidentDialog open={incident} onClose={() => setIncident(false)} movementId={m.id} /> : null}
      {reassign ? <AssignmentWizard movement={m} open={reassign} onClose={() => setReassign(false)} /> : null}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
      <span className="font-medium">{label}</span>
      <StatusBadge value={value} />
    </li>
  );
}

function DocList({ ids }: { ids: { kind: string; id: string }[] }) {
  const s = useOps();
  const docs = s.documents.filter((d) => ids.some((x) => x.kind === d.relatedKind && x.id === d.relatedId));
  if (!docs.length) return <p className="text-sm text-muted-foreground">No documents.</p>;
  return (
    <ul className="divide-y divide-border">
      {docs.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
          <span>
            <span className="font-medium">{d.name}</span>
            <span className="beldium-small ml-2">
              {d.relatedKind} {d.relatedId} · expires {fmtDate(d.expiryDate)}
            </span>
          </span>
          <StatusBadge value={docState(d)} />
        </li>
      ))}
    </ul>
  );
}

function Tracking({ m }: { m: Movement }) {
  const s = useOps();
  const tracks = m.timeline.filter((e) => e.gps);
  return (
    <div className="space-y-5">
      <Panel title="Live Tracking" action={<StatusBadge value={movementStatus(m)} />}>
        <OpsMap focusId={m.id} compact />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Progress" value={`${m.stage === "In Transit" ? m.progress : ["At Destination", "Unloading", "Delivered", "Completed"].includes(m.stage) ? 100 : 0}%`} />
          <Metric label="ETA" value={m.stage === "In Transit" ? `${m.etaMin} min` : "-"} />
          <Metric label="Distance" value={`${distanceKm(s, m)} km`} />
          <Metric label="Tracker" value={vehicleOf(s, m.vehicleId)?.tracker ?? "-"} />
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-colorLink transition-all" style={{ width: `${m.stage === "In Transit" ? m.progress : ["At Destination", "Unloading", "Delivered", "Completed"].includes(m.stage) ? 100 : 0}%` }} />
        </div>
        {m.stage === "In Transit" && !m.exception ? (
          <div className="mt-4">
            <TrackingControls m={m} />
          </div>
        ) : null}
      </Panel>
      <Panel title="GPS Events">
        <Timeline events={tracks} />
      </Panel>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-primary">{value}</p>
    </div>
  );
}

function Incidents({ m, onReport }: { m: Movement; onReport: () => void }) {
  const s = useOps();
  const list = s.incidents.filter((i) => i.movementId === m.id);
  const [resolving, setResolving] = useState<string | null>(null);
  const [text, setText] = useState("");
  return (
    <Panel title="Incidents" action={m.stage !== "Completed" ? <Btn variant="outline" onClick={onReport}>Report Incident</Btn> : undefined}>
      {list.length === 0 ? <p className="text-sm text-muted-foreground">No incidents on this movement.</p> : null}
      <ul className="space-y-3">
        {list.map((i) => (
          <li key={i.id} className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-primary">
                {i.id} · {i.type}
              </span>
              <span className="flex gap-2">
                <StatusBadge value={i.severity} tone={i.severity === "High" || i.severity === "Critical" ? "danger" : "warning"} />
                <StatusBadge value={i.status} />
              </span>
            </div>
            <p className="mt-1 text-sm">{i.description}</p>
            <p className="beldium-small">
              {i.location} · {i.quantityAffected || "no quantity affected"} · {i.immediateAction} · {fmt(i.reportedAt)}
            </p>
            {i.resolution ? <p className="beldium-small mt-1">Resolution: {i.resolution}</p> : null}
            {i.status === "Open" ? (
              <Btn className="mt-2" variant="outline" onClick={() => setResolving(i.id)}>
                Resolve
              </Btn>
            ) : null}
          </li>
        ))}
      </ul>
      <Modal
        open={!!resolving}
        onClose={() => setResolving(null)}
        title={`Resolve ${resolving}`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setResolving(null)}>
              Cancel
            </Btn>
            <Btn
              disabled={!text.trim()}
              onClick={() => {
                resolveIncident(resolving!, text.trim());
                toast.success(`${resolving} resolved`);
                setResolving(null);
                setText("");
              }}
            >
              Resolve Incident
            </Btn>
          </>
        }
      >
        <FormField label="Resolution">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className={fieldCls} />
        </FormField>
      </Modal>
    </Panel>
  );
}
