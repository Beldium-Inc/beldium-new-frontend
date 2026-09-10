import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Eye, FileText, X } from "lucide-react";
import { Panel, PageHeader, Pill, statusTone, RegisterState } from "@/verticals/processing/bpc";
import { useAppState } from "@/verticals/processing/store";
import { sectionLabel } from "@/verticals/processing/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/processing/nonconformities")({
  /** `?ref=` deep-links a single record, so the notification bell can open it. */
  validateSearch: (search: Record<string, unknown>): { ref?: string } => {
    const ref = search["ref"];
    return typeof ref === "string" && ref.trim() ? { ref: ref.trim() } : {};
  },
  head: () => ({
    meta: [
      { title: "Non-conformities · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Non-conformity register with severity, corrective-action due dates and submitted evidence.",
      },
      { property: "og:title", content: "Non-conformities · Beldium Processing Compliance" },
      {
        property: "og:description",
        content: "Non-conformity register and corrective-action tracking.",
      },
    ],
  }),
  component: NCPage,
});

function NCPage() {
  const { nonConformities, closeNonConformity, submitEvidence, capabilities, isLoading, error } =
    useAppState();
  // The API is the authority on who may close a finding; the dashboard role
  // stored in the browser is only a view preference.
  const readOnly = !capabilities?.can_decide;
  // The processor answers findings instead: it uploads corrective-action
  // evidence and the desk rules on it.
  const isApplicant = capabilities?.audience === "processor";
  const [filter, setFilter] = React.useState<"All" | "Open" | "Evidence Submitted" | "Closed">(
    "All",
  );
  const { ref } = Route.useSearch();
  // Opened from the bell: show that finding straight away, and let a later
  // click replace it without the URL fighting the user.
  const [open, setOpen] = React.useState<string | null>(ref ?? null);
  React.useEffect(() => {
    if (ref) setOpen(ref);
  }, [ref]);

  const rows = nonConformities.filter((n) => filter === "All" || n.status === filter);
  const active = nonConformities.find((n) => n.id === open);

  return (
    <>
      <PageHeader
        eyebrow={readOnly ? "Regulatory oversight" : "Compliance operations"}
        title="Non-conformity register"
        description={
          readOnly
            ? "Read-only view of findings raised by the Beldium compliance partner across registered processors."
            : "Findings raised during review and inspection, with corrective-action deadlines and evidence assessment."
        }
      />

      <Panel>
        <div className="flex flex-wrap gap-1.5 border-b border-border px-5 py-4">
          {(["All", "Open", "Evidence Submitted", "Closed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-accent",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="divide-y divide-border">
          {rows.map((n) => (
            <div key={n.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <AlertTriangle className="size-4 text-warning-foreground" />
                <p className="text-sm font-semibold">{n.id}</p>
                <Pill tone={statusTone(n.severity)}>{n.severity}</Pill>
                <Pill tone={statusTone(n.status)}>{n.status}</Pill>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  raised {n.raised} · due {n.due}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium">{n.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{n.detail}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span>{n.company}</span>
                <span>·</span>
                <span>{sectionLabel(n.section)}</span>
                <span>·</span>
                {n.applicationId ? (
                  <Link
                    to="/processing/applications/$id"
                    params={{ id: n.applicationId }}
                    className="text-primary hover:underline"
                  >
                    {n.applicationId}
                  </Link>
                ) : (
                  <span>Raised against the register</span>
                )}
                {n.evidence || (isApplicant && n.status !== "Closed") ? (
                  <button
                    onClick={() => setOpen(n.id)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 font-medium text-foreground hover:bg-accent"
                  >
                    <Eye className="size-3" />
                    {n.evidence ? "View evidence" : "Respond"}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          {rows.length === 0 ? (
            <RegisterState
              isLoading={isLoading}
              error={error}
              empty={{
                title: "No findings on the register",
                body: "Non-conformities raised during review or inspection appear here.",
              }}
            />
          ) : null}
        </div>
      </Panel>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-primary/45 backdrop-blur-sm"
            onClick={() => setOpen(null)}
          />
          <div className="relative w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-[0_30px_80px_-30px_rgba(16,30,61,0.7)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Corrective-action evidence</h3>
                <p className="text-xs text-muted-foreground">
                  {active.id} · {active.company}
                </p>
              </div>
              <button onClick={() => setOpen(null)} className="rounded-lg p-1 hover:bg-accent">
                <X className="size-4" />
              </button>
            </div>
            {active.evidence ? (
              <div className="rounded-2xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-muted">
                    <FileText className="size-4 text-primary" />
                  </span>
                  <div>
                    <p className="text-xs font-medium">{active.evidence.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Submitted {active.evidence.submitted}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">{active.evidence.note}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-4 text-center">
                <p className="text-xs font-medium">{active.title}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  No corrective-action evidence has been submitted yet. Due {active.due}.
                </p>
              </div>
            )}

            {isApplicant && active.status !== "Closed" ? (
              <EvidenceForm
                onSubmit={(input) => submitEvidence(active.id, input)}
                onDone={() => setOpen(null)}
              />
            ) : null}
            {readOnly && !isApplicant ? (
              <p className="mt-4 rounded-xl bg-secondary/50 px-3 py-2 text-[11px] text-secondary-foreground">
                Oversight role: evidence is visible for monitoring purposes. Acceptance decisions
                rest with the Beldium compliance partner.
              </p>
            ) : (
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    void closeNonConformity(active.id, false, "Evidence deemed insufficient.");
                    setOpen(null);
                  }}
                  className="rounded-xl border border-destructive/50 bg-destructive/15 px-4 py-2 text-xs font-medium text-destructive-foreground"
                >
                  Insufficient
                </button>
                <button
                  onClick={() => {
                    void closeNonConformity(active.id, true, "Corrective action accepted.");
                    setOpen(null);
                  }}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
                >
                  Accept and close
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * The applicant's answer to a finding: what was done, and the evidence for it.
 * The file is optional — some corrective actions are a written explanation —
 * but the description never is, because the desk rules on it.
 */
function EvidenceForm({
  onSubmit,
  onDone,
}: {
  onSubmit: (input: { name: string; note?: string; file?: File | null }) => Promise<void>;
  onDone: () => void;
}) {
  const [name, setName] = React.useState("");
  const [note, setNote] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [failure, setFailure] = React.useState<string | null>(null);

  const submit = () => {
    setBusy(true);
    setFailure(null);
    void onSubmit({ name: name.trim(), note: note.trim(), file })
      .then(onDone)
      .catch((cause: Error) => setFailure(cause.message))
      .finally(() => setBusy(false));
  };

  return (
    <div className="mt-4 space-y-3">
      <label className="block">
        <span className="text-[11px] font-medium text-muted-foreground">
          What was done <span className="text-destructive">*</span>
        </span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Slag relocated to the lined containment cell"
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
        />
      </label>
      <label className="block">
        <span className="text-[11px] font-medium text-muted-foreground">Detail</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Manifest WM-2026-0912 attached for the 42t removed off-site."
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
        />
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-muted-foreground">
        <span className="rounded-xl border border-border px-3 py-1.5 hover:bg-accent">
          {file ? "Change file" : "Attach evidence"}
        </span>
        <span>{file ? file.name : "Optional · PDF, Word, JPEG or PNG, up to 10 MB"}</span>
        <input
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      {failure ? <p className="text-[11px] text-destructive-foreground">{failure}</p> : null}
      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={busy || name.trim() === ""}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40"
        >
          {busy ? "Submitting…" : "Submit evidence"}
        </button>
      </div>
    </div>
  );
}
