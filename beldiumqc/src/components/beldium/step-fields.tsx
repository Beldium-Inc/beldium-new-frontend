import * as React from "react";
import { Check, FileUp, Plus, Search, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { directory, type FieldDef, type StepDef } from "@/lib/beldium/onboarding";
import { FieldError, Label, inputClass } from "./auth";
import { StatusPill } from "./ui";

export type Values = Record<string, unknown>;
export type Errors = Record<string, string>;
export type UploadedFile = { fileName: string; size: number };

const MAX_FILE = 10 * 1024 * 1024;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.doc,.docx";

export function validateStep(step: StepDef, v: Values): Errors {
  const e: Errors = {};
  for (const f of step.fields) {
    const val = v[f.key];
    switch (f.kind) {
      case "text":
      case "email":
      case "date":
      case "number":
      case "textarea":
      case "tel":
      case "select": {
        const s = typeof val === "string" ? val.trim() : "";
        if (f.required && !s) e[f.key] = "This field is required.";
        else if (s.length > 2000) e[f.key] = "Too long.";
        else if (f.kind === "number" && s && (isNaN(Number(s)) || Number(s) < 0)) e[f.key] = "Enter a valid number.";
        break;
      }
      case "chips": {
        const arr = (val as string[] | undefined) ?? [];
        if (f.min && arr.length < f.min) e[f.key] = `Select at least ${f.min}.`;
        break;
      }
      case "repeater": {
        const rows = (val as Record<string, string>[] | undefined) ?? [];
        const complete = rows.filter((r) => f.columns.every((c) => (r[c.key] ?? "").trim()));
        if (f.min && complete.length < f.min) e[f.key] = `Add at least ${f.min} complete entry.`;
        else if (rows.some((r) => f.columns.some((c) => !(r[c.key] ?? "").trim())))
          e[f.key] = "Complete or remove the unfinished rows.";
        break;
      }
      case "docs": {
        const docs = (val as Record<string, UploadedFile> | undefined) ?? {};
        const missing = f.required.filter((d) => !docs[d]);
        if (missing.length) e[f.key] = `Upload required: ${missing.join(", ")}.`;
        break;
      }
      case "join":
        if (!val) e[f.key] = `Select your ${f.label.toLowerCase()}.`;
        break;
      case "declaration": {
        const d = (val as { a?: boolean; b?: boolean; c?: boolean; name?: string } | undefined) ?? {};
        if (!d.a || !d.b || !d.c) e[f.key] = "Accept all three statements.";
        else if (!(d.name ?? "").trim()) e[f.key] = "Type your full name as signature.";
        break;
      }
    }
  }
  return e;
}

export function StepFields({
  step,
  values,
  errors,
  set,
}: {
  step: StepDef;
  values: Values;
  errors: Errors;
  set: (key: string, value: unknown) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {step.fields.map((f) => (
        <div
          key={f.key}
          className={cn("half" in f && f.half ? "sm:col-span-1" : "sm:col-span-2")}
        >
          <FieldControl f={f} value={values[f.key]} set={(v) => set(f.key, v)} error={errors[f.key]} />
          <FieldError>{errors[f.key]}</FieldError>
        </div>
      ))}
    </div>
  );
}

function FieldControl({
  f,
  value,
  set,
  error,
}: {
  f: FieldDef;
  value: unknown;
  set: (v: unknown) => void;
  error?: string | undefined;
}) {
  const id = `f-${f.key}`;
  switch (f.kind) {
    case "text":
    case "email":
    case "date":
    case "number":
    case "tel":
      return (
        <>
          <Label htmlFor={id}>
            {f.label}
            {f.required ? <span className="text-danger-foreground"> *</span> : null}
          </Label>
          <input
            id={id}
            type={f.kind}
            value={(value as string) ?? ""}
            placeholder={f.placeholder}
            onChange={(e) => set(e.target.value)}
            aria-invalid={!!error}
            maxLength={300}
            className={inputClass}
          />
        </>
      );
    case "textarea":
      return (
        <>
          <Label htmlFor={id}>
            {f.label}
            {f.required ? <span className="text-danger-foreground"> *</span> : null}
          </Label>
          <textarea
            id={id}
            rows={4}
            value={(value as string) ?? ""}
            placeholder={f.placeholder}
            onChange={(e) => set(e.target.value)}
            aria-invalid={!!error}
            maxLength={2000}
            className={inputClass}
          />
        </>
      );
    case "select":
      return (
        <>
          <Label htmlFor={id}>
            {f.label}
            {f.required ? <span className="text-danger-foreground"> *</span> : null}
          </Label>
          <select
            id={id}
            value={(value as string) ?? ""}
            onChange={(e) => set(e.target.value)}
            aria-invalid={!!error}
            className={inputClass}
          >
            <option value="">Select…</option>
            {f.options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </>
      );
    case "chips": {
      const arr = (value as string[] | undefined) ?? [];
      return (
        <>
          <Label>
            {f.label}
            {f.min ? <span className="text-danger-foreground"> *</span> : null}
          </Label>
          <div className="flex flex-wrap gap-2">
            {f.options.map((o) => {
              const on = arr.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set(on ? arr.filter((x) => x !== o) : [...arr, o])}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    on ? "border-navy bg-navy text-navy-foreground" : "border-border bg-card text-navy hover:border-link",
                  )}
                >
                  {on ? <Check className="size-3" /> : null}
                  {o}
                </button>
              );
            })}
          </div>
        </>
      );
    }
    case "repeater": {
      const rows = (value as Record<string, string>[] | undefined) ?? [{}];
      const list = rows.length ? rows : [{}];
      return (
        <>
          <Label>{f.label}</Label>
          <div className="space-y-3">
            {list.map((r, i) => (
              <div key={i} className="grid gap-2 rounded-2xl border border-border bg-muted/40 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                {f.columns.map((c) => (
                  <input
                    key={c.key}
                    aria-label={`${c.label} ${i + 1}`}
                    placeholder={c.placeholder ?? c.label}
                    value={r[c.key] ?? ""}
                    maxLength={200}
                    onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, [c.key]: e.target.value } : x)))}
                    className={inputClass}
                  />
                ))}
                <button
                  type="button"
                  aria-label="Remove row"
                  disabled={list.length === 1}
                  onClick={() => set(list.filter((_, j) => j !== i))}
                  className="grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-danger-foreground disabled:opacity-40"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => set([...list, {}])}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-link"
          >
            <Plus className="size-4" /> {f.addLabel}
          </button>
        </>
      );
    }
    case "docs":
      return <DocsControl f={f} value={(value as Record<string, UploadedFile>) ?? {}} set={set} />;
    case "join":
      return <JoinControl f={f} value={value as { id: string; name: string } | undefined} set={set} />;
    case "declaration": {
      const d = (value as { a?: boolean; b?: boolean; c?: boolean; name?: string }) ?? {};
      const items: [keyof typeof d, string][] = [
        ["a", "The information in this application is true, complete and not misleading."],
        ["b", "I consent to Beldium verifying documents with issuing bodies, accreditation registries and regulators."],
        ["c", "I understand uploading a document is not verification, and that approval can be conditioned, suspended or revoked."],
      ];
      return (
        <div className="space-y-3">
          {items.map(([k, t]) => (
            <label key={k} className="flex gap-3 rounded-2xl border border-border p-3 text-sm text-navy">
              <input
                type="checkbox"
                checked={!!d[k]}
                onChange={(e) => set({ ...d, [k]: e.target.checked })}
                className="mt-0.5 size-4 shrink-0 accent-[var(--color-navy)]"
              />
              {t}
            </label>
          ))}
          <div>
            <Label htmlFor="sig">Signature (type full name)</Label>
            <input id="sig" value={d.name ?? ""} maxLength={120} onChange={(e) => set({ ...d, name: e.target.value })} className={inputClass} />
          </div>
        </div>
      );
    }
  }
}

function DocsControl({
  f,
  value,
  set,
}: {
  f: Extract<FieldDef, { kind: "docs" }>;
  value: Record<string, UploadedFile>;
  set: (v: unknown) => void;
}) {
  const [err, setErr] = React.useState<Record<string, string>>({});
  const row = (type: string, required: boolean) => {
    const file = value[type];
    return (
      <div key={type} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy">
            {type}
            {required ? <span className="text-danger-foreground"> *</span> : <span className="ml-1 text-xs font-normal text-muted-foreground">(if applicable)</span>}
          </p>
          {file ? (
            <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-muted-foreground">
              <FileUp className="size-3.5" /> {file.fileName} · {(file.size / 1024).toFixed(0)} KB <StatusPill value="uploaded" />
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">PDF, JPG, PNG or DOC up to 10 MB</p>
          )}
          {err[type] ? <p className="mt-1 text-xs text-danger-foreground">{err[type]}</p> : null}
        </div>
        <div className="flex gap-2">
          {file ? (
            <button
              type="button"
              onClick={() => {
                const next = { ...value };
                delete next[type];
                set(next);
              }}
              className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-navy hover:border-danger"
            >
              Remove
            </button>
          ) : null}
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-pale px-3 py-2 text-xs font-semibold text-navy hover:bg-pale/70">
            <Upload className="size-3.5" /> {file ? "Replace" : "Upload"}
            <input
              type="file"
              accept={ACCEPT}
              className="sr-only"
              aria-label={`Upload ${type}`}
              onChange={(e) => {
                const fl = e.target.files?.[0];
                e.target.value = "";
                if (!fl) return;
                if (fl.size > MAX_FILE) return setErr((x) => ({ ...x, [type]: "File exceeds 10 MB." }));
                setErr((x) => ({ ...x, [type]: "" }));
                set({ ...value, [type]: { fileName: fl.name, size: fl.size } });
              }}
            />
          </label>
        </div>
      </div>
    );
  };
  return (
    <div className="space-y-2">
      <p className="rounded-xl bg-pale/60 px-3 py-2 text-xs text-navy">
        Uploaded files show as <strong>Uploaded</strong>. After submission each moves to Under Review, then Verified, Information Required or Rejected.
      </p>
      {f.required.map((d) => row(d, true))}
      {f.optional.map((d) => row(d, false))}
    </div>
  );
}

function JoinControl({
  f,
  value,
  set,
}: {
  f: Extract<FieldDef, { kind: "join" }>;
  value: { id: string; name: string } | undefined;
  set: (v: unknown) => void;
}) {
  const [q, setQ] = React.useState("");
  const options =
    f.directory === "lab"
      ? directory.flatMap((o) => o.laboratories.map((l) => ({ id: l.id, name: l.name, sub: `${o.name} · ${l.location}`, status: o.status })))
      : directory
          .filter((o) => (f.directory === "regulator" ? o.id.startsWith("reg-") : !o.id.startsWith("reg-")))
          .map((o) => ({ id: o.id, name: o.name, sub: `${o.type} · ${o.city}`, status: o.status }));
  const shown = options.filter((o) => (o.name + o.sub).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <Label htmlFor="join-q">Search {f.label.toLowerCase()}</Label>
      <div className="relative">
        <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
        <input id="join-q" value={q} onChange={(e) => setQ(e.target.value)} className={inputClass + " pl-9"} placeholder="Name, city or type" />
      </div>
      <div className="mt-3 space-y-2">
        {shown.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            No match. Ask your organisation administrator to register on Beldium first.
          </p>
        ) : (
          shown.map((o) => {
            const on = value?.id === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => set({ id: o.id, name: o.name })}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition",
                  on ? "border-navy bg-pale/50" : "border-border hover:border-link",
                )}
              >
                <span>
                  <span className="block text-sm font-semibold text-navy">{o.name}</span>
                  <span className="block text-xs text-muted-foreground">{o.sub}</span>
                </span>
                <span className="flex items-center gap-2">
                  <StatusPill value={o.status} />
                  {on ? <Check className="size-4 text-navy" /> : null}
                </span>
              </button>
            );
          })
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Your membership request is sent to the {f.label.toLowerCase()} administrator alongside this application.
      </p>
    </>
  );
}

export function summarise(f: FieldDef, v: unknown): string {
  if (v == null || v === "") return "—";
  switch (f.kind) {
    case "chips":
      return (v as string[]).join(", ") || "—";
    case "repeater":
      return (v as Record<string, string>[])
        .map((r) => f.columns.map((c) => r[c.key]).filter(Boolean).join(" · "))
        .filter(Boolean)
        .join("; ") || "—";
    case "docs":
      return Object.keys(v as object).length + " document(s) uploaded";
    case "join":
      return (v as { name: string }).name;
    case "declaration":
      return (v as { name?: string }).name ? `Signed by ${(v as { name: string }).name}` : "Not signed";
    default:
      return String(v);
  }
}

export function fieldLabel(f: FieldDef) {
  if (f.kind === "docs") return "Documents";
  if (f.kind === "declaration") return "Declaration";
  return f.label;
}
