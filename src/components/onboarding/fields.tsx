import { createContext, useContext, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Validation errors for the form being filled in, keyed by API field name.
 *
 * The API answers a rejected save with a per-field map, and the form has ~37
 * inputs across ten steps. Threading an `error` prop down to each one from the
 * step that made the call would mean touching every call site for something
 * only the failing field cares about, so the map lives here and each field
 * looks itself up by name.
 */
type FieldErrorContextValue = {
  errors: Record<string, string>;
  /** Called as a field is edited, so its message clears as the user fixes it. */
  clear: (name: string) => void;
};

const FieldErrorContext = createContext<FieldErrorContextValue>({
  errors: {},
  clear: () => {},
});

export function FieldErrorProvider({
  errors,
  clear,
  children,
}: FieldErrorContextValue & { children: ReactNode }) {
  return (
    <FieldErrorContext.Provider value={{ errors, clear }}>{children}</FieldErrorContext.Provider>
  );
}

/**
 * The message for one field, and a change handler that clears it.
 *
 * Section payloads go up wrapped as `{ data: {...} }`, so DRF reports their
 * failures as `data.<field>`, while flat endpoints like personnel report
 * `<field>`. Both are accepted so a field does not need to know which kind of
 * endpoint it will be sent to.
 */
function useFieldError(name: string | undefined) {
  const { errors, clear } = useContext(FieldErrorContext);
  if (!name) return { error: undefined, onEdit: () => {} };
  return {
    error: errors[`data.${name}`] ?? errors[name],
    onEdit: () => clear(name),
  };
}

/** Red ring and border, matching the destructive treatment used elsewhere. */
const ERROR_RING = "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive";

function FieldMessage({ error }: { error?: string | undefined }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-xs text-destructive">
      {error}
    </p>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  className,
  name,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className?: string;
  /** API field name, so a rejected save can point at this input. */
  name?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  const { error, onEdit } = useFieldError(name);
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        aria-invalid={Boolean(error)}
        onChange={(e) => {
          onEdit();
          onChange(e.target.value);
        }}
        className={cn(
          "h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
          error && ERROR_RING,
        )}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <FieldMessage error={error} />
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  name,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  /** API field name, so a rejected save can point at this input. */
  name?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  const { error, onEdit } = useFieldError(name);
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={cn(error && ERROR_RING)}
        onChange={(e) => {
          onEdit();
          onChange(e.target.value);
        }}
      />
      <FieldMessage error={error} />
    </div>
  );
}

export function AreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  name,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  /** API field name, so a rejected save can point at this input. */
  name?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  const { error, onEdit } = useFieldError(name);
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={cn(error && ERROR_RING)}
        onChange={(e) => {
          onEdit();
          onChange(e.target.value);
        }}
      />
      <FieldMessage error={error} />
    </div>
  );
}

export function ChipToggleGroup({
  label,
  options,
  selected,
  onToggle,
  hint,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                on
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-surface text-muted-foreground hover:border-brand/40",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-border bg-surface px-4 py-3">
      <span className="text-sm">{label}</span>
      <span className="flex gap-2">
        {[
          { label: "Yes", v: true },
          { label: "No", v: false },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={() => onChange(o.v)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
              value === o.v
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border text-muted-foreground hover:border-brand/40",
            )}
          >
            {o.label}
          </button>
        ))}
      </span>
    </div>
  );
}

export function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-sm font-semibold">{title}</p>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
