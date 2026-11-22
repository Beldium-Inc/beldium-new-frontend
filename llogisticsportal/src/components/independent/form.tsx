import * as React from "react";

import { Field, fieldCls } from "@/components/beldium/ops";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Small controlled inputs for the independent operator screens.

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string | undefined;
  required?: boolean | undefined;
  placeholder?: string | undefined;
}) {
  const text = required ? label : `${label} (optional)`;
  return (
    <Field label={text}>
      {type === "textarea" ? (
        <Textarea
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          type={type}
          value={value}
          placeholder={placeholder}
          min={type === "number" ? 0 : undefined}
          // Quantities and payloads are decimal tonnes.
          step={type === "number" ? "any" : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required = true,
  placeholder = "Select…",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly (string | { value: string; label: string })[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={required ? label : `${label} (optional)`}>
      <select className={fieldCls} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </Field>
  );
}

export function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = React.useId();
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        className="mt-0.5"
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
      />
      <label htmlFor={id} className="text-sm leading-snug text-foreground">
        {label}
      </label>
    </div>
  );
}

export function ErrorText({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {text}
    </p>
  );
}

export function KeyValues({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-0.5 break-words text-foreground">
            {value === "" || value === undefined || value === null ? "Not declared" : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const LABELS: Record<string, string> = {
  lga: "LGA",
  idType: "ID type",
  idFilename: "ID evidence filename",
  bnNumber: "Business name (BN) number",
  registeredBusiness: "Registered business",
  number: "Licence number",
  class: "Licence class",
  expiry: "Licence expiry",
};

/** "monthlyCapacity" → "Monthly capacity". */
export const humanize = (key: string) =>
  LABELS[key] ??
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(/ (\w)/g, (_, c: string) => ` ${c.toLowerCase()}`);

/** Picks a document from the device. The file is kept for submission; its name is recorded. */
export function FileField({
  label,
  value,
  onChange,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (file: File | null) => void;
  required?: boolean | undefined;
}) {
  const text = required ? label : `${label} (optional)`;
  return (
    <Field label={text}>
      <Input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {value ? <p className="mt-1 text-xs text-muted-foreground">Selected: {value}</p> : null}
    </Field>
  );
}
