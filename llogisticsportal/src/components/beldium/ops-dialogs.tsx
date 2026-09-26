import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  assignResources,
  driverCandidates,
  incidentTypes,
  primaryAction,
  qualityGate,
  reportIncident,
  runAction,
  severities,
  siteName,
  txnOf,
  useOps,
  vehicleCandidates,
  type Movement,
  type Severity,
} from "@/lib/ops-store";
import { Btn, FormField, Modal, fieldCls } from "./ops-ui";

/* ------------------------------------------------------------ assignment wizard */

const steps = ["Select Vehicle", "Select Driver", "Validate Compliance", "Schedule Pickup"];

export function AssignmentWizard({ movement, open, onClose }: { movement: Movement; open: boolean; onClose: () => void }) {
  const s = useOps();
  const [step, setStep] = useState(0);
  const [vid, setVid] = useState(movement.vehicleId ?? "");
  const [did, setDid] = useState(movement.driverId ?? "");
  const defaultPickup = new Date(Date.now() + 2 * 3600_000);
  defaultPickup.setMinutes(0, 0, 0);
  const [pickup, setPickup] = useState(toLocalInput(defaultPickup));

  const vc = vehicleCandidates(s, movement);
  const dc = driverCandidates(s, movement);
  const eligibleV = vc.filter((c) => !c.reason);
  const blockedV = vc.filter((c) => c.reason);
  const eligibleD = dc.filter((c) => !c.reason);
  const blockedD = dc.filter((c) => c.reason);
  const v = vc.find((c) => c.v.id === vid);
  const d = dc.find((c) => c.d.id === did);

  const close = () => {
    setStep(0);
    onClose();
  };

  const confirm = () => {
    const err = assignResources(movement.id, vid, did, new Date(pickup).toISOString());
    if (err) {
      toast.error(err);
      return;
    }
    toast.success(`${movement.id} scheduled`);
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      wide
      title={`Assign resources: ${movement.id}`}
      footer={
        <>
          {step > 0 ? (
            <Btn variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Btn>
          ) : (
            <Btn variant="outline" onClick={close}>
              Cancel
            </Btn>
          )}
          {step < 3 ? (
            <Btn
              onClick={() => setStep(step + 1)}
              disabled={(step === 0 && (!v || !!v.reason)) || (step === 1 && (!d || !!d.reason)) || (step === 2 && (!!v?.reason || !!d?.reason))}
            >
              Continue
            </Btn>
          ) : (
            <Btn onClick={confirm}>Confirm Assignment</Btn>
          )}
        </>
      }
    >
      <ol className="mb-3 flex flex-wrap gap-1.5">
        {steps.map((label, i) => (
          <li key={label} className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", i === step ? "border-primary bg-primary text-primary-foreground" : i < step ? "border-success/40 text-success" : "border-border text-muted-foreground")}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>
      <p className="beldium-small mb-3">
        {movement.movementType} · {siteName(s, movement.originId)} → {siteName(s, movement.destinationId)} · {movement.quantity} {movement.unit}
      </p>

      {step === 0 ? (
        <Pick
          items={eligibleV.map((c) => ({ id: c.v.id, title: `${c.v.id} · ${c.v.registration}`, sub: `${c.v.type} · ${c.v.capacity} t · ${c.v.make} · tracker ${c.v.tracker}` }))}
          value={vid}
          onChange={setVid}
          blocked={blockedV.map((c) => ({ id: c.v.id, title: `${c.v.id} · ${c.v.registration}`, reason: c.reason! }))}
          emptyText="No eligible vehicle available"
        />
      ) : null}
      {step === 1 ? (
        <Pick
          items={eligibleD.map((c) => ({ id: c.d.id, title: c.d.name, sub: `${c.d.licenceClass} · safety ${c.d.safetyScore} · ${c.d.training.join(", ")}` }))}
          value={did}
          onChange={setDid}
          blocked={blockedD.map((c) => ({ id: c.d.id, title: c.d.name, reason: c.reason! }))}
          emptyText="No eligible driver available"
        />
      ) : null}
      {step === 2 ? (
        <ul className="space-y-2 text-sm">
          <Check ok={!v?.reason} label={`Vehicle ${v?.v.registration}: compliance cleared, inspection & insurance documents valid`} />
          <Check ok={!v?.reason} label="Vehicle not committed to a conflicting active job" />
          <Check ok={!d?.reason} label={`Driver ${d?.d.name}: licence valid until ${d?.d.licenceExpiry}`} />
          <Check ok={!d?.reason} label="Driver compliance cleared and on duty" />
          {movement.kind === "Bulk" ? <Check ok={(v?.v.capacity ?? 0) >= Math.min(movement.quantity, 30)} label={`Capacity ${v?.v.capacity} t for ${movement.quantity} t`} /> : null}
        </ul>
      ) : null}
      {step === 3 ? (
        <div className="space-y-3">
          <FormField label="Pickup date & time">
            <input type="datetime-local" value={pickup} onChange={(e) => setPickup(e.target.value)} className={fieldCls} />
          </FormField>
          <p className="text-sm">
            <span className="font-semibold">{v?.v.registration}</span> · <span className="font-semibold">{d?.d.name}</span> · deliver by {new Date(movement.deliverBy).toLocaleString("en-GB")}
          </p>
        </div>
      ) : null}
    </Modal>
  );
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? <CheckCircle2 className="mt-0.5 size-4 text-success" /> : <XCircle className="mt-0.5 size-4 text-destructive" />}
      {label}
    </li>
  );
}

function Pick({
  items,
  value,
  onChange,
  blocked,
  emptyText,
}: {
  items: { id: string; title: string; sub: string }[];
  value: string;
  onChange: (id: string) => void;
  blocked: { id: string; title: string; reason: string }[];
  emptyText: string;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? <p className="text-sm text-destructive">{emptyText}</p> : null}
      <div className="grid gap-2">
        {items.map((i) => (
          <button
            key={i.id}
            type="button"
            onClick={() => onChange(i.id)}
            className={cn("rounded-lg border px-3 py-2 text-left transition-colors", value === i.id ? "border-primary bg-secondary" : "border-border hover:border-primary")}
          >
            <span className="block text-sm font-semibold text-primary">{i.title}</span>
            <span className="beldium-small">{i.sub}</span>
          </button>
        ))}
      </div>
      {blocked.length ? (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Not eligible</p>
          <ul className="space-y-1">
            {blocked.map((b) => (
              <li key={b.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground">
                <span>{b.title}</span>
                <span className="font-semibold text-destructive">{b.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ primary stage action */

export function StageActionButton({ movement, size = "md" }: { movement: Movement; size?: "sm" | "md" }) {
  const s = useOps();
  const [assign, setAssign] = useState(false);
  const [qty, setQty] = useState<null | "tonnage" | "weighbridge">(null);
  const [value, setValue] = useState("");
  const act = primaryAction(s, movement);
  if (!act) return null;
  const gate = act.id === "load" ? qualityGate(s, movement) : null;

  const run = () => {
    if (act.input === "assign") return setAssign(true);
    if (act.input === "tonnage" || act.input === "weighbridge") {
      setValue(String(act.input === "tonnage" ? movement.quantity : (movement.loaded ?? movement.quantity)));
      return setQty(act.input);
    }
    const err = runAction(movement.id, act.id);
    if (err) toast.error(err);
    else toast.success(`${movement.id}: ${act.label}`);
  };

  return (
    <>
      <Btn onClick={run} disabled={!!gate} title={gate ?? undefined} size={size === "sm" ? "sm" : "default"}>
        {act.label}
      </Btn>
      {gate && size === "md" ? <span className="text-xs font-semibold text-destructive">{gate}</span> : null}
      {assign ? <AssignmentWizard movement={movement} open={assign} onClose={() => setAssign(false)} /> : null}
      <Modal
        open={!!qty}
        onClose={() => setQty(null)}
        title={qty === "tonnage" ? "Enter loaded tonnage" : "Record weighbridge quantity"}
        footer={
          <>
            <Btn variant="outline" onClick={() => setQty(null)}>
              Cancel
            </Btn>
            <Btn
              disabled={!(Number(value) > 0)}
              onClick={() => {
                runAction(movement.id, qty === "tonnage" ? "pickup" : "weigh", Number(value));
                toast.success(qty === "tonnage" ? "Pickup confirmed" : "Weighbridge quantity recorded");
                setQty(null);
              }}
            >
              {qty === "tonnage" ? "Confirm Pickup" : "Record Quantity"}
            </Btn>
          </>
        }
      >
        <FormField label={`Quantity (${movement.unit})`}>
          <input type="number" step="0.1" min="0" value={value} onChange={(e) => setValue(e.target.value)} className={fieldCls} />
        </FormField>
        <p className="beldium-small">
          Requested {movement.quantity} {movement.unit}
          {movement.loaded ? ` · loaded ${movement.loaded} ${movement.unit}` : ""}
        </p>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------ incident report */

export function ReportIncidentDialog({ open, onClose, movementId }: { open: boolean; onClose: () => void; movementId?: string }) {
  const s = useOps();
  const active = s.movements.filter((m) => m.stage !== "Completed");
  const [f, setF] = useState({
    movementId: movementId ?? active[0]?.id ?? "",
    type: "Vehicle Breakdown",
    severity: "Medium" as Severity,
    description: "",
    location: "",
    material: "",
    quantityAffected: "",
    evidence: "",
    immediateAction: "",
  });
  const mv = s.movements.find((m) => m.id === f.movementId);
  const material = f.material || (mv ? (txnOf(s, mv.txnId)?.mineral ?? "") : "");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const valid = f.movementId && f.description.trim() && f.location.trim() && f.immediateAction.trim();

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Report Incident"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            variant="danger"
            disabled={!valid}
            onClick={() => {
              const id = reportIncident({ ...f, material });
              toast.success(`Incident ${id} reported`);
              onClose();
            }}
          >
            Submit Incident
          </Btn>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Movement">
          <select value={f.movementId} onChange={set("movementId")} disabled={!!movementId} className={fieldCls}>
            {active.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} · {m.movementType}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Incident type">
          <select value={f.type} onChange={set("type")} className={fieldCls}>
            {incidentTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Severity">
          <select value={f.severity} onChange={set("severity")} className={fieldCls}>
            {severities.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Location">
          <input value={f.location} onChange={set("location")} className={fieldCls} placeholder="e.g. Kachia junction, Kaduna" />
        </FormField>
        <FormField label="Material affected">
          <input value={material} onChange={set("material")} className={fieldCls} />
        </FormField>
        <FormField label="Quantity affected">
          <input value={f.quantityAffected} onChange={set("quantityAffected")} className={fieldCls} placeholder="e.g. 2 t" />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Description">
            <textarea value={f.description} onChange={set("description")} rows={3} className={fieldCls} />
          </FormField>
        </div>
        <FormField label="Evidence">
          <input value={f.evidence} onChange={set("evidence")} className={fieldCls} placeholder="Photo set, police report no." />
        </FormField>
        <FormField label="Immediate action">
          <input value={f.immediateAction} onChange={set("immediateAction")} className={fieldCls} />
        </FormField>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------ tracking simulation */

export function TrackingControls({ m }: { m: Movement }) {
  const act = (a: string, msg: string) => {
    runAction(m.id, a);
    toast.success(msg);
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Btn variant="outline" onClick={() => act("advance", "Position updated")} disabled={m.progress >= 95}>
        Advance Journey
      </Btn>
      <Btn variant="outline" onClick={() => act("stop", "Stop recorded")} disabled={m.stopped}>
        Simulate Stop
      </Btn>
      {m.delayed ? (
        <Btn variant="outline" onClick={() => act("clearDelay", "Delay cleared")}>
          Clear Delay
        </Btn>
      ) : (
        <Btn variant="outline" onClick={() => act("delay", "Delay recorded")}>
          Simulate Delay
        </Btn>
      )}
      {m.deviated ? (
        <Btn variant="outline" onClick={() => act("rejoin", "Back on route")}>
          Rejoin Route
        </Btn>
      ) : (
        <Btn variant="outline" onClick={() => act("deviate", "Deviation recorded")}>
          Simulate Route Deviation
        </Btn>
      )}
      <Btn onClick={() => act("arriveDest", "Arrived at destination")} disabled={m.exception}>
        Arrive Destination
      </Btn>
    </div>
  );
}

