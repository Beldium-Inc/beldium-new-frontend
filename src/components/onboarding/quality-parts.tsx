import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { TextField } from "@/components/onboarding/fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { qualityDeclarationItems } from "@/lib/onboarding/quality";

// Pieces shared by the two Quality & Control application flows.

export const required = (label: string) => `${label} *`;

export function FieldNote({ error }: { error?: string | undefined }) {
  if (!error) return null;
  return (
    <p role="alert" className="mt-2 text-xs text-destructive">
      {error}
    </p>
  );
}

/** A repeatable row of short text inputs: laboratories, equipment, people. */
export function RowsField<K extends string>({
  label,
  columns,
  rows,
  onChange,
  addLabel,
}: {
  label: string;
  columns: { key: K; label: string; placeholder?: string; type?: string }[];
  rows: Record<K, string>[];
  onChange: (rows: Record<K, string>[]) => void;
  addLabel: string;
}) {
  const blank = Object.fromEntries(columns.map((c) => [c.key, ""])) as Record<K, string>;
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-3 space-y-2">
        {rows.map((row, index) => (
          <div
            key={index}
            className="flex flex-wrap items-center gap-3 rounded-[14px] border border-border px-4 py-3 sm:flex-nowrap"
          >
            {columns.map((column) => (
              <Input
                key={column.key}
                type={column.type ?? "text"}
                aria-label={column.label}
                title={column.label}
                placeholder={column.placeholder ?? column.label}
                value={row[column.key]}
                onChange={(e) =>
                  onChange(
                    rows.map((r, i) => (i === index ? { ...r, [column.key]: e.target.value } : r)),
                  )
                }
              />
            ))}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label={`Remove row ${index + 1}`}
              disabled={rows.length === 1}
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2"
        onClick={() => onChange([...rows, blank])}
      >
        <Plus className="mr-1 size-4" /> {addLabel}
      </Button>
    </div>
  );
}

/** Rows somebody actually typed into; the always-present blank row is dropped. */
export function filledRows<K extends string>(rows: Record<K, string>[]): Record<K, string>[] {
  return rows
    .map(
      (row) =>
        Object.fromEntries(
          Object.entries<string>(row).map(([key, value]) => [key, value.trim()]),
        ) as Record<K, string>,
    )
    .filter((row) => Object.values<string>(row).some(Boolean));
}

export type QualityDeclarationState = {
  information_true: boolean;
  consent_to_verification: boolean;
  understands_verification: boolean;
  signature: string;
};

export const emptyQualityDeclaration: QualityDeclarationState = {
  information_true: false,
  consent_to_verification: false,
  understands_verification: false,
  signature: "",
};

export function validateQualityDeclaration(value: QualityDeclarationState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (qualityDeclarationItems.some((item) => !value[item.key]))
    errors["declaration"] = "All three confirmations must be accepted.";
  if (!value.signature.trim()) errors["signature"] = "Type your full name to sign.";
  return errors;
}

export function QualityDeclarationFields({
  value,
  onChange,
  error,
}: {
  value: QualityDeclarationState;
  onChange: (value: QualityDeclarationState) => void;
  error?: string | undefined;
}) {
  return (
    <div className="space-y-3">
      {qualityDeclarationItems.map((item) => (
        <label
          key={item.key}
          className="flex items-start gap-3 rounded-[14px] border border-border px-4 py-3"
        >
          <Checkbox
            className="mt-0.5"
            checked={value[item.key]}
            onCheckedChange={(c) => onChange({ ...value, [item.key]: Boolean(c) })}
          />
          <span className="text-sm">{item.label}</span>
        </label>
      ))}
      <FieldNote error={error} />
      <TextField
        name="signature"
        label="Signature (type full name)"
        value={value.signature}
        onChange={(v) => onChange({ ...value, signature: v })}
      />
    </div>
  );
}

/** One line of a document checklist, with whatever control the flow supplies. */
export function DocumentRow({
  title,
  required: isRequired,
  detail,
  children,
}: {
  title: string;
  required: boolean;
  detail: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-border px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {title}{" "}
          {isRequired ? (
            <span className="text-destructive">*</span>
          ) : (
            <span className="text-xs font-normal text-muted-foreground">(if applicable)</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

export const DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
export const DOCUMENT_HINT = "PDF, JPG, PNG or DOC up to 10 MB";
export const DOCUMENT_STATUS_NOTE =
  "Uploading does not equal verification: each file is reviewed. After submission each moves to Under Review, then Verified, Information Required or Rejected.";
