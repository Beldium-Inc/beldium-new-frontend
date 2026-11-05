import * as React from "react";
import { can, canReview } from "@/lib/beldium/compliance";
import { VerificationPanel } from "@/components/beldium/verification";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, FlaskConical, PackageCheck, ScrollText } from "lucide-react";
import { AppShell } from "@/components/beldium/shell";
import { EmptyState, Field, PageHeader, Pill, SectionTitle, StatusPill, Surface } from "@/components/beldium/ui";
import { Btn, FieldError, Label, inputClass } from "@/components/beldium/auth";
import { useBeldium } from "@/lib/beldium/store";
import { methods } from "@/lib/beldium/onboarding";
import { cn } from "@/lib/utils";
import type { AssignmentStatus, QualityAssignment, ReviewDecision } from "@/lib/beldium/types";

export const Route = createFileRoute("/assignments/$id")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Assignment detail — Beldium" },
      {
        name: "description",
        content:
          "Assignment detail with sampling events, append-only custody timeline, laboratory evidence references and quality review.",
      },
      { property: "og:title", content: "Assignment detail — Beldium" },
      {
        property: "og:description",
        content: "Sampling, custody, laboratory evidence and quality review for one assignment.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <AssignmentDetail />
    </AppShell>
  ),
});

const flow: AssignmentStatus[] = [
  "requested",
  "accepted",
  "scheduled",
  "fieldwork",
  "samples_collected",
  "lab_processing",
  "quality_review",
  "completed",
];

const reviewActions: { decision: ReviewDecision; label: string }[] = [
  { decision: "evidence_accepted", label: "Accept evidence for review" },
  { decision: "info_requested", label: "Request additional information" },
  { decision: "discrepancy_recorded", label: "Record discrepancy" },
  { decision: "returned_for_correction", label: "Return for correction" },
  { decision: "demo_verified", label: "Record demo verification" },
  { decision: "demo_blocked", label: "Block (demo)" },
];

function AssignmentDetail() {
  const { id } = Route.useParams();
  const { state, user, recordVerification, setAssignmentStatus } = useBeldium();
  const a = state.assignments.find((x) => x.id === id);
  if (!a) {
    return (
      <Surface>
        <EmptyState title="Assignment not found" hint="It may have been removed in a demo reset." />
        <div className="px-6 pb-6">
          <Link to="/assignments" className="text-sm font-medium text-link hover:underline">
            ← Back to assignments
          </Link>
        </div>
      </Surface>
    );
  }

  const role = user?.role;
  const isProvider = role === "partner" && can(user, "operate", a.providerOrg);
  const isOperator = canReview(user, a.providerOrg);
  const readOnly = role === "regulator" || role === "buyer";
  const stepIdx = flow.indexOf(a.status);
  const exceptional = a.status === "exception" || a.status === "cancelled";

  return (
    <>
      <PageHeader
        eyebrow={a.sector}
        title={a.ref}
        description={`${a.service} — ${a.mineral} for ${a.sourceOrg}`}
        actions={
          <>
            <StatusPill value={a.status} />
            <Link to="/assignments" className="inline-flex items-center gap-1.5 text-sm font-medium text-link hover:underline">
              <ArrowLeft className="size-4" /> All assignments
            </Link>
          </>
        }
      />

      <VerificationPanel subject={a.providerOrg} records={a.verifications ?? []} editable={isOperator} onRecord={(input) => recordVerification("assignment", a.id, input)} />
      <Surface className="my-6 px-6 py-5">
        {exceptional ? (
          <Pill tone={a.status === "exception" ? "danger" : "neutral"}>
            This assignment is {a.status}. The milestone flow is paused.
          </Pill>
        ) : (
          <ol className="flex flex-wrap items-center gap-y-3">
            {flow.map((s, i) => {
              const done = i < stepIdx;
              const current = i === stepIdx;
              return (
                <li key={s} className="flex items-center">
                  <span
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                      current
                        ? "border-navy bg-navy text-navy-foreground"
                        : done
                          ? "border-transparent bg-success text-success-foreground"
                          : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-3" /> : null}
                    {s.replace(/_/g, " ")}
                  </span>
                  {i < flow.length - 1 ? <span className="mx-1.5 h-px w-4 bg-border" /> : null}
                </li>
              );
            })}
          </ol>
        )}
      </Surface>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Surface>
            <SectionTitle title="Assignment details" hint={`${a.transactionRef} · declared ${a.quantityKg.toLocaleString()} kg`} />
            <dl className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <Field label="Originating sector" value={a.sector} />
              <Field label="Transaction / RFQ" value={a.transactionRef} />
              <Field label="Mineral" value={a.mineral} />
              <Field label="Source organisation" value={a.sourceOrg} />
              <Field label="Mine / material location" value={a.location} />
              <Field label="Declared quantity" value={`${a.quantityKg.toLocaleString()} kg`} />
              <Field label="Service provider" value={a.providerOrg} />
              <Field label="Assigned personnel" value={a.personnel.join(", ") || "—"} />
              <Field label="Target date" value={a.targetDate} />
              <Field label="Required activity" value={a.activity} />
            </dl>
            {isProvider && !exceptional && a.status !== "completed" ? (
              <div className="flex flex-wrap gap-2 border-t border-border px-6 py-4">
                {a.status === "requested" ? (
                  <Btn onClick={() => setAssignmentStatus(a.id, "accepted")}>Accept assignment</Btn>
                ) : null}
                {a.status === "accepted" ? (
                  <Btn onClick={() => setAssignmentStatus(a.id, "scheduled")}>Mark scheduled</Btn>
                ) : null}
                {a.status === "scheduled" ? (
                  <Btn onClick={() => setAssignmentStatus(a.id, "fieldwork")}>Start fieldwork</Btn>
                ) : null}
                {a.status === "samples_collected" ? (
                  <Btn variant="outline" onClick={() => setAssignmentStatus(a.id, "lab_processing")}>
                    Hand to laboratory
                  </Btn>
                ) : null}
                {a.status === "lab_processing" ? (
                  <Btn variant="outline" onClick={() => setAssignmentStatus(a.id, "quality_review")}>
                    Submit evidence for review
                  </Btn>
                ) : null}
              </div>
            ) : null}
          </Surface>

          <SamplingSection a={a} canEdit={isProvider && !exceptional && a.status !== "completed"} />
          <CustodySection a={a} canEdit={isProvider && !exceptional && a.status !== "completed"} />
          <LabSection a={a} canEdit={isProvider && !exceptional && a.status !== "completed"} />
        </div>

        <div className="space-y-6">
          {isOperator ? <ReviewPanel a={a} /> : null}
          {readOnly ? (
            <Surface className="px-6 py-5">
              <p className="text-xs text-muted-foreground">
                You have read-only oversight of this record. Sampling, custody and laboratory entries can only be
                recorded by the assigned service provider; review decisions by Beldium Compliance.
              </p>
            </Surface>
          ) : null}

          <Surface>
            <SectionTitle title="Review history" hint="Simulated review actions by Beldium Compliance" />
            <div className="divide-y divide-border">
              {a.reviews.length === 0 ? (
                <EmptyState title="No review actions yet" />
              ) : (
                a.reviews.map((r) => (
                  <div key={r.id} className="px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusPill value={r.decision} />
                      <span className="text-xs text-muted-foreground">{r.at}</span>
                    </div>
                    <p className="mt-2 text-sm text-navy">{r.note}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{r.reviewer}</p>
                  </div>
                ))
              )}
            </div>
          </Surface>

          <Surface>
            <SectionTitle title="Audit trail" hint="Every action on this assignment" />
            <div className="divide-y divide-border">
              {a.audit.map((e) => (
                <div key={e.id} className="flex items-start gap-3 px-6 py-3">
                  <ScrollText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm text-navy">
                      <span className="font-medium">{e.actor}</span> — {e.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{e.detail}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">{e.at}</span>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </>
  );
}

function SamplingSection({ a, canEdit }: { a: QualityAssignment; canEdit: boolean }) {
  const { addSamplingEvent } = useBeldium();
  const [open, setOpen] = React.useState(false);
  const [v, setV] = React.useState({
    sampleId: "",
    location: a.location,
    personnel: a.personnel[0] ?? "",
    methodology: "Composite / lot",
    quantityKg: "",
    packaging: "",
    sealRef: "",
    condition: "Good",
    observations: "",
  });
  const [err, setErr] = React.useState<Partial<Record<keyof typeof v, string>>>({});
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((x) => ({ ...x, [k]: e.target.value }));

  const submit = () => {
    const e: Partial<Record<keyof typeof v, string>> = {};
    if (!v.sampleId.trim()) e.sampleId = "Required.";
    if (!v.sealRef.trim()) e.sealRef = "Required.";
    if (!v.packaging.trim()) e.packaging = "Required.";
    const qty = Number(v.quantityKg);
    if (!v.quantityKg || isNaN(qty) || qty <= 0) e.quantityKg = "Enter a valid quantity.";
    setErr(e);
    if (Object.keys(e).length) return;
    addSamplingEvent(a.id, {
      sampleId: v.sampleId.trim(),
      mineral: a.mineral,
      location: v.location,
      at: new Date().toISOString().slice(0, 16).replace("T", " "),
      personnel: v.personnel,
      methodology: v.methodology,
      quantityKg: qty,
      packaging: v.packaging.trim(),
      sealRef: v.sealRef.trim(),
      condition: v.condition,
      observations: v.observations.trim(),
    });
    setOpen(false);
  };

  return (
    <Surface>
      <SectionTitle
        title="Sampling events"
        hint="Each event mints a sample identity with seal reference"
        action={
          canEdit ? (
            <Btn variant="outline" onClick={() => setOpen((x) => !x)}>
              <PackageCheck className="size-4" /> Record sampling
            </Btn>
          ) : undefined
        }
      />
      {open ? (
        <div className="grid gap-4 border-b border-border px-6 py-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="se-id">Sample identification number *</Label>
            <input id="se-id" value={v.sampleId} onChange={set("sampleId")} placeholder="SMP-2026-3410" className={inputClass} aria-invalid={!!err.sampleId} />
            <FieldError>{err.sampleId}</FieldError>
          </div>
          <div>
            <Label htmlFor="se-loc">Sampling location</Label>
            <input id="se-loc" value={v.location} onChange={set("location")} className={inputClass} />
          </div>
          <div>
            <Label htmlFor="se-per">Sampling personnel</Label>
            <input id="se-per" value={v.personnel} onChange={set("personnel")} className={inputClass} />
          </div>
          <div>
            <Label htmlFor="se-meth">Methodology</Label>
            <select id="se-meth" value={v.methodology} onChange={set("methodology")} className={inputClass}>
              {["Grab", "Channel", "Composite / lot", "Increment sampling"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="se-qty">Sample quantity (kg) *</Label>
            <input id="se-qty" type="number" value={v.quantityKg} onChange={set("quantityKg")} className={inputClass} aria-invalid={!!err.quantityKg} />
            <FieldError>{err.quantityKg}</FieldError>
          </div>
          <div>
            <Label htmlFor="se-pack">Packaging *</Label>
            <input id="se-pack" value={v.packaging} onChange={set("packaging")} placeholder="Double poly-lined drums" className={inputClass} aria-invalid={!!err.packaging} />
            <FieldError>{err.packaging}</FieldError>
          </div>
          <div>
            <Label htmlFor="se-seal">Seal reference *</Label>
            <input id="se-seal" value={v.sealRef} onChange={set("sealRef")} placeholder="SEAL-90210" className={inputClass} aria-invalid={!!err.sealRef} />
            <FieldError>{err.sealRef}</FieldError>
          </div>
          <div>
            <Label htmlFor="se-cond">Sample condition</Label>
            <input id="se-cond" value={v.condition} onChange={set("condition")} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="se-obs">Collection observations</Label>
            <textarea id="se-obs" rows={2} value={v.observations} onChange={set("observations")} className={inputClass} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Btn onClick={submit}>Save sampling event</Btn>
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
          </div>
        </div>
      ) : null}
      <div className="divide-y divide-border">
        {a.sampling.length === 0 ? (
          <EmptyState title="No sampling events yet" hint="Recorded field sampling will appear here." />
        ) : (
          a.sampling.map((s) => (
            <div key={s.id} className="px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-sm font-semibold text-navy">
                  {s.ref} · {s.sampleId}
                </p>
                <Pill tone="info">seal {s.sealRef}</Pill>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {s.at} · {s.location} · {s.personnel}
              </p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Methodology" value={s.methodology} />
                <Field label="Quantity" value={`${s.quantityKg} kg`} />
                <Field label="Packaging" value={s.packaging} />
                <Field label="Condition" value={s.condition} />
                <Field label="Observations" value={s.observations || "—"} />
              </dl>
            </div>
          ))
        )}
      </div>
    </Surface>
  );
}

function CustodySection({ a, canEdit }: { a: QualityAssignment; canEdit: boolean }) {
  const { addCustodyHandover } = useBeldium();
  const [open, setOpen] = React.useState(false);
  const [v, setV] = React.useState({
    sampleRef: a.sampling[0]?.sampleId ?? "",
    releasingParty: "",
    receivingParty: "",
    location: "",
    status: "handed_over" as "handed_over" | "received" | "correction",
    condition: "Seal intact",
    note: "",
  });
  const [err, setErr] = React.useState<Partial<Record<keyof typeof v, string>>>({});
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((x) => ({ ...x, [k]: e.target.value }));

  const submit = () => {
    const e: Partial<Record<keyof typeof v, string>> = {};
    if (!v.sampleRef.trim()) e.sampleRef = "Required.";
    if (!v.releasingParty.trim()) e.releasingParty = "Required.";
    if (!v.receivingParty.trim()) e.receivingParty = "Required.";
    if (!v.location.trim()) e.location = "Required.";
    setErr(e);
    if (Object.keys(e).length) return;
    addCustodyHandover(a.id, {
      sampleRef: v.sampleRef.trim(),
      releasingParty: v.releasingParty.trim(),
      receivingParty: v.receivingParty.trim(),
      at: new Date().toISOString().slice(0, 16).replace("T", " "),
      location: v.location.trim(),
      status: v.status,
      condition: v.condition.trim(),
      ...(v.note.trim() ? { note: v.note.trim() } : {}),
    });
    setOpen(false);
  };

  const ordered = [...a.custody].sort((x, y) => (x.at < y.at ? -1 : 1));

  return (
    <Surface>
      <SectionTitle
        title="Chain of custody"
        hint="Append-only — corrections are recorded as new events, never rewritten"
        action={
          canEdit ? (
            <Btn variant="outline" onClick={() => setOpen((x) => !x)}>Record handover</Btn>
          ) : undefined
        }
      />
      {open ? (
        <div className="grid gap-4 border-b border-border px-6 py-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="cu-sample">Sample reference *</Label>
            <input id="cu-sample" value={v.sampleRef} onChange={set("sampleRef")} placeholder="SMP-2026-3391" className={inputClass} aria-invalid={!!err.sampleRef} />
            <FieldError>{err.sampleRef}</FieldError>
          </div>
          <div>
            <Label htmlFor="cu-status">Event type</Label>
            <select id="cu-status" value={v.status} onChange={set("status")} className={inputClass}>
              <option value="handed_over">Handover</option>
              <option value="received">Receipt</option>
              <option value="correction">Correction of an earlier event</option>
            </select>
          </div>
          <div>
            <Label htmlFor="cu-rel">Releasing party *</Label>
            <input id="cu-rel" value={v.releasingParty} onChange={set("releasingParty")} className={inputClass} aria-invalid={!!err.releasingParty} />
            <FieldError>{err.releasingParty}</FieldError>
          </div>
          <div>
            <Label htmlFor="cu-rec">Receiving party *</Label>
            <input id="cu-rec" value={v.receivingParty} onChange={set("receivingParty")} className={inputClass} aria-invalid={!!err.receivingParty} />
            <FieldError>{err.receivingParty}</FieldError>
          </div>
          <div>
            <Label htmlFor="cu-loc">Location *</Label>
            <input id="cu-loc" value={v.location} onChange={set("location")} className={inputClass} aria-invalid={!!err.location} />
            <FieldError>{err.location}</FieldError>
          </div>
          <div>
            <Label htmlFor="cu-cond">Condition observations</Label>
            <input id="cu-cond" value={v.condition} onChange={set("condition")} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cu-note">Note (required for corrections)</Label>
            <textarea id="cu-note" rows={2} value={v.note} onChange={set("note")} className={inputClass} placeholder={v.status === "correction" ? "Which earlier event this corrects, and why" : ""} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Btn onClick={submit}>Append custody event</Btn>
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
          </div>
        </div>
      ) : null}
      <div className="px-6 py-5">
        {ordered.length === 0 ? (
          <EmptyState title="No custody events yet" />
        ) : (
          <ol className="relative space-y-5 border-l-2 border-border pl-5">
            {ordered.map((c) => (
              <li key={c.id} className="relative">
                <span
                  className={cn(
                    "absolute top-1 -left-[27px] size-3 rounded-full border-2 border-card",
                    c.status === "correction" ? "bg-warning" : "bg-link",
                  )}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-navy">{c.ref}</p>
                  <StatusPill value={c.status} />
                  <span className="text-xs text-muted-foreground">{c.at} · {c.location}</span>
                </div>
                <p className="mt-1 text-sm text-navy">
                  {c.releasingParty} → {c.receivingParty}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {c.sampleRef} · {c.condition}
                  {c.note ? ` · ${c.note}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Surface>
  );
}

function LabSection({ a, canEdit }: { a: QualityAssignment; canEdit: boolean }) {
  const { addLabAnalysis, setLabAnalysisStatus } = useBeldium();
  const [open, setOpen] = React.useState(false);
  const [v, setV] = React.useState({
    sampleRef: a.sampling[0]?.sampleId ?? "",
    labOrg: a.providerOrg,
    method: methods[0]!,
    analyte: "",
    result: "",
    unit: "",
    reportRef: "",
    signatory: "",
  });
  const [err, setErr] = React.useState<Partial<Record<keyof typeof v, string>>>({});
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((x) => ({ ...x, [k]: e.target.value }));

  const submit = () => {
    const e: Partial<Record<keyof typeof v, string>> = {};
    if (!v.sampleRef.trim()) e.sampleRef = "Required.";
    if (!v.analyte.trim()) e.analyte = "Required.";
    setErr(e);
    if (Object.keys(e).length) return;
    const today = new Date().toISOString().slice(0, 10);
    addLabAnalysis(a.id, {
      sampleRef: v.sampleRef.trim(),
      labOrg: v.labOrg,
      receivedAt: `${today} 09:00`,
      conditionOnReceipt: "Seal intact",
      analysisRef: `ANA-2026-${Math.floor(1200 + Math.random() * 700)}`,
      method: v.method,
      analyte: v.analyte.trim(),
      result: v.result.trim(),
      unit: v.unit.trim(),
      status: v.result.trim() ? "report_issued" : "received",
      reportRef: v.reportRef.trim(),
      signatory: v.signatory.trim(),
      reportDate: v.result.trim() ? today : null,
    });
    setOpen(false);
  };

  return (
    <Surface>
      <SectionTitle
        title="Laboratory evidence"
        hint="References to the laboratory's own records — simulated demonstration data, not independent certification"
        action={
          canEdit ? (
            <Btn variant="outline" onClick={() => setOpen((x) => !x)}>
              <FlaskConical className="size-4" /> Reference analysis
            </Btn>
          ) : undefined
        }
      />
      {open ? (
        <div className="grid gap-4 border-b border-border px-6 py-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="la-sample">Sample reference *</Label>
            <input id="la-sample" value={v.sampleRef} onChange={set("sampleRef")} className={inputClass} aria-invalid={!!err.sampleRef} />
            <FieldError>{err.sampleRef}</FieldError>
          </div>
          <div>
            <Label htmlFor="la-org">Laboratory</Label>
            <input id="la-org" value={v.labOrg} onChange={set("labOrg")} className={inputClass} />
          </div>
          <div>
            <Label htmlFor="la-method">Test method</Label>
            <select id="la-method" value={v.method} onChange={set("method")} className={inputClass}>
              {methods.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="la-analyte">Mineral / analyte *</Label>
            <input id="la-analyte" value={v.analyte} onChange={set("analyte")} placeholder="Sn" className={inputClass} aria-invalid={!!err.analyte} />
            <FieldError>{err.analyte}</FieldError>
          </div>
          <div>
            <Label htmlFor="la-result">Reported result (leave blank if pending)</Label>
            <input id="la-result" value={v.result} onChange={set("result")} placeholder="61.8" className={inputClass} />
          </div>
          <div>
            <Label htmlFor="la-unit">Result unit</Label>
            <input id="la-unit" value={v.unit} onChange={set("unit")} placeholder="% or g/t" className={inputClass} />
          </div>
          <div>
            <Label htmlFor="la-report">Laboratory report reference</Label>
            <input id="la-report" value={v.reportRef} onChange={set("reportRef")} placeholder="RPT-LAG-2026-0333" className={inputClass} />
          </div>
          <div>
            <Label htmlFor="la-sig">Authorised report signatory</Label>
            <input id="la-sig" value={v.signatory} onChange={set("signatory")} className={inputClass} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Btn onClick={submit}>Save laboratory reference</Btn>
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
          </div>
        </div>
      ) : null}
      <div className="divide-y divide-border">
        {a.lab.length === 0 ? (
          <EmptyState title="No laboratory evidence yet" hint="Analysis references will appear once samples reach the laboratory." />
        ) : (
          a.lab.map((l) => (
            <div key={l.id} className="px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-sm font-semibold text-navy">
                  {l.analysisRef} · {l.method} — {l.analyte}
                </p>
                <StatusPill value={l.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {l.labOrg} · sample {l.sampleRef}
                {l.receivedAt ? ` · received ${l.receivedAt}` : " · awaiting receipt"}
              </p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Result" value={l.result ? `${l.result} ${l.unit}` : "pending"} />
                <Field label="Report reference" value={l.reportRef || "—"} />
                <Field label="Signatory / date" value={l.signatory ? `${l.signatory} · ${l.reportDate}` : "—"} />
              </dl>
              {canEdit ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {l.status === "awaiting_receipt" ? (
                    <Btn variant="outline" onClick={() => setLabAnalysisStatus(a.id, l.id, "received", { receivedAt: new Date().toISOString().slice(0, 16).replace("T", " "), conditionOnReceipt: "Seal intact" })}>
                      Record receipt
                    </Btn>
                  ) : null}
                  {l.status === "received" ? (
                    <Btn variant="outline" onClick={() => setLabAnalysisStatus(a.id, l.id, "analysis_in_progress")}>Start analysis</Btn>
                  ) : null}
                  {l.status === "report_issued" ? (
                    <Btn variant="outline" onClick={() => setLabAnalysisStatus(a.id, l.id, "review_pending")}>Send for review</Btn>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Surface>
  );
}

function ReviewPanel({ a }: { a: QualityAssignment }) {
  const { addAssignmentReview } = useBeldium();
  const [decision, setDecision] = React.useState<ReviewDecision>("evidence_accepted");
  const [note, setNote] = React.useState("");
  const [err, setErr] = React.useState("");

  const submit = () => {
    if (!note.trim()) {
      setErr("A note is required for this action.");
      return;
    }
    if (decision === "demo_verified" && !a.verifications?.some((r) => r.decision === "accepted")) return setErr("Record independent source verification first.");
    addAssignmentReview(a.id, decision, note.trim());
    setNote("");
    setErr("");
  };

  return (
    <Surface>
      <SectionTitle title="Quality review" hint="Simulated compliance review — both parties see the same status" />
      <div className="space-y-4 px-6 py-5">
        <div className="grid gap-2">
          {reviewActions.map((r) => (
            <label
              key={r.decision}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-sm text-navy transition",
                decision === r.decision ? "border-navy bg-pale/50" : "border-border hover:border-link",
              )}
            >
              <input
                type="radio"
                name="review-decision"
                checked={decision === r.decision}
                onChange={() => setDecision(r.decision)}
                className="size-4 accent-[var(--color-navy)]"
              />
              {r.label}
            </label>
          ))}
        </div>
        <div>
          <Label htmlFor="rev-note">Review note</Label>
          <textarea id="rev-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="Evidence completeness, discrepancies, conditions…" />
          <FieldError>{err}</FieldError>
        </div>
        <Btn onClick={submit}>Record review action</Btn>
        <p className="text-xs text-muted-foreground">
          Demo verification completes the assignment; returning for correction reopens fieldwork.
        </p>
      </div>
    </Surface>
  );
}
