import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileWarning,
  Loader2,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { apiFetchBlob } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { useReviewComplianceDocument } from "@/lib/api/queries";
import type { ComplianceApplication, ComplianceDocument } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { formatBytes, formatDate, Preview, useProtectedFile } from "@/components/file-preview";

/**
 * What the reviewer should confirm against the file, with the applicant's own
 * answers alongside so they can be compared without leaving the viewer.
 */
function checklistFor(document: ComplianceDocument, application: ComplianceApplication) {
  const org = application.organisation_profile;
  const name = org.name ? `"${org.name}"` : "the applicant organisation";
  const items = [
    `The file is legible, complete, and is genuinely a ${document.title}`,
    `It is issued to ${name}`,
  ];
  switch (document.document_type) {
    case "certificate_of_incorporation":
    case "cac_status_report":
      items.push(
        `The registration number matches ${org.registration_number ?? "the one declared"}`,
      );
      items.push(`The registered address matches the one declared`);
      break;
    case "tin_evidence":
      items.push(`The tax identifier matches ${org.tax_identifier ?? "the one declared"}`);
      break;
    case "key_personnel_cvs":
      items.push("The CVs cover the personnel listed on the application");
      break;
    default:
      break;
  }
  items.push("It is current: not expired, revoked or superseded");
  return items;
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words text-sm">{children}</p>
    </div>
  );
}

const STATUS_TEXT: Record<ComplianceDocument["status"], string> = {
  requested: "Requested",
  submitted: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
};

const STATUS_TONE: Record<ComplianceDocument["status"], string> = {
  requested: "bg-muted text-muted-foreground",
  submitted: "bg-amber-100 text-amber-800",
  verified: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export function DocumentStatusBadge({ status }: { status: ComplianceDocument["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_TONE[status],
      )}
    >
      {STATUS_TEXT[status] ?? status}
    </span>
  );
}

/**
 * Full-screen reader for an applicant's documents: the file rendered inline,
 * its metadata, a checklist of what to confirm against the application, and
 * Verify / Reject. Verify stays locked until the file has loaded and every
 * checklist item is ticked; Reject needs a reason, which the applicant sees.
 */
export function DocumentViewer({
  application,
  documentId,
  onNavigate,
  onClose,
}: {
  application: ComplianceApplication;
  documentId: string | null;
  onNavigate: (documentId: string) => void;
  onClose: () => void;
}) {
  const documents = application.documents;
  const index = documents.findIndex((d) => d.id === documentId);
  const document = index >= 0 ? documents[index] : null;

  return (
    <Dialog open={document !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[92vh] max-w-[min(96vw,1400px)] flex-col gap-0 overflow-hidden p-0">
        {document ? (
          <ViewerBody
            key={document.id}
            application={application}
            document={document}
            position={`${index + 1} of ${documents.length}`}
            onPrevious={index > 0 ? () => onNavigate(documents[index - 1]!.id) : undefined}
            onNext={
              index < documents.length - 1 ? () => onNavigate(documents[index + 1]!.id) : undefined
            }
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ViewerBody({
  application,
  document,
  position,
  onPrevious,
  onNext,
}: {
  application: ComplianceApplication;
  document: ComplianceDocument;
  position: string;
  onPrevious: (() => void) | undefined;
  onNext: (() => void) | undefined;
}) {
  const { file, error } = useProtectedFile(document.file_url, document.original_name);
  const review = useReviewComplianceDocument(application.id);
  const checklist = useMemo(() => checklistFor(document, application), [document, application]);
  const [checked, setChecked] = useState<boolean[]>(() => checklist.map(() => false));
  const [notes, setNotes] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const org = application.organisation_profile;
  const reviewable = document.status === "submitted";
  const allChecked = checked.every(Boolean);
  const canVerify = reviewable && file !== null && allChecked && !review.isPending;

  const act = async (status: "verified" | "rejected") => {
    try {
      await review.mutateAsync({
        documentId: document.id,
        status,
        notes: notes.trim() || undefined,
      });
      toast.success(`${document.title} marked ${status}`);
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
          <DialogTitle className="text-base">{document.title}</DialogTitle>
          <DocumentStatusBadge status={document.status} />
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
          {org.name ?? "Unnamed organisation"} · {application.reference ?? application.id}
        </DialogDescription>
      </DialogHeader>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_360px]">
        <div className="min-h-[50vh] border-b border-border lg:min-h-0 lg:border-b-0 lg:border-r">
          <Preview
            file={file}
            error={error}
            hasUrl={Boolean(document.file_url)}
            name={document.original_name}
          />
        </div>

        <aside className="space-y-5 overflow-y-auto p-5">
          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              File details
            </p>
            <Detail label="File name">{document.original_name || "-"}</Detail>
            <Detail label="Document type">{document.document_type}</Detail>
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Format">{file?.type || "-"}</Detail>
              <Detail label="Size">{file ? formatBytes(file.size) : "-"}</Detail>
              <Detail label="Uploaded">{formatDate(document.created_at)}</Detail>
              <Detail label="Last updated">{formatDate(document.updated_at)}</Detail>
            </div>
            {document.reviewed_at ? (
              <Detail label="Reviewed">{formatDate(document.reviewed_at)}</Detail>
            ) : null}
            {document.request_message ? (
              <Detail label="Request sent to applicant">{document.request_message}</Detail>
            ) : null}
            {document.review_notes ? (
              <Detail label="Review notes">{document.review_notes}</Detail>
            ) : null}
            {file ? (
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" asChild>
                  <a href={file.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3.5" /> New tab
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={file.url} download={document.original_name || document.document_type}>
                    <Download className="size-3.5" /> Download
                  </a>
                </Button>
              </div>
            ) : null}
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Declared by applicant
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Legal name">{org.name ?? "-"}</Detail>
              <Detail label="Registration no.">{org.registration_number ?? "-"}</Detail>
              <Detail label="Tax identifier">{org.tax_identifier ?? "-"}</Detail>
              <Detail label="Year established">{org.year_established ?? "-"}</Detail>
            </div>
            <Detail label="Registered address">{org.registered_address ?? "-"}</Detail>
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
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={
                  rejecting
                    ? "Why is this document being rejected? The applicant will see this."
                    : "Review notes (optional)"
                }
              />
              {rejecting ? (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setRejecting(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={!notes.trim() || review.isPending}
                    onClick={() => void act("rejected")}
                  >
                    Confirm reject
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={!canVerify}
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
                    Verify document
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
              {document.status === "requested"
                ? "Waiting on the applicant to upload this document."
                : `This document has already been ${document.status}.`}
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
