import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Button } from "@/components/ui/button";
import { useIndependent } from "@/lib/independent/store";
import { TripStepper } from "@/components/beldium/trip-stepper";
import {
  isActiveTrip,
  nextStage,
  type TransportAssignment,
  type TripEvent,
} from "@/lib/trips/model";

import { CheckField, ErrorText, KeyValues, TextField } from "./form";

export function TripDetail({ tripId }: { tripId: string }) {
  const { workspace, recordEvent } = useIndependent();
  const t = workspace.trips.find((x) => x.id === tripId);
  const blank = { location: "", notes: "", evidence: "", loaded: "", weighbridge: "", seal: "" };
  const [f, setF] = React.useState(blank);
  const [error, setError] = React.useState("");
  const [delivering, setDelivering] = React.useState(false);
  const set = (k: keyof typeof blank) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  if (!t) {
    return (
      <>
        <PageHeader title="Trip unavailable" description="This trip is not in your workspace." />
        <Button asChild variant="outline">
          <Link to="/independent/trips">Back to my trips</Link>
        </Button>
      </>
    );
  }

  const next = nextStage(t.status);
  const interrupted = t.status === "Exception" || t.status === "Disputed";
  const record = (type: TripEvent) => {
    try {
      recordEvent(t.id, {
        type,
        location: f.location,
        notes: f.notes,
        evidence: f.evidence,
        loaded: f.loaded ? Number(f.loaded) : undefined,
        weighbridge: f.weighbridge,
        seal: f.seal,
      });
      setError("");
      setF((x) => ({ ...x, notes: "", evidence: "" }));
      toast.success(`${t.id}: ${type} recorded`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link to="/independent/trips">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> My trips
        </Link>
      </Button>
      <PageHeader
        title={t.id}
        description={`${t.cargo.mineral} · ${t.pickup} → ${t.destination}`}
        actions={<StatusBadge value={t.status} />}
      />
      <div className="space-y-4">
        <Panel title="Lifecycle">
          <TripStepper trip={t} />
          {interrupted ? (
            <p className="mt-3 text-sm text-destructive">
              {t.status} recorded. Resume returns the trip to “{t.resumeStatus}”.
            </p>
          ) : null}
        </Panel>

        <Panel title="Assignment">
          <KeyValues
            items={[
              ["Originating sector / RFQ", `${t.sector} / ${t.rfq}`],
              ["Vehicle", t.vehicleLabel],
              ["Driver", t.driverId],
              ["Cargo reference", t.cargo.reference],
              ["Declared quantity", `${t.cargo.quantity} ${t.cargo.unit}`],
              [
                "Loaded quantity",
                t.cargo.loadedQuantity === undefined
                  ? "Not recorded"
                  : `${t.cargo.loadedQuantity} ${t.cargo.unit}`,
              ],
              ["Loading weighbridge", t.cargo.weighbridge || "Not recorded"],
              ["Cargo seal", t.cargo.seal || "Not recorded"],
              ["Pickup organisation", t.pickupOrganization],
              ["Receiving organisation", t.deliveryOrganization],
            ]}
          />
        </Panel>

        {isActiveTrip(t) && t.status !== "Delivered" ? (
          <Panel
            title="Record an event"
            description="Milestones are recorded in order with a timestamp and never edited; corrections are added as new entries."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Event location" value={f.location} onChange={set("location")} />
              <TextField
                label="Supporting evidence filename"
                required={false}
                value={f.evidence}
                onChange={set("evidence")}
              />
              <div className="sm:col-span-2">
                <TextField
                  label="Notes"
                  type="textarea"
                  required={false}
                  placeholder="Required for exceptions, disputes and corrections"
                  value={f.notes}
                  onChange={set("notes")}
                />
              </div>
              {next === "Loaded" && !interrupted ? (
                <>
                  <TextField
                    label="Loaded quantity"
                    type="number"
                    value={f.loaded}
                    onChange={set("loaded")}
                  />
                  <TextField
                    label="Loading weighbridge reference"
                    required={false}
                    value={f.weighbridge}
                    onChange={set("weighbridge")}
                  />
                  <TextField
                    label="Cargo seal reference"
                    required={false}
                    value={f.seal}
                    onChange={set("seal")}
                  />
                </>
              ) : null}
            </div>
            <div className="mt-4">
              <ErrorText text={error} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {interrupted ? (
                <Button onClick={() => record("Resume")}>Resume “{t.resumeStatus}”</Button>
              ) : next === "Delivered" ? (
                <Button onClick={() => setDelivering(true)}>
                  Record proof of delivery <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : next && next !== "Closed" ? (
                <Button onClick={() => record(next)}>
                  Record {next} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : null}
              {!interrupted ? (
                <>
                  <Button variant="outline" onClick={() => record("Exception")}>
                    Report exception
                  </Button>
                  <Button variant="outline" onClick={() => record("Disputed")}>
                    Record dispute
                  </Button>
                </>
              ) : null}
              <Button variant="outline" onClick={() => record("Correction")}>
                Append correction
              </Button>
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => record("Cancelled")}
              >
                Cancel trip
              </Button>
            </div>
          </Panel>
        ) : null}

        {t.status === "Delivered" ? (
          <Panel title="Awaiting delivery review">
            <p className="text-sm text-muted-foreground">
              Transport is complete. The trip closes only after a Beldium compliance officer accepts
              the delivery evidence. Your declaration is not independent confirmation by the
              receiving party.
            </p>
          </Panel>
        ) : null}

        {delivering && t.status === "Arrived at Destination" ? (
          <Panel title="Proof of delivery">
            <DeliveryForm trip={t} onDone={() => setDelivering(false)} />
          </Panel>
        ) : null}

        <Panel title="Movement and custody timeline">
          <ol className="space-y-4 border-l-2 border-primary/20 pl-5">
            {t.milestones.map((m) => (
              <li key={m.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm">{m.type}</strong>
                  <span className="text-xs text-muted-foreground">
                    {new Date(m.at).toLocaleString("en-GB")}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {m.actor} · {m.location}
                </p>
                {m.notes ? <p className="mt-1 text-sm">{m.notes}</p> : null}
                {m.evidence ? (
                  <p className="mt-1 text-xs text-primary">Evidence: {m.evidence}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </Panel>

        {t.exceptions.length ? (
          <Panel title="Operational exceptions">
            <ul className="space-y-3">
              {t.exceptions.map((e) => (
                <li key={e.id} className="border-l-2 border-destructive pl-4">
                  <p className="text-sm font-medium">{e.type}</p>
                  <p className="text-sm">{e.notes}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.at).toLocaleString("en-GB")} · {e.actor}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        <Panel title="Delivery evidence">
          {t.deliveries.length ? (
            t.deliveries.map((d) => (
              <div key={d.id} className="space-y-3">
                <StatusBadge value={d.status} />
                <KeyValues
                  items={[
                    ["Delivered quantity", `${d.quantity} ${d.unit}`],
                    [
                      "Quantity difference",
                      `${d.quantity - (t.cargo.loadedQuantity ?? t.cargo.quantity)} ${d.unit} · ${d.discrepancy || "None declared"}`,
                    ],
                    ["Receiving party", `${d.receiver} · ${d.representative}`],
                    ["Arrival", new Date(d.arrival).toLocaleString("en-GB")],
                    ["Condition", d.condition],
                    ["Proof of delivery filename", d.filename],
                    ["Delivery weighbridge", d.weighbridge || "Not declared"],
                    [
                      "Receiver acknowledgment",
                      d.acknowledged ? "Declared by you" : "Not declared",
                    ],
                  ]}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No delivery evidence recorded.</p>
          )}
        </Panel>
      </div>
    </>
  );
}

function DeliveryForm({ trip, onDone }: { trip: TransportAssignment; onDone: () => void }) {
  const { deliver } = useIndependent();
  const blank = {
    receiver: trip.deliveryOrganization,
    representative: "",
    arrival: "",
    quantity: "",
    condition: "",
    weighbridge: "",
    filename: "",
    discrepancy: "",
  };
  const [f, setF] = React.useState(blank);
  const [ack, setAck] = React.useState(false);
  const [error, setError] = React.useState("");
  const set = (k: keyof typeof blank) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          deliver(trip.id, { ...f, quantity: Number(f.quantity), acknowledged: ack });
          toast.success(`${trip.id}: delivery evidence submitted`);
          onDone();
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <p className="text-sm text-muted-foreground">
        Expected {trip.cargo.loadedQuantity ?? trip.cargo.quantity} {trip.cargo.unit} at{" "}
        {trip.destination}.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Receiving organisation" value={f.receiver} onChange={set("receiver")} />
        <TextField
          label="Receiving representative"
          value={f.representative}
          onChange={set("representative")}
        />
        <TextField
          label="Arrival date and time"
          type="datetime-local"
          value={f.arrival}
          onChange={set("arrival")}
        />
        <TextField
          label={`Delivered quantity (${trip.cargo.unit})`}
          type="number"
          value={f.quantity}
          onChange={set("quantity")}
        />
        <TextField label="Delivery condition" value={f.condition} onChange={set("condition")} />
        <TextField
          label="Delivery weighbridge reference"
          required={false}
          value={f.weighbridge}
          onChange={set("weighbridge")}
        />
        <TextField
          label="Proof-of-delivery filename"
          value={f.filename}
          onChange={set("filename")}
        />
        <TextField
          label="Discrepancy declaration (required if quantities differ)"
          type="textarea"
          required={false}
          value={f.discrepancy}
          onChange={set("discrepancy")}
        />
      </div>
      <CheckField
        label="The receiving party acknowledged this delivery (declared by me, not independently verified)"
        checked={ack}
        onChange={setAck}
      />
      <ErrorText text={error} />
      <Button type="submit">Submit delivery evidence</Button>
    </form>
  );
}
