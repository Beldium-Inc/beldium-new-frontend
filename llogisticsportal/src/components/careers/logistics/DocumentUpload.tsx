import { useRef, useState } from "react";
import { UploadCloud, X, FileCheck2, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  id: string;
  label: string;
  description: string;
  accept: string;
  required?: boolean;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string | undefined;
  maxMb?: number;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export function DocumentUpload({
  id,
  label,
  description,
  accept,
  required,
  value,
  onChange,
  error,
  maxMb = 10,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<UploadState>(value ? "success" : "idle");
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  const simulateUpload = (file: File) => {
    // TODO(backend): replace with a real upload call once the document
    // upload endpoint exists; this simulates progress against local state.
    setState("uploading");
    setProgress(0);
    setLocalError(null);
    let pct = 0;
    const tick = () => {
      pct = Math.min(100, pct + 15 + Math.random() * 20);
      setProgress(pct);
      if (pct >= 100) {
        setState("success");
        onChange(file);
      } else {
        setTimeout(tick, 150);
      }
    };
    setTimeout(tick, 150);
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      setLocalError(`File exceeds ${maxMb}MB limit`);
      setState("error");
      return;
    }
    simulateUpload(file);
  };

  const retry = () => {
    setState("idle");
    setLocalError(null);
    inputRef.current?.click();
  };

  const remove = () => {
    onChange(null);
    setState("idle");
    setProgress(0);
    setLocalError(null);
  };

  const shownError = error ?? localError;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-brand-navy-deep">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <p className="text-xs text-muted-foreground">{description}</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (state !== "uploading") handleFile(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => state !== "uploading" && inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition",
          dragOver
            ? "border-brand-navy bg-brand-mist/60"
            : "border-border bg-white/60 hover:border-brand-navy/50 hover:bg-brand-mist/40",
          shownError && "border-destructive/60",
          state === "uploading" && "cursor-wait",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        {state === "uploading" && (
          <div className="flex w-full flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-brand-navy" />
            <p className="text-sm font-medium text-brand-navy-deep">Uploading…</p>
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-brand-mist">
              <div
                className="h-full rounded-full bg-brand-navy-deep transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {state === "success" && value && (
          <div className="flex w-full items-center gap-3">
            <FileCheck2 className="h-6 w-6 shrink-0 text-brand-navy" />
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-brand-navy-deep">{value.name}</p>
              <p className="text-xs text-muted-foreground">
                {(value.size / 1024).toFixed(0)} KB · Uploaded
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                retry();
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent"
              aria-label="Replace file"
              title="Replace file"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove();
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {(state === "idle" || state === "error") && (
          <>
            <UploadCloud className="h-8 w-8 text-brand-navy-soft" />
            <p className="mt-2 text-sm font-medium text-brand-navy-deep">
              Click to upload or drag & drop
            </p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, JPG or PNG · up to {maxMb}MB</p>
            {state === "error" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  retry();
                }}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy-deep hover:underline"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Retry upload
              </button>
            )}
          </>
        )}
      </div>
      {shownError && <p className="text-xs font-medium text-destructive">{shownError}</p>}
    </div>
  );
}
