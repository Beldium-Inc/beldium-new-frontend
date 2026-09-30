import { useRef, useState } from "react";
import { UploadCloud, X, FileCheck2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  id: string;
  label: string;
  description?: string;
  accept: string;
  required?: boolean;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string | undefined;
  maxMb?: number;
}

export function FileDropzone({
  id,
  label,
  description,
  accept,
  required,
  value,
  onChange,
  error,
  maxMb = 8,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    if (!file) {
      onChange(null);
      setLocalError(null);
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setLocalError(`File exceeds ${maxMb}MB limit`);
      onChange(null);
      return;
    }
    setLocalError(null);
    onChange(file);
  };

  const shownError = error ?? localError;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-brand-navy-deep">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition",
          dragOver
            ? "border-brand-navy bg-brand-mist/60"
            : "border-border bg-white/60 hover:border-brand-navy/50 hover:bg-brand-mist/40",
          shownError && "border-destructive/60",
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
        {value ? (
          <div className="flex w-full items-center gap-3">
            <FileCheck2 className="h-6 w-6 shrink-0 text-brand-navy" />
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-brand-navy-deep">{value.name}</p>
              <p className="text-xs text-muted-foreground">{(value.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleFile(null);
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-brand-navy-soft" />
            <p className="mt-2 text-sm font-medium text-brand-navy-deep">
              Click to upload or drag & drop
            </p>
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </>
        )}
      </div>
      {shownError && <p className="text-xs font-medium text-destructive">{shownError}</p>}
    </div>
  );
}
