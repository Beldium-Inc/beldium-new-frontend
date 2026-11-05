import * as React from "react";
import { can } from "@/lib/beldium/compliance";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/beldium/shell";
import { EmptyState, PageHeader, SectionTitle, Stat, StatusPill, Surface } from "@/components/beldium/ui";
import { Btn, FieldError, Label, inputClass } from "@/components/beldium/auth";
import { useBeldium } from "@/lib/beldium/store";
import { minerals } from "@/lib/beldium/onboarding";

export const Route = createFileRoute("/assignments/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Quality assignments — Beldium" },
      {
        name: "description",
        content:
          "Quality verification assignments from across the Beldium ecosystem: sampling, custody, laboratory evidence and quality review.",
      },
      { property: "og:title", content: "Quality assignments — Beldium" },
      {
        property: "og:description",
        content: "Track quality verification assignments from request to completed review.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <AssignmentsPage />
    </AppShell>
  ),
});

const sectors = [
  "Marketplace",
  "Mining Compliance",
  "Logistics Compliance",
  "Warehousing Compliance",
  "Processing Compliance",
  "Export Compliance",
];

function AssignmentsPage() {
  const { state, user } = useBeldium();
  const [creating, setCreating] = React.useState(false);
  const list = state.assignments;
  const active = list.filter((a) => !["completed", "cancelled", "exception"].includes(a.status));
  const canCreate = can(user, "request");

  return (
    <>
      <PageHeader
        eyebrow="Quality operations"
        title="Quality assignments"
        description="Verification work originating from the wider Beldium ecosystem — from request through sampling, custody and laboratory evidence to quality review. All outcomes are simulated demonstration data."
        actions={
          canCreate ? (
            <Btn onClick={() => setCreating((v) => !v)}>
              <Plus className="size-4" /> Request assignment
            </Btn>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total assignments" value={list.length} sub="across all sectors" />
        <Stat label="In progress" value={active.length} sub="requested → quality review" tone="pale" />
        <Stat label="In quality review" value={list.filter((a) => a.status === "quality_review").length} sub="evidence under review" />
        <Stat label="Completed" value={list.filter((a) => a.status === "completed").length} sub="demo verified" />
      </div>

      {creating ? <CreateAssignment onDone={() => setCreating(false)} /> : null}

      <Surface className="mt-6">
        <SectionTitle title="Assignment register" hint="Open an assignment for sampling, custody, laboratory evidence and review" />
        <div className="divide-y divide-border">
          {list.length === 0 ? (
            <EmptyState title="No assignments yet" hint="Assignments requested from Beldium sectors will appear here." />
          ) : (
            list.map((a) => (
              <Link
                key={a.id}
                to="/assignments/$id"
                params={{ id: a.id }}
                className="grid gap-2 px-6 py-4 transition hover:bg-accent/50 lg:grid-cols-12 lg:items-center"
              >
                <div className="lg:col-span-4">
                  <p className="font-display text-sm font-semibold text-navy">{a.ref}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.service} · {a.mineral}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground lg:col-span-3">
                  {a.sourceOrg} → {a.providerOrg}
                </p>
                <p className="text-xs text-muted-foreground lg:col-span-2">
                  {a.sector} · due {a.targetDate}
                </p>
                <p className="text-xs text-muted-foreground lg:col-span-1">
                  {a.quantityKg.toLocaleString()} kg
                </p>
                <div className="lg:col-span-2 lg:text-right">
                  <StatusPill value={a.status} />
                </div>
              </Link>
            ))
          )}
        </div>
      </Surface>
    </>
  );
}

function CreateAssignment({ onDone }: { onDone: () => void }) {
  const { createAssignment, user } = useBeldium();
  const [v, setV] = React.useState({
    sector: sectors[0]!,
    transactionRef: "",
    mineral: minerals[0]!,
    sourceOrg: user?.org ?? "",
    location: "",
    service: "",
    quantityKg: "",
    providerOrg: "",
    personnel: "",
    activity: "",
    targetDate: "",
  });
  const [err, setErr] = React.useState<Partial<Record<keyof typeof v, string>>>({});
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((x) => ({ ...x, [k]: e.target.value }));

  const submit = () => {
    const e: Partial<Record<keyof typeof v, string>> = {};
    if (!v.transactionRef.trim()) e.transactionRef = "Required.";
    if (!can(user, "request", v.sourceOrg)) e.sourceOrg = "Use your organisation for this request.";
    if (!v.location.trim()) e.location = "Required.";
    if (!v.service.trim()) e.service = "Required.";
    if (!v.providerOrg.trim()) e.providerOrg = "Required.";
    if (!v.activity.trim()) e.activity = "Required.";
    if (!v.targetDate) e.targetDate = "Required.";
    const qty = Number(v.quantityKg);
    if (!v.quantityKg || isNaN(qty) || qty <= 0) e.quantityKg = "Enter a valid quantity.";
    setErr(e);
    if (Object.keys(e).length) return;
    createAssignment({
      sector: v.sector,
      transactionRef: v.transactionRef.trim(),
      mineral: v.mineral,
      sourceOrg: v.sourceOrg.trim(),
      location: v.location.trim(),
      service: v.service.trim(),
      quantityKg: qty,
      providerOrg: v.providerOrg.trim(),
      personnel: v.personnel.split(",").map((p) => p.trim()).filter(Boolean),
      activity: v.activity.trim(),
      targetDate: v.targetDate,
    });
    onDone();
  };

  return (
    <Surface className="mt-6">
      <SectionTitle title="Request a quality assignment" hint="Creates a BQC-ASG reference in Requested status" />
      <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="ca-sector">Originating sector</Label>
          <select id="ca-sector" value={v.sector} onChange={set("sector")} className={inputClass}>
            {sectors.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="ca-txn">Transaction / RFQ reference *</Label>
          <input id="ca-txn" value={v.transactionRef} onChange={set("transactionRef")} placeholder="RFQ-2026-0900" className={inputClass} aria-invalid={!!err.transactionRef} />
          <FieldError>{err.transactionRef}</FieldError>
        </div>
        <div>
          <Label htmlFor="ca-mineral">Mineral</Label>
          <select id="ca-mineral" value={v.mineral} onChange={set("mineral")} className={inputClass}>
            {minerals.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="ca-source">Source organisation *</Label>
          <input id="ca-source" value={v.sourceOrg} onChange={set("sourceOrg")} placeholder="Kivu Ridge Minerals" className={inputClass} aria-invalid={!!err.sourceOrg} />
          <FieldError>{err.sourceOrg}</FieldError>
        </div>
        <div>
          <Label htmlFor="ca-loc">Mine / material location *</Label>
          <input id="ca-loc" value={v.location} onChange={set("location")} placeholder="Walikale, North Kivu, CD" className={inputClass} aria-invalid={!!err.location} />
          <FieldError>{err.location}</FieldError>
        </div>
        <div>
          <Label htmlFor="ca-service">Requested service *</Label>
          <input id="ca-service" value={v.service} onChange={set("service")} placeholder="Mine-site sampling + assay verification" className={inputClass} aria-invalid={!!err.service} />
          <FieldError>{err.service}</FieldError>
        </div>
        <div>
          <Label htmlFor="ca-qty">Declared quantity (kg) *</Label>
          <input id="ca-qty" type="number" value={v.quantityKg} onChange={set("quantityKg")} placeholder="24000" className={inputClass} aria-invalid={!!err.quantityKg} />
          <FieldError>{err.quantityKg}</FieldError>
        </div>
        <div>
          <Label htmlFor="ca-provider">Assigned service provider *</Label>
          <input id="ca-provider" value={v.providerOrg} onChange={set("providerOrg")} placeholder="Antwerp Assay Laboratories NV" className={inputClass} aria-invalid={!!err.providerOrg} />
          <FieldError>{err.providerOrg}</FieldError>
        </div>
        <div>
          <Label htmlFor="ca-personnel">Assigned personnel (comma separated)</Label>
          <input id="ca-personnel" value={v.personnel} onChange={set("personnel")} placeholder="Jean-Paul Mbala, Hauwa Bello" className={inputClass} />
        </div>
        <div>
          <Label htmlFor="ca-date">Target date *</Label>
          <input id="ca-date" type="date" value={v.targetDate} onChange={set("targetDate")} className={inputClass} aria-invalid={!!err.targetDate} />
          <FieldError>{err.targetDate}</FieldError>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="ca-activity">Required sampling / inspection activity *</Label>
          <textarea id="ca-activity" rows={2} value={v.activity} onChange={set("activity")} placeholder="Composite lot sampling, sealed dispatch, XRF assay" className={inputClass} aria-invalid={!!err.activity} />
          <FieldError>{err.activity}</FieldError>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Btn onClick={submit}>Create assignment</Btn>
          <Btn variant="ghost" onClick={onDone}>Cancel</Btn>
        </div>
      </div>
    </Surface>
  );
}
