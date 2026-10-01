import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  Field,
  FieldGrid,
  FormDialog,
  ResourceTable,
  errorMessage,
  fieldCls,
  fmtDateTime,
  pretty,
  type Column,
} from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listDrivers, listVehicles } from "@/lib/api/logistics";
import {
  MOVEMENT_TRANSITIONS,
  listDeliveries,
  listIncidents,
  type Delivery,
  type Incident,
  type IncidentSeverity,
  type Movement,
  type MovementStatus,
} from "@/lib/api/operations";
import {
  useAssignMovement,
  useMovement,
  useOpsList,
  useReportIncident,
  useSetMovementStatus,
} from "@/lib/api/operations-queries";

export const Route = createFileRoute("/portal/movements_/$movementId")({
  head: () => ({ meta: [{ title: "Movement - Beldium Logistics Hub" }] }),
  component: MovementPage,
});

const deliveryColumns: Column<Delivery>[] = [
  { header: "Delivery", cell: (d) => d.reference },
  { header: "Destination", cell: (d) => `${d.destination} (${pretty(d.destination_type)})` },
  { header: "Expected", cell: (d) => `${d.expected_quantity} ${d.quantity_unit}` },
  {
    header: "Received",
    cell: (d) => (d.received_quantity ? `${d.received_quantity} ${d.quantity_unit}` : "-"),
  },
  { header: "Status", cell: (d) => <StatusBadge value={pretty(d.status)} /> },
];

const incidentColumns: Column<Incident>[] = [
  { header: "Incident", cell: (i) => i.reference },
  { header: "Type", cell: (i) => i.incident_type },
  { header: "Severity", cell: (i) => <StatusBadge value={pretty(i.severity)} /> },
  { header: "Occurred", cell: (i) => fmtDateTime(i.occurred_at) },
  { header: "Status", cell: (i) => <StatusBadge value={i.status} /> },
];

function MovementPage() {
  const { movementId } = Route.useParams();
  const movement = useMovement(movementId);
  const deliveries = useOpsList("deliveries", listDeliveries, { movement: movementId });
  const incidents = useOpsList("incidents", listIncidents, { movement: movementId });
  const [dialog, setDialog] = useState<null | "assign" | "status" | "incident">(null);
  const m = movement.data;

  if (movement.isLoading) return <p className="text-sm text-muted-foreground">Loading movement…</p>;
  if (movement.error || !m)
    return (
      <p className="text-sm text-destructive">
        {errorMessage(movement.error, "Could not load this movement.")}
      </p>
    );

  const closed = m.status === "delivered" || m.status === "cancelled";
  const hasFix = m.last_latitude && m.last_longitude;

  return (
    <>
      <Link
        to="/portal/movements"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Movements
      </Link>
      <PageHeader
        title={`${m.reference} · ${m.mineral || m.movement_type}`}
        description={`${m.origin} → ${m.destination}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={pretty(m.status)} />
            {!closed ? (
              <>
                <Button variant="outline" onClick={() => setDialog("assign")}>
                  {m.vehicle || m.driver ? "Reassign" : "Assign vehicle & driver"}
                </Button>
                <Button onClick={() => setDialog("status")}>Update status</Button>
              </>
            ) : null}
            <Button variant="outline" onClick={() => setDialog("incident")}>
              Report incident
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <Panel title="Movement">
          <FieldGrid
            items={[
              ["Type", m.movement_type],
              ["Quantity", m.quantity_display],
              ["Batch", m.batch_id],
              ["Miner", m.miner],
              ["Buyer", m.buyer],
              ["Transaction", m.transaction_id],
              ["RFQ", m.rfq_id],
              ["Vehicle", m.vehicle_registration],
              ["Driver", m.driver_name],
              ["Pickup", fmtDateTime(m.pickup_at)],
              ["ETA", fmtDateTime(m.eta_at)],
              ["Delivered", fmtDateTime(m.delivered_at)],
            ]}
          />
          {m.request ? (
            <Link
              to="/portal/transport-requests/$requestId"
              params={{ requestId: m.request }}
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              View transport request
            </Link>
          ) : null}
        </Panel>

        <Panel title="Last position">
          {hasFix ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <MapPin className="size-4 text-accent" />
              <span>
                {m.last_latitude}, {m.last_longitude} · {fmtDateTime(m.last_gps_at)}
              </span>
              <a
                href={`https://www.openstreetmap.org/?mlat=${m.last_latitude}&mlon=${m.last_longitude}#map=12/${m.last_latitude}/${m.last_longitude}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Open map
              </a>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No GPS position reported yet. Add coordinates when updating the status.
            </p>
          )}
        </Panel>

        <Panel title="Deliveries">
          <ResourceTable
            columns={deliveryColumns}
            data={deliveries.data}
            isLoading={deliveries.isLoading}
            error={deliveries.error}
            empty="No delivery recorded for this movement yet."
          />
        </Panel>

        <Panel title="Incidents">
          <ResourceTable
            columns={incidentColumns}
            data={incidents.data}
            isLoading={incidents.isLoading}
            error={incidents.error}
            empty="No incidents on this movement."
          />
        </Panel>
      </div>

      {dialog === "assign" ? <AssignDialog movement={m} onClose={() => setDialog(null)} /> : null}
      {dialog === "status" ? <StatusDialog movement={m} onClose={() => setDialog(null)} /> : null}
      {dialog === "incident" ? (
        <IncidentDialog movement={m} onClose={() => setDialog(null)} />
      ) : null}
    </>
  );
}

function AssignDialog({ movement, onClose }: { movement: Movement; onClose: () => void }) {
  const vehicles = useOpsList("vehicles", listVehicles, {
    company: movement.company,
    is_active: true,
    page_size: 100,
  });
  const drivers = useOpsList("drivers", listDrivers, {
    company: movement.company,
    is_active: true,
    page_size: 100,
  });
  const assign = useAssignMovement();
  const [vehicle, setVehicle] = useState(movement.vehicle ?? "");
  const [driver, setDriver] = useState(movement.driver ?? "");
  const [error, setError] = useState("");

  const eligible = (status: string) => status !== "expired";

  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Assign ${movement.reference}`}
      submitLabel="Assign"
      busy={assign.isPending}
      error={error}
      onSubmit={() => {
        if (!vehicle && !driver) return setError("Choose a vehicle, a driver, or both.");
        assign.mutate(
          { id: movement.id, vehicle: vehicle || undefined, driver: driver || undefined },
          {
            onSuccess: () => {
              toast.success(`${movement.reference} assigned`);
              onClose();
            },
            onError: (e) => setError(errorMessage(e)),
          },
        );
      }}
    >
      <Field label="Vehicle">
        <select className={fieldCls} value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
          <option value="">Keep current / none</option>
          {(vehicles.data?.results ?? []).map((v) => (
            <option key={v.id} value={v.id} disabled={!eligible(v.credential_status)}>
              {v.registration} · {v.vehicle_type} · {v.capacity} {v.capacity_unit}
              {eligible(v.credential_status) ? "" : " (credentials expired)"}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Driver">
        <select className={fieldCls} value={driver} onChange={(e) => setDriver(e.target.value)}>
          <option value="">Keep current / none</option>
          {(drivers.data?.results ?? []).map((d) => (
            <option key={d.id} value={d.id} disabled={!eligible(d.credential_status)}>
              {d.full_name} · class {d.licence_class}
              {eligible(d.credential_status) ? "" : " (credentials expired)"}
            </option>
          ))}
        </select>
      </Field>
      <p className="text-xs text-muted-foreground">
        Vehicles and drivers with expired insurance, roadworthiness, licence or medical can't be
        assigned.
      </p>
    </FormDialog>
  );
}

function StatusDialog({ movement, onClose }: { movement: Movement; onClose: () => void }) {
  const setStatus = useSetMovementStatus();
  // Only the moves the backend allows from the current status.
  const options = MOVEMENT_TRANSITIONS[movement.status];
  const [status, setStatusValue] = useState<MovementStatus | "">(options[0] ?? "");
  // datetime-local works in the viewer's local time; the API speaks UTC.
  const initialEta = toLocalInput(movement.eta_at);
  const [eta, setEta] = useState(initialEta);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function useCurrentLocation() {
    if (!navigator.geolocation) return setError("This browser can't share its location.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
      },
      () => setError("Location permission was denied."),
    );
  }

  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Update ${movement.reference}`}
      submitLabel="Save status"
      busy={setStatus.isPending}
      error={error}
      onSubmit={() => {
        if (!status) return setError("This movement is closed; its status can't change.");
        if ((latitude && !longitude) || (!latitude && longitude))
          return setError("Enter both latitude and longitude, or neither.");
        setStatus.mutate(
          {
            id: movement.id,
            status,
            ...(eta && eta !== initialEta ? { eta_at: new Date(eta).toISOString() } : {}),
            ...(latitude ? { latitude, longitude } : {}),
            ...(note.trim() ? { note: note.trim() } : {}),
          },
          {
            onSuccess: () => {
              toast.success(
                status === "arrived" || status === "delivered"
                  ? `${movement.reference}: ${pretty(status)}. Confirm the received quantity under Deliveries to complete handover.`
                  : `${movement.reference}: ${pretty(status)}`,
              );
              onClose();
            },
            onError: (e) => setError(errorMessage(e)),
          },
        );
      }}
    >
      <Field label="Status">
        <select
          className={fieldCls}
          value={status}
          onChange={(e) => setStatusValue(e.target.value as MovementStatus)}
        >
          {options.map((s) => (
            <option key={s} value={s}>
              {pretty(s)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="ETA (optional)">
        <Input type="datetime-local" value={eta} onChange={(e) => setEta(e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Latitude">
          <Input
            inputMode="decimal"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="10.5264"
          />
        </Field>
        <Field label="Longitude">
          <Input
            inputMode="decimal"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="7.4381"
          />
        </Field>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={useCurrentLocation}>
        <MapPin /> Use my current location
      </Button>
      <Field label="Note (added to the activity feed)">
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
    </FormDialog>
  );
}

/** ISO timestamp to the `YYYY-MM-DDTHH:mm` a datetime-local input expects, in local time. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const INCIDENT_TYPES = [
  "Vehicle breakdown",
  "Accident",
  "Delay",
  "Route deviation",
  "Theft / security",
  "Quantity variance",
  "Spillage / loss",
  "Seal tampering",
  "Documentation issue",
  "Other",
];

function IncidentDialog({ movement, onClose }: { movement: Movement; onClose: () => void }) {
  const report = useReportIncident();
  const [form, setForm] = useState({
    incident_type: INCIDENT_TYPES[0]!,
    severity: "medium" as IncidentSeverity,
    location: "",
    description: "",
    immediate_action: "",
  });
  const [error, setError] = useState("");

  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Report incident on ${movement.reference}`}
      submitLabel="Report incident"
      busy={report.isPending}
      error={error}
      onSubmit={() => {
        if (!form.description.trim()) return setError("Describe what happened.");
        report.mutate(
          {
            company: movement.company,
            movement: movement.id,
            occurred_at: new Date().toISOString(),
            ...form,
          },
          {
            onSuccess: (incident) => {
              toast.success(`${incident.reference} reported`);
              onClose();
            },
            onError: (e) => setError(errorMessage(e)),
          },
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <select
            className={fieldCls}
            value={form.incident_type}
            onChange={(e) => setForm({ ...form, incident_type: e.target.value })}
          >
            {INCIDENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Severity">
          <select
            className={fieldCls}
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value as IncidentSeverity })}
          >
            {(["low", "medium", "high", "critical"] as const).map((s) => (
              <option key={s} value={s}>
                {pretty(s)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Location">
        <Input
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
      </Field>
      <Field label="What happened">
        <Textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </Field>
      <Field label="Immediate action taken">
        <Textarea
          rows={2}
          value={form.immediate_action}
          onChange={(e) => setForm({ ...form, immediate_action: e.target.value })}
        />
      </Field>
    </FormDialog>
  );
}
