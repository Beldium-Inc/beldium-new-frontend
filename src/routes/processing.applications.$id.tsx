import * as React from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  Flag,
  Gauge,
  History,
  Info,
  MessageSquare,
  Settings2,
  ShieldAlert,
  X,
  XCircle,
} from "lucide-react";
import { Panel, PanelHeader, Pill, ScoreBar, statusTone } from "@/verticals/processing/bpc";
import { useAppState } from "@/verticals/processing/store";
import {
  PROCESSING_TYPES,
  SECTIONS,
  processingTypeLabel,
  sectionLabel,
  type DocItem,
  type ReviewState,
  type SectionKey,
} from "@/verticals/processing/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/processing/applications/$id")({
  head: () => ({
    meta: [
      { title: "Application review · Beldium Processing Compliance" },
      {
        name: "description",
        content:
          "Section-by-section applicant review: verify evidence, request information, raise non-conformities, flag inspection and issue a decision.",
      },
      { property: "og:title", content: "Application review · Beldium Processing Compliance" },
      {
        property: "og:description",
        content: "Section-by-section processor application review workflow.",
      },
    ],
  }),
  component: ApplicationReview,
});

type Modal =
  | null
  | { kind: "risk" }
  | { kind: "doc"; doc: DocItem }
  | { kind: "nc"; section: SectionKey }
  | { kind: "info"; section: SectionKey }
  | { kind: "decision" }
  | { kind: "evidence"; ncId: string };

const REVIEW_LABEL: Record<ReviewState, string> = {
  pending: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
  info_requested: "Information requested",
  flagged: "Flagged for inspection",
};

function ApplicationReview() {
  const { id } = useParams({ from: "/processing/applications/$id" });
  const {
    applications,
    reviews,
    setReview,
    nonConformities,
    addNonConformity,
    closeNonConformity,
    requestInspection,
    decide,
    audit,
    log,
    user,
  } = useAppState();

  const app = applications.find((a) => a.id === id);
  const [tab, setTab] = React.useState<SectionKey>("corporate");
  const [modal, setModal] = React.useState<Modal>(null);
  const [toast, setToast] = React.useState<string | null>(null);

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3200);
  };

  if (!app) {
    return (
      <Panel className="p-10 text-center">
        <p className="text-sm font-medium">Application not found</p>
        <Link to="/processing/applications" className="mt-2 inline-block text-xs text-primary hover:underline">
          Back to queue
        </Link>
      </Panel>
    );
  }

  const readOnly = user?.role !== "operator";
  const appReviews = reviews[app.id] ?? {};
  const verifiedCount = SECTIONS.filter((s) => appReviews[s.key] === "verified").length;
  const appNCs = nonConformities.filter((n) => n.applicationId === app.id);
  const typeMeta = PROCESSING_TYPES.find((p) => p.key === app.processingType)!;
  const section = app.sections[tab];
  const state: ReviewState = appReviews[tab] ?? "pending";

  const act = (s: ReviewState, msg: string) => {
    setReview(app.id, tab, s);
    log(msg, `${app.id} · ${sectionLabel(tab)}`, `${sectionLabel(tab)} marked ${REVIEW_LABEL[s]}.`);
    notify(`${sectionLabel(tab)} — ${REVIEW_LABEL[s]}`);
  };

  return (
    <>
      {toast ? (
        <div className="fixed top-20 right-6 z-50 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-[0_18px_50px_-20px_rgba(16,30,61,0.5)]">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-success-foreground" /> {toast}
          </span>
        </div>
      ) : null}

      <Link
        to="/processing/applications"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to review queue
      </Link>

      {/* Overview */}
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-start gap-4 border-b border-border bg-accent/40 px-5 py-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{app.company}</h1>
              <Pill tone={statusTone(app.stage)}>{app.stage}</Pill>
              {app.decision ? <Pill tone={statusTone(app.decision)}>{app.decision}</Pill> : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {app.id} · {app.rcNumber} · TIN {app.tin} · submitted {app.submitted}
            </p>
            <div className="mt-3 grid gap-x-8 gap-y-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
              <Meta k="Processing type" v={processingTypeLabel(app.processingType)} />
              <Meta k="Facility" v={app.facility} />
              <Meta k="Location" v={`${app.lga} LGA, ${app.state} State`} />
              <Meta k="Installed capacity" v={app.capacity} />
              <Meta k="Workforce" v={`${app.workforce} staff`} />
              <Meta k="Primary contact" v={app.contact} />
              <Meta k="Email" v={app.email} />
              <Meta k="Phone" v={app.phone} />
            </div>
          </div>

          <div className="w-full max-w-xs space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Composite risk score</p>
              <Pill tone={app.riskScore >= 55 ? "danger" : app.riskScore >= 30 ? "warning" : "success"}>
                {app.riskBand.toUpperCase()}
              </Pill>
            </div>
            <p className="text-4xl font-semibold">{app.riskScore}</p>
            <ScoreBar
              value={app.riskScore}
              tone={app.riskScore >= 55 ? "danger" : app.riskScore >= 30 ? "warning" : "success"}
            />
            <button
              onClick={() => setModal({ kind: "risk" })}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
            >
              <Gauge className="size-3.5" /> View cause breakdown
            </button>
            <div className="grid grid-cols-2 gap-2 pt-1 text-center">
              <div className="rounded-xl bg-muted px-2 py-2">
                <p className="text-sm font-semibold">
                  {verifiedCount}/{SECTIONS.length}
                </p>
                <p className="text-[10px] text-muted-foreground">Sections verified</p>
              </div>
              <div className="rounded-xl bg-muted px-2 py-2">
                <p className="text-sm font-semibold">{appNCs.filter((n) => n.status !== "Closed").length}</p>
                <p className="text-[10px] text-muted-foreground">Open NCs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Conditional requirement banner */}
        <div className="flex flex-wrap items-start gap-3 border-b border-border bg-secondary/40 px-5 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="min-w-0 text-xs">
            <p className="font-medium">
              Conditional requirements applied for {typeMeta.label.toLowerCase()}
            </p>
            <p className="mt-1 flex flex-wrap gap-1.5">
              {typeMeta.extra.map((e) => (
                <Pill key={e} tone="info">
                  {e}
                </Pill>
              ))}
            </p>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2">
          {SECTIONS.map((s) => {
            const st = appReviews[s.key] ?? "pending";
            return (
              <button
                key={s.key}
                onClick={() => setTab(s.key)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                  tab === s.key ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    st === "verified"
                      ? "bg-success"
                      : st === "rejected"
                        ? "bg-destructive"
                        : st === "info_requested"
                          ? "bg-warning"
                          : st === "flagged"
                            ? "bg-secondary"
                            : "bg-muted-foreground/40",
                  )}
                />
                {s.short}
              </button>
            );
          })}
        </div>

        {/* Section body */}
        <div className="grid gap-6 p-5 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">{sectionLabel(tab)}</h2>
              <Pill
                tone={
                  state === "verified"
                    ? "success"
                    : state === "rejected"
                      ? "danger"
                      : state === "info_requested"
                        ? "warning"
                        : state === "flagged"
                          ? "info"
                          : "neutral"
                }
              >
                {REVIEW_LABEL[state]}
              </Pill>
            </div>

            {section.notes ? (
              <p className="mt-3 rounded-xl border border-warning/50 bg-warning/15 px-3 py-2 text-xs text-warning-foreground">
                Reviewer note: {section.notes}
              </p>
            ) : null}

            <dl className="mt-4 divide-y divide-border rounded-2xl border border-border">
              {section.fields.map((f) => (
                <div key={f.label} className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <dt className="min-w-52 text-xs text-muted-foreground">{f.label}</dt>
                  <dd className="text-xs font-medium">{f.value}</dd>
                  {f.flag ? (
                    <Pill
                      tone={f.flag === "ok" ? "success" : f.flag === "warn" ? "warning" : "danger"}
                      className="ml-auto"
                    >
                      {f.flag === "ok" ? "Checked" : f.flag === "warn" ? "Attention" : "Deficiency"}
                    </Pill>
                  ) : null}
                </div>
              ))}
            </dl>

            {tab === "equipment" ? <EquipmentVerification /> : null}
            {tab === "inspection" ? <InspectionPanel appId={app.id} /> : null}
          </div>

          <div className="space-y-4">
            <Panel>
              <PanelHeader title="Supporting documents" subtitle="Click to preview" icon={<FileText className="size-4" />} />
              <div className="divide-y divide-border">
                {section.docs.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setModal({ kind: "doc", doc: d })}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/60"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
                      <FileText className="size-4 text-primary" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">{d.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {d.ref} · {d.issuer}
                      </span>
                    </span>
                    <Pill
                      tone={
                        d.status === "valid"
                          ? "success"
                          : d.status === "expiring"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {d.status}
                    </Pill>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel className="p-4">
              <p className="text-xs font-semibold">Reviewer actions</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {readOnly
                  ? "Oversight role — actions are disabled. Compliance decisions are taken by the Beldium compliance partner."
                  : "Actions are recorded to the audit trail against your operator identity."}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ActionBtn
                  disabled={readOnly}
                  tone="success"
                  icon={<CheckCircle2 className="size-3.5" />}
                  label="Verify section"
                  onClick={() => act("verified", "Section verified")}
                />
                <ActionBtn
                  disabled={readOnly}
                  tone="danger"
                  icon={<XCircle className="size-3.5" />}
                  label="Reject section"
                  onClick={() => act("rejected", "Section rejected")}
                />
                <ActionBtn
                  disabled={readOnly}
                  tone="warning"
                  icon={<MessageSquare className="size-3.5" />}
                  label="Request information"
                  onClick={() => setModal({ kind: "info", section: tab })}
                />
                <ActionBtn
                  disabled={readOnly}
                  tone="info"
                  icon={<Flag className="size-3.5" />}
                  label="Flag for inspection"
                  onClick={() => {
                    act("flagged", "Flagged for inspection");
                    requestInspection(app.id);
                  }}
                />
                <ActionBtn
                  disabled={readOnly}
                  tone="neutral"
                  icon={<ShieldAlert className="size-3.5" />}
                  label="Raise non-conformity"
                  className="col-span-2"
                  onClick={() => setModal({ kind: "nc", section: tab })}
                />
              </div>
            </Panel>
          </div>
        </div>

        {/* Decision bar */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border bg-accent/40 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">Application decision</p>
            <p className="text-[11px] text-muted-foreground">
              {verifiedCount} of {SECTIONS.length} sections verified ·{" "}
              {appNCs.filter((n) => n.status !== "Closed").length} open non-conformity(ies)
            </p>
          </div>
          <button
            disabled={readOnly}
            onClick={() => setModal({ kind: "decision" })}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            {app.decision ? "Revise decision" : "Reach decision"}
          </button>
        </div>
      </Panel>

      {/* NC + audit */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Non-conformities on this application"
            subtitle="Corrective actions and evidence"
            icon={<AlertTriangle className="size-4" />}
          />
          {appNCs.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-muted-foreground">
              No non-conformities raised.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {appNCs.map((n) => (
                <div key={n.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold">{n.id}</p>
                    <Pill tone={statusTone(n.severity)}>{n.severity}</Pill>
                    <Pill tone={statusTone(n.status)}>{n.status}</Pill>
                    <span className="ml-auto text-[11px] text-muted-foreground">due {n.due}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium">{n.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {sectionLabel(n.section)} · {n.detail}
                  </p>
                  {n.evidence ? (
                    <button
                      disabled={readOnly}
                      onClick={() => setModal({ kind: "evidence", ncId: n.id })}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium hover:bg-accent disabled:opacity-40"
                    >
                      <Eye className="size-3" /> Review corrective-action evidence
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Audit timeline"
            subtitle="Immutable record of review activity"
            icon={<History className="size-4" />}
          />
          <div className="max-h-96 space-y-0 overflow-y-auto px-5 py-4">
            {audit.slice(0, 12).map((e, i) => (
              <div key={e.id} className="relative flex gap-3 pb-5">
                <div className="flex flex-col items-center">
                  <span className="mt-1 size-2 rounded-full bg-primary" />
                  {i < 11 ? <span className="w-px flex-1 bg-border" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium">{e.action}</p>
                    <span className="text-[10px] text-muted-foreground">{e.at}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{e.target}</p>
                  <p className="text-[11px] text-muted-foreground">{e.detail}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {e.actor} · {e.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Modals */}
      {modal?.kind === "risk" ? (
        <Modal title="Risk score cause breakdown" onClose={() => setModal(null)}>
          <p className="text-xs text-muted-foreground">
            Composite score {app.riskScore} / 100. Weightings derive from process class, documentary
            gaps, incident history and inspection record.
          </p>
          <div className="mt-4 space-y-3">
            {app.riskCauses.map((c) => (
              <div key={c.cause} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium">{c.cause}</p>
                  <Pill tone={c.weight < 0 ? "success" : c.weight >= 15 ? "danger" : "warning"}>
                    {c.weight > 0 ? `+${c.weight}` : c.weight}
                  </Pill>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{c.detail}</p>
                <div className="mt-2">
                  <ScoreBar
                    value={Math.abs(c.weight) * 4}
                    tone={c.weight < 0 ? "success" : c.weight >= 15 ? "danger" : "warning"}
                  />
                </div>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}

      {modal?.kind === "doc" ? (
        <Modal title={modal.doc.name} onClose={() => setModal(null)}>
          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/50 text-center">
              <FileText className="size-8 text-muted-foreground" />
              <p className="mt-2 text-xs font-medium">Document preview</p>
              <p className="mt-1 max-w-56 text-[11px] text-muted-foreground">
                {modal.doc.status === "missing"
                  ? "No file has been uploaded against this requirement."
                  : "Rendered preview of the submitted PDF (demo placeholder)."}
              </p>
            </div>
            <div className="space-y-2 text-[11px]">
              <KV k="Reference" v={modal.doc.ref} />
              <KV k="Issuer" v={modal.doc.issuer} />
              <KV k="Issued" v={modal.doc.issued} />
              <KV k="Expires" v={modal.doc.expires ?? "No expiry"} />
              <div className="pt-1">
                <Pill
                  tone={
                    modal.doc.status === "valid"
                      ? "success"
                      : modal.doc.status === "expiring"
                        ? "warning"
                        : "danger"
                  }
                >
                  {modal.doc.status}
                </Pill>
              </div>
              <button
                disabled={readOnly}
                onClick={() => {
                  log("Document verified", `${app.id} · ${modal.doc.ref}`, `${modal.doc.name} accepted.`);
                  notify(`${modal.doc.name} marked verified`);
                  setModal(null);
                }}
                className="mt-2 w-full rounded-xl bg-primary px-3 py-2 text-[11px] font-medium text-primary-foreground disabled:opacity-40"
              >
                Accept document
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {modal?.kind === "info" ? (
        <InfoRequestModal
          section={modal.section}
          onClose={() => setModal(null)}
          onSubmit={(text) => {
            setReview(app.id, modal.section, "info_requested");
            log("Information requested", `${app.id} · ${sectionLabel(modal.section)}`, text);
            notify("Information request sent to applicant");
            setModal(null);
          }}
        />
      ) : null}

      {modal?.kind === "nc" ? (
        <NCModal
          section={modal.section}
          onClose={() => setModal(null)}
          onSubmit={(title, detail, severity, due) => {
            const id = addNonConformity({
              applicationId: app.id,
              company: app.company,
              section: modal.section,
              severity,
              title,
              detail,
              due,
            });
            log("Non-conformity raised", `${id}`, `${severity} NC on ${sectionLabel(modal.section)}.`);
            notify(`${id} raised`);
            setModal(null);
          }}
        />
      ) : null}

      {modal?.kind === "evidence" ? (
        <EvidenceModal
          nc={nonConformities.find((n) => n.id === modal.ncId)!}
          onClose={() => setModal(null)}
          onDecide={(accept) => {
            closeNonConformity(modal.ncId, accept);
            log(
              accept ? "Corrective action accepted" : "Corrective action rejected",
              modal.ncId,
              accept ? "Evidence accepted; non-conformity closed." : "Evidence insufficient; NC remains open.",
            );
            notify(accept ? `${modal.ncId} closed` : `${modal.ncId} kept open`);
            setModal(null);
          }}
        />
      ) : null}

      {modal?.kind === "decision" ? (
        <DecisionModal
          onClose={() => setModal(null)}
          onSubmit={(d, note) => {
            decide(app.id, d, note);
            log("Decision issued", app.id, `${d}. ${note}`);
            notify(`Decision recorded: ${d}`);
            setModal(null);
          }}
        />
      ) : null}
    </>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">{k}</p>
      <p className="font-medium">{v}</p>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-border pb-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}

function ActionBtn({
  label,
  icon,
  onClick,
  tone,
  disabled,
  className,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tone: "success" | "danger" | "warning" | "info" | "neutral";
  disabled?: boolean;
  className?: string;
}) {
  const tones = {
    success: "border-success bg-success/50 text-success-foreground",
    danger: "border-destructive/50 bg-destructive/15 text-destructive-foreground",
    warning: "border-warning/60 bg-warning/20 text-warning-foreground",
    info: "border-secondary bg-secondary text-secondary-foreground",
    neutral: "border-border bg-muted text-foreground",
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-medium transition-opacity hover:opacity-85 disabled:opacity-35",
        tones[tone],
        className,
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-[0_30px_80px_-30px_rgba(16,30,61,0.7)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InfoRequestModal({
  section,
  onClose,
  onSubmit,
}: {
  section: SectionKey;
  onClose: () => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = React.useState("");
  return (
    <Modal title={`Request information — ${sectionLabel(section)}`} onClose={onClose}>
      <p className="text-xs text-muted-foreground">
        The applicant receives a itemised request and the section moves to “Information requested”.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Describe precisely what must be supplied, e.g. 110% bund capacity calculation for the acid reagent store, signed by the EMP consultant."
        className="mt-3 w-full rounded-2xl border border-border bg-muted/40 p-3 text-xs outline-none focus:border-ring"
      />
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-xs">
          Cancel
        </button>
        <button
          disabled={!text.trim()}
          onClick={() => onSubmit(text)}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40"
        >
          Send request
        </button>
      </div>
    </Modal>
  );
}

function NCModal({
  section,
  onClose,
  onSubmit,
}: {
  section: SectionKey;
  onClose: () => void;
  onSubmit: (t: string, d: string, s: "Minor" | "Major" | "Critical", due: string) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [detail, setDetail] = React.useState("");
  const [severity, setSeverity] = React.useState<"Minor" | "Major" | "Critical">("Major");
  const [due, setDue] = React.useState("2026-09-15");
  return (
    <Modal title={`Raise non-conformity — ${sectionLabel(section)}`} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Finding title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs outline-none focus:border-ring"
            placeholder="e.g. Effluent containment bund capacity not demonstrated"
          />
        </Field>
        <Field label="Detail and regulatory basis">
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-border bg-muted/40 p-3 text-xs outline-none focus:border-ring"
            placeholder="Reference the requirement not met and the evidence gap observed."
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Severity">
            <div className="flex gap-1.5">
              {(["Minor", "Major", "Critical"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={cn(
                    "flex-1 rounded-xl border px-2 py-2 text-[11px] font-medium",
                    severity === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Corrective action due">
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs outline-none focus:border-ring"
            />
          </Field>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-xs">
          Cancel
        </button>
        <button
          disabled={!title.trim()}
          onClick={() => onSubmit(title, detail, severity, due)}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40"
        >
          Raise non-conformity
        </button>
      </div>
    </Modal>
  );
}

function EvidenceModal({
  nc,
  onClose,
  onDecide,
}: {
  nc: { id: string; title: string; evidence?: { name: string; submitted: string; note: string } };
  onClose: () => void;
  onDecide: (accept: boolean) => void;
}) {
  return (
    <Modal title={`Corrective-action evidence — ${nc.id}`} onClose={onClose}>
      <p className="text-xs font-medium">{nc.title}</p>
      <div className="mt-3 rounded-2xl border border-border p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-muted">
            <FileText className="size-4 text-primary" />
          </span>
          <div>
            <p className="text-xs font-medium">{nc.evidence?.name}</p>
            <p className="text-[11px] text-muted-foreground">Submitted {nc.evidence?.submitted}</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">{nc.evidence?.note}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["Photo 1", "Photo 2", "Manifest"].map((p) => (
            <div
              key={p}
              className="flex h-20 items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 text-[10px] text-muted-foreground"
            >
              {p}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => onDecide(false)}
          className="rounded-xl border border-destructive/50 bg-destructive/15 px-4 py-2 text-xs font-medium text-destructive-foreground"
        >
          Evidence insufficient
        </button>
        <button
          onClick={() => onDecide(true)}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
        >
          Accept and close NC
        </button>
      </div>
    </Modal>
  );
}

const DECISIONS = [
  {
    key: "Approved" as const,
    blurb: "All sections verified, no open critical findings. Processor added to the register.",
  },
  {
    key: "Conditional Approval" as const,
    blurb: "Approved subject to closure of outstanding non-conformities within the stated period.",
  },
  {
    key: "More Info Required" as const,
    blurb: "Application returned to applicant pending specific additional evidence.",
  },
  { key: "Rejected" as const, blurb: "Application fails one or more mandatory requirements." },
];

function DecisionModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (d: (typeof DECISIONS)[number]["key"], note: string) => void;
}) {
  const [choice, setChoice] = React.useState<(typeof DECISIONS)[number]["key"]>("Conditional Approval");
  const [note, setNote] = React.useState("");
  return (
    <Modal title="Reach a compliance decision" onClose={onClose}>
      <div className="space-y-2">
        {DECISIONS.map((d) => (
          <button
            key={d.key}
            onClick={() => setChoice(d.key)}
            className={cn(
              "w-full rounded-2xl border p-3 text-left",
              choice === d.key ? "border-primary bg-accent" : "border-border hover:bg-accent/60",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-3 rounded-full border",
                  choice === d.key ? "border-primary bg-primary" : "border-border",
                )}
              />
              <p className="text-xs font-semibold">{d.key}</p>
            </div>
            <p className="mt-1 pl-5 text-[11px] text-muted-foreground">{d.blurb}</p>
          </button>
        ))}
      </div>
      <Field label="Decision rationale" className="mt-4">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-border bg-muted/40 p-3 text-xs outline-none focus:border-ring"
          placeholder="Summarise the basis for the decision and any conditions attached."
        />
      </Field>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-xs">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(choice, note)}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
        >
          Record decision
        </button>
      </div>
    </Modal>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

const EQUIPMENT = [
  { tag: "LT-01", item: "Leach tank train (3 × 25 m³)", serial: "LT-NG-22841", cert: "Integrity test 2025-08", status: "Verified" },
  { tag: "SX-02", item: "Solvent extraction mixer-settler", serial: "SX-4471", cert: "OEM commissioning report", status: "Verified" },
  { tag: "PV-03", item: "Pressure vessel, reagent dosing", serial: "PV-9920", cert: "PVI-2025-08 (expiring)", status: "Attention" },
  { tag: "WB-04", item: "Weighbridge 60t", serial: "WB-2201", cert: "WB-CAL-2026-19", status: "Verified" },
  { tag: "XRF-05", item: "Benchtop XRF analyser", serial: "XRF-7781", cert: "XRF-CAL-2026-2", status: "Verified" },
];

function EquipmentVerification() {
  const [checked, setChecked] = React.useState<string[]>(["LT-01", "SX-02"]);
  const toggle = (t: string) =>
    setChecked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  return (
    <Panel className="mt-4">
      <PanelHeader
        title="Equipment verification checklist"
        subtitle={`${checked.length} of ${EQUIPMENT.length} assets physically verified`}
        icon={<Settings2 className="size-4" />}
      />
      <div className="divide-y divide-border">
        {EQUIPMENT.map((e) => (
          <label key={e.tag} className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-accent/50">
            <input
              type="checkbox"
              checked={checked.includes(e.tag)}
              onChange={() => toggle(e.tag)}
              className="size-4 accent-[oklch(0.243_0.062_266)]"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium">
                {e.tag} · {e.item}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Serial {e.serial} · {e.cert}
              </span>
            </span>
            <Pill tone={e.status === "Verified" ? "success" : "warning"}>{e.status}</Pill>
          </label>
        ))}
      </div>
    </Panel>
  );
}

function InspectionPanel({ appId }: { appId: string }) {
  const { inspections } = useAppState();
  const rows = inspections.filter((i) => i.applicationId === appId);
  return (
    <Panel className="mt-4">
      <PanelHeader
        title="Inspection record"
        subtitle="Site visits linked to this application"
        icon={<ClipboardCheck className="size-4" />}
      />
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-center text-xs text-muted-foreground">
          No inspection raised. Use “Flag for inspection” to place this applicant in the queue.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {rows.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">
                  {i.id} · {i.type}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {i.scheduled} · Inspector: {i.inspector}
                </p>
              </div>
              <Pill tone={statusTone(i.status)}>{i.status}</Pill>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
