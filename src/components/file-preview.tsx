import { useEffect, useState, type ReactNode } from "react";
import { FileWarning, Loader2 } from "lucide-react";
import { apiFetchBlob } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  txt: "text/plain",
};

// Storage backends often answer with application/octet-stream, which the
// browser won't render inline; fall back to the uploaded file's extension.
function previewType(blob: Blob, originalName: string): string {
  if (blob.type && blob.type !== "application/octet-stream") return blob.type;
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[ext] ?? blob.type;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const formatDate = (v: string | null) => (v ? new Date(v).toLocaleString() : "-");

export type LoadedFile = { url: string; type: string; size: number };

/** Fetch a protected file with the bearer token and expose it as an object URL. */
export function useProtectedFile(url: string | null, originalName: string) {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFile(null);
    setError(null);
    if (!url) return;
    const controller = new AbortController();
    let objectUrl: string | null = null;
    apiFetchBlob(url, controller.signal)
      .then((blob) => {
        const type = previewType(blob, originalName);
        const typed = type === blob.type ? blob : new Blob([blob], { type });
        objectUrl = URL.createObjectURL(typed);
        setFile({ url: objectUrl, type, size: blob.size });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err.message : "The file could not be loaded.");
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, originalName]);

  return { file, error };
}

export function Preview({
  file,
  error,
  hasUrl,
  name,
}: {
  file: LoadedFile | null;
  error: string | null;
  hasUrl: boolean;
  name: string;
}) {
  if (!hasUrl) {
    return (
      <Placeholder icon={<FileWarning className="size-6" />}>
        No file was uploaded for this document.
      </Placeholder>
    );
  }
  if (error) {
    return <Placeholder icon={<FileWarning className="size-6" />}>{error}</Placeholder>;
  }
  if (!file) {
    return (
      <Placeholder icon={<Loader2 className="size-6 animate-spin" />}>
        Loading document…
      </Placeholder>
    );
  }
  if (file.type.startsWith("image/")) {
    return (
      <div className="flex h-full items-center justify-center overflow-auto bg-muted p-4">
        <img src={file.url} alt={name} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }
  if (file.type === "application/pdf" || file.type.startsWith("text/")) {
    return <iframe src={file.url} title={name} className="h-full w-full bg-white" />;
  }
  return (
    <Placeholder icon={<FileWarning className="size-6" />}>
      This file type ({file.type || "unknown"}) can't be previewed here. Download it to read it.
    </Placeholder>
  );
}

export function Placeholder({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted p-6 text-center text-sm text-muted-foreground">
      {icon}
      <p>{children}</p>
    </div>
  );
}
