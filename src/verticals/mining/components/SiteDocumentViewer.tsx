import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Download, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBytes, formatDate, Preview, useProtectedFile } from "@/components/file-preview";
import { apiUrl } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { downloadDocumentUrl, type DocumentRecord } from "@/lib/api/mining";
import { useReviewMiningDocument } from "@/lib/api/mining-queries";
import { StatusChip } from "./chips";

/** What the reviewer compares each document against, taken from the site record. */
export type SiteDocumentContext = {
  siteName: string;
  siteCode: string;
  organisationName: string | null;
  licence: string | null;
  location: string;
};

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words text-sm">{children}</p>
    </div>
  );
}

function checklistFor(document: DocumentRecord, context: SiteDocumentContext) {
  const items = [
    `The file is legible, complete, and is genuinely a ${document.name}`,
    `It is issued to ${context.organisationName ? `"${context.organisationName}"` : "the site operator"}`,
    `It relates to ${context.siteName} (${context.siteCode}) at ${context.location}`,
  ];
  if (context.licence) items.push(`Any licence reference matches ${context.licence}`);
  items.push(
    document.expires_on
      ? `It is valid until ${document.expires_on} and has not been revoked or superseded`
      : "It is current: not expired, revoked or superseded",
  );
  return items;
}

/**
 * Inline reader for a mine site's uploaded documents: the file rendered in the
 * page (PDFs and images), its metadata, a checklist against the site record,
 * and Accept / Reject for pending documents. Accept stays locked until the
 * file has loaded and every check is ticked.
 */
export function SiteDocumentViewer({
  documents,
  documentId,
  context,
  onNavigate,
  onClose,
}: {
  documents: DocumentRecord[];
  documentId: string | null;
  context: SiteDocumentContext;
  onNavigate: (documentId: string) => void;
  onClose: () => void;
}) {
  const index = documents.findIndex((d) => d.id === documentId);
  const document = index >= 0 ? documents[index] : null;
  const previous = index > 0 ? documents[index - 1] : undefined;
  const next = index >= 0 && index < documents.length - 1 ? documents[index + 1] : undefined;

  return (
    <Dialog open={document != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[92vh] max-w-[min(96vw,1400px)] flex-col gap-0 overflow-hidden p-0">
        {document ? (
          <ViewerBody
            key={document.id}
            document={document}
            context={context}
            position={`${index + 1} of ${documents.length}`}
            onPrevious={previous ? () => onNavigate(previous.id) : undefined}
            onNext={next ? () => onNavigate(next.id) : undefined}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ViewerBody({
  document,
  context,
  position,
  onPrevious,
  onNext,
}: {
  document: DocumentRecord;
  context: SiteDocumentContext;
  position: string;
  onPrevious: (() => void) | undefined;
  onNext: (() => void) | undefined;
}) {
  // The download endpoint streams the stored file behind the bearer token.
  const fileUrl = document.file_url ? apiUrl(downloadDocumentUrl(document.id)) : null;
  const { file, error } = useProtectedFile(fileUrl, document.original_name);
  const review = useReviewMiningDocument();
  const checklist = useMemo(() => checklistFor(document, context), [document, context]);
  const [checked, setChecked] = useState<boolean[]>(() => checklist.map(() => false));
  const [rejecting, setRejecting] = useState(false);

  const reviewable = document.status === "pending";
  const allChecked = checked.every(Boolean);

  const act = async (status: "verified" | "rejected") => {
    try {
      await review.mutateAsync({ id: document.id, status });
      toast.success(`${document.name} ${status === "verified" ? "accepted" : "rejected"}`);
      setRejecting(false);
      onNext?.();
    } catch (err) {
      toast.error("Could not review this document", {
        description: err instanceof ApiError ? err.message : "Please try again.",
      });
    }
  };

  return (
    <>
      <DialogHeader className="border-b border-border px-5 py-3 pr-12">
        <div className="flex flex-wrap items-center gap-3">
          <DialogTitle className="text-base">{document.name}</DialogTitle>
          <StatusChip value={document.status} />
          <span className="text-xs text-muted-foreground">{position}</span>
          <div className="ml-auto flex items-center gap-1">
            <Button size="sm" variant="ghost" disabled={!onPrevious} onClick={onPrevious}>
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button size="sm" variant="ghost" disabled={!onNext} onClick={onNext}>
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <DialogDescription className="text-xs">
          {context.siteName} · {context.siteCode}
          {context.organisationName ? ` · ${context.organisationName}` : ""}
        </DialogDescription>
      </DialogHeader>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_360px]">
        <div className="min-h-[50vh] border-b border-border lg:min-h-0 lg:border-b-0 lg:border-r">
          <Preview
            file={file}
            error={error}
            hasUrl={Boolean(fileUrl)}
            name={document.original_name || document.name}
          />
        </div>

        <aside className="space-y-5 overflow-y-auto p-5">
          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              File details
            </p>
            <Detail label="File name">{document.original_name || "-"}</Detail>
            <Detail label="Category">{document.category || "-"}</Detail>
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Format">{file?.type || "-"}</Detail>
              <Detail label="Size">{file ? formatBytes(file.size) : "-"}</Detail>
              <Detail label="Uploaded">{formatDate(document.created_at)}</Detail>
              <Detail label="Last updated">{formatDate(document.updated_at)}</Detail>
              <Detail label="Uploaded by">{document.uploaded_by_name || "-"}</Detail>
              <Detail label="Expires">{document.expires_on ?? "-"}</Detail>
            </div>
            {file ? (
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" asChild>
                  <a href={file.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3.5" /> New tab
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={file.url} download={document.original_name || document.name}>
                    <Download className="size-3.5" /> Download
                  </a>
                </Button>
              </div>
            ) : null}
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Site record
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Operator">{context.organisationName ?? "-"}</Detail>
              <Detail label="Mine code">{context.siteCode}</Detail>
              <Detail label="Licence">{context.licence ?? "-"}</Detail>
              <Detail label="Location">{context.location}</Detail>
            </div>
          </section>

          {reviewable ? (
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Verify contents
              </p>
              {checklist.map((item, i) => (
                <label key={item} className="flex cursor-pointer items-start gap-2 text-sm">
                  <Checkbox
                    className="mt-0.5"
                    checked={checked[i] ?? false}
                    disabled={!file}
                    onCheckedChange={(v) =>
                      setChecked((current) => current.map((c, j) => (j === i ? v === true : c)))
                    }
                  />
                  <span>{item}</span>
                </label>
              ))}
              {rejecting ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Reject this document? The operator will need to upload a replacement.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setRejecting(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={review.isPending}
                      onClick={() => void act("rejected")}
                    >
                      Confirm reject
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={!file || !allChecked || review.isPending}
                    title={
                      !file
                        ? "Wait for the document to load"
                        : !allChecked
                          ? "Tick every check first"
                          : undefined
                    }
                    onClick={() => void act("verified")}
                  >
                    {review.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                    Accept document
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={review.isPending}
                    onClick={() => setRejecting(true)}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </section>
          ) : (
            <p className="text-sm text-muted-foreground">
              This document has already been marked {document.status}.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
