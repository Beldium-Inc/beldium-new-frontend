import * as React from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  FolderClosed,
  FolderOpen,
  History,
  Search,
  ShieldCheck,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EmptyState, Field, PageHeader, Pill, Stat, Surface } from "@/verticals/quality/ui";
import { ApiError } from "@/lib/api/errors";
import {
  downloadVaultDocument,
  type VaultDocument,
  type VaultSector,
  type VaultStatus,
} from "@/lib/api/vault";
import {
  useAddVaultVersion,
  useApproveVaultDocument,
  useUploadVaultDocument,
  useVaultDocument,
  useVaultDocuments,
  useVaultSectors,
  useVerifyVaultDocument,
} from "@/lib/api/vault-queries";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.zip";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-link";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-navy-foreground hover:bg-navy/90 disabled:opacity-50";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-navy hover:bg-muted disabled:opacity-50";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const fields = Object.values(error.fieldErrors());
    return fields[0] ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function titleFromFile(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function StatusBadge({ status }: { status: VaultStatus }) {
  return status === "approved" ? (
    <Pill tone="success">
      <CheckCircle2 className="size-3" /> Approved
    </Pill>
  ) : (
    <Pill tone="warning">
      <Clock3 className="size-3" /> Awaiting approval
    </Pill>
  );
}

/**
 * One sector's document vault. Built for Quality & Control first; any other
 * sector can mount it with its own `sector` once the backend switches that
 * sector's vault on.
 */
export function VaultWorkspace({ sector }: { sector: string }) {
  const sectors = useVaultSectors();
  const vault = sectors.data?.sectors.find((item) => item.sector === sector);

  if (sectors.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading the vault…</p>;
  }
  if (!vault) {
    return (
      <Surface>
        <EmptyState
          title="You do not have access to this vault"
          hint="The vault is open to approved partners and the Beldium desk."
        />
      </Surface>
    );
  }
  return <VaultBody vault={vault} maxUploadBytes={sectors.data?.max_upload_bytes ?? 0} />;
}

function VaultBody({ vault, maxUploadBytes }: { vault: VaultSector; maxUploadBytes: number }) {
  const [category, setCategory] = React.useState("");
  const [status, setStatus] = React.useState<VaultStatus | "">("");
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [openId, setOpenId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const documents = useVaultDocuments({
    sector: vault.sector,
    category,
    status,
    search: debounced,
    page_size: 100,
  });
  const rows = documents.data?.results ?? [];
  const activeCategory = vault.categories.find((c) => c.code === category);

  return (
    <>
      <PageHeader
        eyebrow="Records"
        title="Document vault"
        description={`A safe backup of ${vault.organisation === "Beldium" ? "partner and Beldium" : vault.organisation} records. Files are fingerprinted on upload, never overwritten, and each one is confirmed by a second person.`}
        actions={
          <button type="button" className={primaryButton} onClick={() => setUploadOpen(true)}>
            <Upload className="size-4" /> Upload documents
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Documents backed up" value={vault.total} />
        <Stat
          label="Awaiting approval"
          value={vault.awaiting_approval}
          sub="need a second person to confirm"
          tone="pale"
        />
        <Stat label="Folders" value={vault.categories.length} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <Surface className="h-fit p-3">
          <p className="px-3 pt-2 pb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Folders
          </p>
          <FolderButton
            label="All documents"
            count={vault.total}
            active={category === ""}
            onClick={() => setCategory("")}
          />
          {vault.categories.map((c) => (
            <FolderButton
              key={c.code}
              label={c.name}
              count={c.document_count}
              active={category === c.code}
              onClick={() => setCategory(c.code)}
            />
          ))}
        </Surface>

        <Surface>
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, reference or file name"
                className="w-full rounded-xl border border-border bg-background py-2 pr-3 pl-9 text-sm outline-none focus:border-link"
              />
            </div>
            <div className="flex rounded-xl border border-border p-1 text-xs font-medium">
              {(
                [
                  ["", "All"],
                  ["awaiting_approval", "Awaiting"],
                  ["approved", "Approved"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5",
                    status === value ? "bg-navy text-navy-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeCategory?.description ? (
            <p className="border-b border-border px-5 py-3 text-xs text-muted-foreground">
              {activeCategory.description}
            </p>
          ) : null}

          {documents.isLoading ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Loading documents…
            </p>
          ) : rows.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FolderOpen className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-navy">
                {debounced || status ? "No documents match" : "This folder is empty"}
              </p>
              <button
                type="button"
                className={cn(secondaryButton, "mt-4")}
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="size-4" /> Upload the first one
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((doc) => (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(doc.id)}
                    className="flex w-full flex-wrap items-center gap-4 px-5 py-4 text-left hover:bg-muted/50"
                  >
                    <FileText className="size-5 shrink-0 text-link" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy">{doc.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {doc.reference} · {doc.category.name}
                        {vault.audience === "desk" ? ` · ${doc.organisation.name}` : ""}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>
                        v{doc.version} · {formatSize(doc.size_bytes)}
                      </p>
                      <p>{formatDate(doc.created_at)}</p>
                    </div>
                    <StatusBadge status={doc.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </div>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        vault={vault}
        defaultCategory={category || vault.categories[0]?.code || ""}
        maxUploadBytes={maxUploadBytes}
      />
      <DocumentSheet
        id={openId}
        onClose={() => setOpenId(null)}
        onOpenVersion={setOpenId}
        isDesk={vault.audience === "desk"}
        sector={vault.sector}
      />
    </>
  );
}

function FolderButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm",
        active ? "bg-pale font-semibold text-navy" : "text-muted-foreground hover:bg-muted",
      )}
    >
      {active ? (
        <FolderOpen className="size-4 shrink-0" />
      ) : (
        <FolderClosed className="size-4 shrink-0" />
      )}
      <span className="flex-1 truncate">{label}</span>
      <span className="text-xs">{count}</span>
    </button>
  );
}

// --- upload ---------------------------------------------------------------------

function UploadDialog({
  open,
  onOpenChange,
  vault,
  defaultCategory,
  maxUploadBytes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vault: VaultSector;
  defaultCategory: string;
  maxUploadBytes: number;
}) {
  const upload = useUploadVaultDocument();
  const [files, setFiles] = React.useState<File[]>([]);
  const [category, setCategory] = React.useState(defaultCategory);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setFiles([]);
      setTitle("");
      setDescription("");
      setCategory(defaultCategory);
    }
  }, [open, defaultCategory]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list);
    const tooBig = picked.filter((f) => maxUploadBytes && f.size > maxUploadBytes);
    if (tooBig.length) {
      toast.error(`${tooBig[0]!.name} is larger than ${formatSize(maxUploadBytes)}.`);
    }
    const accepted = picked.filter((f) => !tooBig.includes(f));
    setFiles((current) => {
      const next = [...current, ...accepted];
      if (next.length === 1 && !title) setTitle(titleFromFile(next[0]!.name));
      return next;
    });
  };

  const single = files.length === 1;

  const submit = async () => {
    if (!files.length) {
      toast.error("Choose at least one file.");
      return;
    }
    if (single && !title.trim()) {
      toast.error("Give the document a title.");
      return;
    }
    setBusy(true);
    let saved = 0;
    for (const file of files) {
      try {
        await upload.mutateAsync({
          sector: vault.sector,
          category,
          title: single ? title.trim() : titleFromFile(file.name),
          description,
          file,
        });
        saved += 1;
      } catch (error) {
        toast.error(`${file.name}: ${errorMessage(error)}`);
      }
    }
    setBusy(false);
    if (saved) {
      toast.success(saved === 1 ? "Document backed up" : `${saved} documents backed up`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Dialogs render in a portal, outside the dashboard's theme scope. */}
      <DialogContent data-vertical={vault.sector} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload documents</DialogTitle>
          <DialogDescription>
            Filed under {vault.organisation}. A second person confirms each upload.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-4 py-8 text-center",
            dragging ? "border-link bg-pale/50" : "border-border",
          )}
        >
          <UploadCloud className="size-8 text-link" />
          <p className="mt-2 text-sm font-medium text-navy">Drop files here or click to choose</p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, Word, Excel, CSV, images or ZIP, up to {formatSize(maxUploadBytes)} each
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {files.length ? (
          <ul className="space-y-1.5">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm"
              >
                <FileText className="size-4 shrink-0 text-link" />
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles(files.filter((_, i) => i !== index))}
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <label className="block">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Folder
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {vault.categories.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {files.length <= 1 ? (
          <label className="block">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ISO 17025 accreditation certificate 2026"
              className={inputClass}
            />
          </label>
        ) : (
          <p className="text-xs text-muted-foreground">
            Each file is titled from its file name. You can open a document afterwards to see it.
          </p>
        )}

        <label className="block">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Note (optional)
          </span>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this, and where did the original come from?"
            className={cn(inputClass, "rounded-2xl")}
          />
        </label>

        <button
          type="button"
          className={primaryButton}
          disabled={busy || !files.length}
          onClick={submit}
        >
          <Upload className="size-4" />
          {busy
            ? "Uploading…"
            : files.length > 1
              ? `Back up ${files.length} files`
              : "Back up document"}
        </button>
      </DialogContent>
    </Dialog>
  );
}

// --- document detail ------------------------------------------------------------

function DocumentSheet({
  id,
  onClose,
  onOpenVersion,
  isDesk,
  sector,
}: {
  id: string | null;
  onClose: () => void;
  onOpenVersion: (id: string) => void;
  isDesk: boolean;
  sector: string;
}) {
  const detail = useVaultDocument(id);
  const approve = useApproveVaultDocument();
  const addVersion = useAddVaultVersion();
  const verify = useVerifyVaultDocument();
  const [note, setNote] = React.useState("");
  const [versionNote, setVersionNote] = React.useState("");
  const versionInput = React.useRef<HTMLInputElement>(null);

  const doc = detail.data?.document;

  const download = async (target: VaultDocument) => {
    try {
      await downloadVaultDocument(target);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Sheet open={Boolean(id)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent data-vertical={sector} className="w-full overflow-y-auto sm:max-w-xl">
        {!doc ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="pr-6">{doc.title}</SheetTitle>
              <SheetDescription>
                {doc.reference} · version {doc.version}
                {doc.is_latest ? "" : " (an older version)"}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge status={doc.status} />
              <Pill>{doc.category.name}</Pill>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className={primaryButton} onClick={() => download(doc)}>
                <Download className="size-4" /> Download
              </button>
              <button
                type="button"
                className={secondaryButton}
                disabled={verify.isPending}
                onClick={async () => {
                  try {
                    const result = await verify.mutateAsync(doc.id);
                    if (result.intact) toast.success("The stored copy matches its fingerprint.");
                    else
                      toast.error(
                        "The stored copy does not match its fingerprint. Tell the Beldium desk.",
                      );
                  } catch (error) {
                    toast.error(errorMessage(error));
                  }
                }}
              >
                <ShieldCheck className="size-4" /> Check integrity
              </button>
              {doc.is_latest ? (
                <button
                  type="button"
                  className={secondaryButton}
                  disabled={addVersion.isPending}
                  onClick={() => versionInput.current?.click()}
                >
                  <History className="size-4" />
                  {addVersion.isPending ? "Uploading…" : "Upload new version"}
                </button>
              ) : null}
              <input
                ref={versionInput}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  try {
                    const created = await addVersion.mutateAsync({
                      id: doc.id,
                      file,
                      note: versionNote,
                    });
                    setVersionNote("");
                    toast.success(`Version ${created.version} backed up`);
                    onOpenVersion(created.id);
                  } catch (error) {
                    toast.error(errorMessage(error));
                  }
                }}
              />
            </div>

            {doc.is_latest ? (
              <input
                value={versionNote}
                onChange={(e) => setVersionNote(e.target.value)}
                placeholder="For a new version: what changed? (optional)"
                className={inputClass}
              />
            ) : null}

            {detail.data?.can_approve ? (
              <Surface className="mt-5 border-warning/40 p-4">
                <p className="text-sm font-semibold text-navy">Second approval</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Confirm this is the right record. Open the file first.
                </p>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note (optional)"
                  className={inputClass}
                />
                <button
                  type="button"
                  className={cn(primaryButton, "mt-3")}
                  disabled={approve.isPending}
                  onClick={async () => {
                    try {
                      await approve.mutateAsync({ id: doc.id, note });
                      setNote("");
                      toast.success("Document approved");
                    } catch (error) {
                      toast.error(errorMessage(error));
                    }
                  }}
                >
                  <CheckCircle2 className="size-4" /> Approve
                </button>
              </Surface>
            ) : null}

            <dl className="mt-6 grid grid-cols-2 gap-4">
              <Field label="Owner" value={doc.organisation.name} />
              <Field label="File" value={<span className="break-all">{doc.original_name}</span>} />
              <Field label="Uploaded by" value={doc.uploaded_by} />
              <Field label="Uploaded" value={formatDate(doc.created_at)} />
              <Field label="Size" value={formatSize(doc.size_bytes)} />
              <Field
                label="Approved by"
                value={
                  doc.approved_by
                    ? `${doc.approved_by}, ${formatDate(doc.approved_at!)}`
                    : "Not yet"
                }
              />
            </dl>
            {doc.description ? (
              <p className="mt-4 rounded-xl bg-muted p-3 text-sm text-navy">{doc.description}</p>
            ) : null}
            <div className="mt-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                SHA-256 fingerprint
              </p>
              <p className="mt-1 font-mono text-[11px] break-all text-navy">{doc.sha256}</p>
            </div>

            <h4 className="mt-8 text-xs font-semibold tracking-wide text-navy uppercase">
              Version history
            </h4>
            <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
              {detail.data!.versions.map((version) => (
                <li key={version.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <button
                    type="button"
                    className={cn(
                      "flex-1 text-left",
                      version.id === doc.id
                        ? "font-semibold text-navy"
                        : "text-link hover:underline",
                    )}
                    onClick={() => onOpenVersion(version.id)}
                  >
                    v{version.version} · {formatDate(version.created_at)}
                    {version.version_note ? (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {version.version_note}
                      </span>
                    ) : null}
                  </button>
                  <StatusBadge status={version.status} />
                  <button
                    type="button"
                    aria-label={`Download version ${version.version}`}
                    onClick={() => download(version)}
                  >
                    <Download className="size-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>

            {isDesk && detail.data!.activity.length ? (
              <>
                <h4 className="mt-8 text-xs font-semibold tracking-wide text-navy uppercase">
                  Activity
                </h4>
                <ul className="mt-2 space-y-2">
                  {detail.data!.activity.map((entry) => (
                    <li key={entry.id} className="text-xs text-muted-foreground">
                      <span className="font-medium text-navy">{entry.actor}</span>{" "}
                      {entry.action.replace(/_/g, " ")} v{entry.version}
                      {entry.detail ? ` · ${entry.detail}` : ""} ·{" "}
                      {new Date(entry.created_at).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
