import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Info,
  Loader2,
  MessageSquare,
  Send,
  ShieldCheck,
} from "lucide-react";

import {
  Panel,
  PanelHeader,
  PageHeader,
  Pill,
  RegisterState,
  ScoreBar,
} from "@/verticals/processing/bpc";
import { useAppState, useApplicationDetail } from "@/verticals/processing/store";
import {
  SECTIONS,
  outstandingFromError,
  type DocItem,
  type SectionKey,
} from "@/verticals/processing/domain";
import { useProcessingChecklist } from "@/lib/api/processing-queries";
import type { ChecklistSection } from "@/lib/api/processing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/processing/application")({
  head: () => ({
    meta: [
      { title: "My application · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Complete your processing compliance application section by section: answer the required questions, upload supporting evidence and submit for review.",
      },
    ],
  }),
  component: ApplicationWorkspace,
});

const REVIEW_TONE = {
  pending: { tone: "neutral" as const, label: "Not yet reviewed" },
  verified: { tone: "success" as const, label: "Verified" },
  rejected: { tone: "danger" as const, label: "Rejected" },
  info_requested: { tone: "warning" as const, label: "Information requested" },
  flagged: { tone: "info" as const, label: "Flagged for inspection" },
};

function ApplicationWorkspace() {
  const { myApplication, applications, isLoading, error } = useAppState();
  // A company registering a second facility has more than one; default to the
  // one the store judged actionable, but let them switch.
  const [chosen, setChosen] = React.useState<string | null>(null);
  const active = applications.find((row) => row.id === chosen) ?? myApplication;

  if (!myApplication) {
    return (
      <>
        <PageHeader
          eyebrow="Applicant"
          title="My application"
          description="Your processing compliance application lives here once you have started one."
        />
        <Panel>
          <RegisterState
            isLoading={isLoading}
            error={error}
            empty={{
              title: "No application yet",
              body: "Start one to begin answering the ten evidence sections.",
            }}
          />
          <div className="border-t border-border px-5 py-4 text-center">
            <Link
              to="/processing/onboarding"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
            >
              Start an application
            </Link>
          </div>
        </Panel>
      </>
    );
  }

  return (
    <>
      {applications.length > 1 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">My applications</span>
          {applications.map((row) => (
            <button
              key={row.id}
              onClick={() => setChosen(row.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] font-medium",
                active?.id === row.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-accent",
              )}
            >
              {row.facility || row.company} · {row.stage}
            </button>
          ))}
        </div>
      ) : null}
      <Workspace key={active!.id} reference={active!.id} />
    </>
  );
}

function Workspace({ reference }: { reference: string }) {
  const { saveSection, uploadDocument, submitApplication } = useAppState();
  const { application, isLoading, error } = useApplicationDetail(reference);
  const checklist = useProcessingChecklist(application?.processingType ?? null);

  const [tab, setTab] = React.useState<SectionKey>("corporate");
  const [toast, setToast] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  // Gaps the API reported when a submission was refused, so the applicant sees
  // the same list the server judged them against.
  const [refusedWith, setRefusedWith] = React.useState<string[] | null>(null);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  };

  if (!application) {
    return (
      <Panel className="p-10">
        <RegisterState
          isLoading={isLoading}
          error={error}
          empty={{ title: "Application not found", body: "It may have been withdrawn." }}
        />
      </Panel>
    );
  }

  const section = application.sections[tab];
  const gaps = application.outstanding.find((row) => row.section === tab);
  const checklistSection = checklist.data?.sections.find((row) => row.key === tab);
  const locked = application.stage !== "New" && application.stage !== "Awaiting Info";
  const submittable = application.outstanding.length === 0;

  const submit = () => {
    setSubmitting(true);
    setRefusedWith(null);
    void submitApplication(application.id)
      .then(() => notify("Submitted for review"))
      .catch((cause: Error) => {
        const outstanding = outstandingFromError(cause);
        if (outstanding.length) {
          setRefusedWith(
            outstanding.map(
              (row) =>
                `${row.label}: ${[...row.missingPrompts, ...row.missingDocuments].join(", ")}`,
            ),
          );
        }
        notify(cause.message);
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <>
      {toast ? (
        <div className="fixed top-20 right-6 z-50 max-w-sm rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-[0_18px_50px_-20px_rgba(16,30,61,0.5)]">
          {toast}
        </div>
      ) : null}

      <PageHeader
        eyebrow="Applicant"
        title={application.company}
        description={`${application.id} · ${application.facility || "Facility not named"} · ${application.state} State`}
        actions={
          <button
            onClick={submit}
            disabled={locked || submitting || !submittable}
            title={
              locked
                ? "The desk has your application; you cannot edit it right now."
                : submittable
                  ? "Send to the compliance desk"
                  : "Answer every required question and upload every required document first"
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Submit for review
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Panel>
            <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2">
              {SECTIONS.map((entry) => {
                const outstanding = application.outstanding.some(
                  (row) => row.section === entry.key,
                );
                return (
                  <button
                    key={entry.key}
                    onClick={() => setTab(entry.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap",
                      tab === entry.key ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                    )}
                  >
                    {outstanding ? (
                      <AlertTriangle className="size-3" />
                    ) : (
                      <CheckCircle2 className="size-3" />
                    )}
                    {entry.short}
                  </button>
                );
              })}
            </div>

            <SectionForm
              key={tab}
              sectionKey={tab}
              answers={section.fields}
              checklist={checklistSection}
              locked={locked}
              onSave={(fields) =>
                saveSection(application.id, tab, fields)
                  .then(() => notify(`${SECTIONS.find((s) => s.key === tab)?.short} saved`))
                  .catch((cause: Error) => notify(cause.message))
              }
            />
          </Panel>

          <Documents
            docs={section.docs}
            required={checklistSection?.required_documents ?? []}
            missing={gaps?.missingDocuments ?? []}
            locked={locked}
            onUpload={(name, file) =>
              uploadDocument(application.id, { section: tab, name, file })
                .then(() => notify(`${name} uploaded`))
                .catch((cause: Error) => notify(cause.message))
            }
          />
        </div>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Progress" subtitle="Toward a submittable application" />
            <div className="px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-semibold">{application.completeness}%</span>
                <Pill tone={submittable ? "success" : "warning"}>
                  {submittable
                    ? "Ready to submit"
                    : `${application.outstanding.length} sections open`}
                </Pill>
              </div>
              <div className="mt-3">
                <ScoreBar
                  value={application.completeness}
                  tone={submittable ? "success" : "warning"}
                />
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Stage: {application.stage}
                {locked
                  ? ". The desk has your application; you can edit again if they request information."
                  : "."}
              </p>
            </div>
          </Panel>

          {section.reviewState !== "pending" || section.reviewNote ? (
            <Panel>
              <PanelHeader
                title="Reviewer response"
                subtitle={SECTIONS.find((s) => s.key === tab)?.label ?? ""}
                icon={<MessageSquare className="size-4" />}
              />
              <div className="px-5 py-4">
                <Pill tone={REVIEW_TONE[section.reviewState].tone}>
                  {REVIEW_TONE[section.reviewState].label}
                </Pill>
                {section.reviewNote ? (
                  <p className="mt-2 text-xs text-muted-foreground">{section.reviewNote}</p>
                ) : null}
              </div>
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader title="Still outstanding" subtitle="Everything blocking submission" />
            {application.outstanding.length === 0 ? (
              <p className="flex items-center gap-2 px-5 py-6 text-xs text-success-foreground">
                <ShieldCheck className="size-4" /> Nothing outstanding. You can submit.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {application.outstanding.map((row) => (
                  <li key={row.section}>
                    <button
                      onClick={() => setTab(row.section)}
                      className="w-full px-5 py-3 text-left hover:bg-accent/60"
                    >
                      <p className="text-xs font-medium">{row.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {row.missingPrompts.length} unanswered · {row.missingDocuments.length}{" "}
                        document
                        {row.missingDocuments.length === 1 ? "" : "s"} missing
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {refusedWith ? (
            <Panel className="border-destructive/50">
              <PanelHeader title="Submission refused" subtitle="Reported by the compliance API" />
              <ul className="space-y-1 px-5 py-4 text-[11px] text-muted-foreground">
                {refusedWith.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}

/**
 * One section's questions. The prompts come from the server's checklist, so a
 * change to the compliance requirements shows up here without a frontend
 * release; answers already on record are matched to them by label.
 */
function SectionForm({
  sectionKey,
  answers,
  checklist,
  locked,
  onSave,
}: {
  sectionKey: SectionKey;
  answers: { label: string; value: string; flag?: "ok" | "warn" | "bad" }[];
  checklist: ChecklistSection | undefined;
  locked: boolean;
  onSave: (fields: { label: string; value: string }[]) => Promise<void>;
}) {
  const initial = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const field of answers) map[field.label] = field.value ?? "";
    return map;
  }, [answers]);

  const [draft, setDraft] = React.useState<Record<string, string>>(initial);
  const [saving, setSaving] = React.useState(false);
  const dirty = React.useMemo(
    () => Object.keys(draft).some((label) => (draft[label] ?? "") !== (initial[label] ?? "")),
    [draft, initial],
  );

  if (!checklist) {
    return (
      <p className="px-5 py-8 text-center text-xs text-muted-foreground">Loading the checklist…</p>
    );
  }

  const save = () => {
    setSaving(true);
    const fields = checklist.prompts
      .map((prompt) => ({ label: prompt.label, value: (draft[prompt.label] ?? "").trim() }))
      .filter((field) => field.value !== "");
    void onSave(fields).finally(() => setSaving(false));
  };

  return (
    <div className="px-5 py-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {checklist.prompts.map((prompt) => (
          <label key={prompt.label} className="block">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              {prompt.label}
              {prompt.required ? <span className="text-destructive">*</span> : null}
            </span>
            <input
              value={draft[prompt.label] ?? ""}
              disabled={locked}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, [prompt.label]: event.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring disabled:opacity-60"
            />
          </label>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Info className="size-3" />
          Saving returns this section to the review queue.
        </p>
        <button
          onClick={save}
          disabled={locked || saving || !dirty}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40"
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Save section
        </button>
      </div>
      <input type="hidden" value={sectionKey} readOnly />
    </div>
  );
}

function Documents({
  docs,
  required,
  missing,
  locked,
  onUpload,
}: {
  docs: DocItem[];
  required: string[];
  missing: string[];
  locked: boolean;
  onUpload: (name: string, file: File) => Promise<void>;
}) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const supplied = new Map(docs.map((doc) => [doc.name, doc]));

  const pick = (name: string, file: File | undefined) => {
    if (!file) return;
    setBusy(name);
    void onUpload(name, file).finally(() => setBusy(null));
  };

  return (
    <Panel>
      <PanelHeader
        title="Supporting evidence"
        subtitle="PDF, Word, JPEG or PNG, up to 10 MB"
        icon={<FileUp className="size-4" />}
      />
      <div className="divide-y divide-border">
        {required.map((name) => {
          const doc = supplied.get(name);
          const outstanding = missing.includes(name);
          return (
            <div key={name} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">{name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {doc?.url
                    ? `Uploaded${doc.expires ? ` · expires ${doc.expires}` : ""}`
                    : "Not yet supplied"}
                </p>
              </div>
              <Pill tone={outstanding ? "warning" : "success"}>
                {outstanding ? "Required" : (doc?.status ?? "valid")}
              </Pill>
              {!locked ? (
                <label className="cursor-pointer rounded-xl border border-border px-3 py-1.5 text-[11px] font-medium hover:bg-accent">
                  {busy === name ? "Uploading…" : doc?.url ? "Replace" : "Upload"}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(event) => pick(name, event.target.files?.[0])}
                  />
                </label>
              ) : null}
            </div>
          );
        })}
        {required.length === 0 ? (
          <p className="px-5 py-6 text-center text-xs text-muted-foreground">
            No documents are required for this section.
          </p>
        ) : null}
      </div>
    </Panel>
  );
}
