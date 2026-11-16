import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  downloadGovernanceDocument,
  downloadGovernanceReport,
  useGovernanceCan,
  useGovernanceDocuments,
  useGovernanceMe,
  useGovernanceReports,
  useUploadGovernanceDocument,
  type GovernanceClassification,
  type GovernanceDocumentType,
} from "@/lib/api";
import {
  DataTable,
  Field,
  LoadError,
  Loading,
  PageHeader,
  Panel,
  StatusBadge,
  errorMessage,
  formatDate,
  selectClass,
} from "@/verticals/governance/ui";

export const Route = createFileRoute("/governance/documents")({ component: Documents });

const TYPES: { value: GovernanceDocumentType; label: string }[] = [
  { value: "policy", label: "Governance policy" },
  { value: "assessment", label: "Regulatory assessment" },
  { value: "risk_report", label: "Risk report" },
  { value: "compliance_report", label: "Compliance report" },
  { value: "audit_finding", label: "Audit finding" },
  { value: "correspondence", label: "Correspondence" },
  { value: "evidence", label: "Supporting evidence" },
  { value: "other", label: "Other" },
];

const sizeLabel = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function Documents() {
  const documents = useGovernanceDocuments();
  const reports = useGovernanceReports();
  const canAuthor = useGovernanceCan("author");
  const canReport = useGovernanceCan("report");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const report = async (
    kind: Parameters<typeof downloadGovernanceReport>[0],
    output: "pdf" | "csv",
  ) => {
    setBusy(`${kind}-${output}`);
    try {
      await downloadGovernanceReport(kind, output);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Documents & Reports"
        desc="Documents are filed once and never edited; a correction is a new upload. You only see documents at or below your classification."
        actions={canAuthor && <Button onClick={() => setUploading(true)}>Upload document</Button>}
      />
      {canReport && (
        <Panel title="Generate report" className="mb-6">
          {reports.isPending ? (
            <Loading />
          ) : reports.error ? (
            <LoadError error={reports.error} />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {reports.data.map((r) => (
                <div
                  key={r.kind}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                >
                  <span>{r.label}</span>
                  <div className="flex gap-1">
                    {r.formats.map((f) => (
                      <button
                        key={f}
                        disabled={busy !== null}
                        onClick={() => void report(r.kind, f)}
                        className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase hover:border-primary hover:text-primary disabled:opacity-50"
                      >
                        {busy === `${r.kind}-${f}` ? "…" : f}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Compiled from the live register at download time. Each download is recorded in the audit
            trail.
          </p>
        </Panel>
      )}
      <Panel title="Repository">
        {documents.isPending ? (
          <Loading />
        ) : documents.error ? (
          <LoadError error={documents.error} />
        ) : (
          <DataTable
            cols={["Document", "Type", "Uploaded by", "Date", "Size", "Classification", ""]}
            empty="No documents filed yet."
            rows={documents.data.map((d) => [
              <span className="flex items-center gap-2 font-medium">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                {d.name}
              </span>,
              TYPES.find((t) => t.value === d.document_type)?.label ?? d.document_type,
              d.uploaded_by.name,
              formatDate(d.created_at),
              sizeLabel(d.size),
              <StatusBadge value={d.classification} />,
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Download ${d.name}`}
                onClick={() =>
                  downloadGovernanceDocument(d).catch((e: unknown) => toast.error(errorMessage(e)))
                }
              >
                <Download />
              </Button>,
            ])}
          />
        )}
      </Panel>
      {uploading && <UploadDialog onClose={() => setUploading(false)} />}
    </>
  );
}

function UploadDialog({ onClose }: { onClose: () => void }) {
  const upload = useUploadGovernanceDocument();
  const me = useGovernanceMe();
  const allowed = me.data?.classifications ?? ["internal"];
  const [name, setName] = useState("");
  const [type, setType] = useState<GovernanceDocumentType>("other");
  const [classification, setClassification] = useState<GovernanceClassification>("internal");
  const [file, setFile] = useState<File | null>(null);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100%_-_2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
          <DialogDescription>PDF, Word, Excel, CSV, JPEG or PNG, up to 20 MB.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!file) return;
            upload.mutate(
              { name: name || file.name, document_type: type, classification, file },
              {
                onSuccess: () => {
                  toast.success("Document filed");
                  onClose();
                },
                onError: (err) => toast.error(errorMessage(err)),
              },
            );
          }}
        >
          <Field label="File" htmlFor="d-file">
            <Input
              id="d-file"
              type="file"
              required
              accept=".pdf,.doc,.docx,.xlsx,.csv,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          <Field label="Document name" htmlFor="d-name" hint="Defaults to the file name.">
            <Input id="d-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type" htmlFor="d-type">
              <select
                id="d-type"
                className={selectClass}
                value={type}
                onChange={(e) => setType(e.target.value as GovernanceDocumentType)}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Classification" htmlFor="d-class">
              <select
                id="d-class"
                className={selectClass}
                value={classification}
                onChange={(e) => setClassification(e.target.value as GovernanceClassification)}
              >
                {(["internal", "restricted", "confidential"] as const)
                  .filter((c) => allowed.includes(c))
                  .map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file || upload.isPending}>
              {upload.isPending ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
