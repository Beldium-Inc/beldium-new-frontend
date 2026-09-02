import * as React from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  FlaskConical,
  ShieldAlert,
  UserCheck,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/beldium/shell";
import {
  EmptyState,
  Field,
  PageHeader,
  Pill,
  SectionTitle,
  StatusPill,
  Surface,
} from "@/components/beldium/ui";
import { useBeldium } from "@/lib/beldium/store";
import type { ApplicationStatus, PartnerDocument } from "@/lib/beldium/types";

export const Route = createFileRoute("/applications/$id")({
  head: () => ({
    meta: [
      { title: "Application verification — Beldium" },
      {
        name: "description",
        content:
          "Verify organisation profile, professional capability, laboratory accreditation and scope, conditional documents and risk flags before deciding on a partner application.",
      },
      { property: "og:title", content: "Application verification — Beldium" },
      {
        property: "og:description",
        content: "Document-by-document verification with a complete decision audit trail.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <ApplicationDetail />
    </AppShell>
  ),
});

const tabs = [
  { key: "organisation", label: "Organisation", icon: Building2 },
  { key: "capability", label: "Professional capability", icon: UserCheck },
  { key: "laboratory", label: "Laboratory & scope", icon: FlaskConical },
  { key: "documents", label: "Documents", icon: CheckCircle2 },
  { key: "risk", label: "Risk & decision", icon: ShieldAlert },
] as const;

type TabKey = (typeof tabs)[number]["key"];

function ApplicationDetail() {
  const { id } = useParams({ from: "/applications/$id" });
  const { state, role, setDocStatus, resolveFlag, decideApplication, assignApplication, raiseNonConformity } =
    useBeldium();
  const [tab, setTab] = React.useState<TabKey>("organisation");
  const [note, setNote] = React.useState("");

  const app = state.applications.find((a) => a.id === id);
  const canDecide = role === "operator";

  if (!app) {
    return (
      <Surface>
        <EmptyState title="Application not found" hint="It may have been removed from the queue." />
      </Surface>
    );
  }

  const docsByCategory = (cat: PartnerDocument["category"]) =>
    app.documents.filter((d) => d.category === cat);

  const decide = (status: ApplicationStatus) => {
    decideApplication(app.id, status, note);
    setNote("");
    toast.success(
      status === "approved"
        ? `${app.organisation.legalName} listed as a Quality & Control Partner`
        : status === "rejected"
          ? "Application rejected and applicant notified"
          : "Information request sent to applicant",
    );
  };

  return (
    <>
      <Link
        to="/applications"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-link hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to queue
      </Link>

      <PageHeader
        eyebrow={app.ref}
        title={app.organisation.legalName}
        description={`${app.laboratory.facility} · ${app.organisation.city}, ${app.organisation.country} · submitted ${app.submittedAt}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={app.riskScore > 50 ? "danger" : app.riskScore > 25 ? "warning" : "success"}>
              risk score {app.riskScore}
            </Pill>
            <StatusPill value={app.status} />
            {canDecide && app.status === "submitted" ? (
              <button
                type="button"
                onClick={() => {
                  assignApplication(app.id);
                  toast.success("Application assigned to you");
                }}
                className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-navy-foreground hover:bg-navy/90"
              >
                Take review
              </button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={
                    tab === t.key
                      ? "inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-navy-foreground"
                      : "inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground hover:border-link hover:text-link"
                  }
                >
                  <Icon className="size-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === "organisation" ? (
            <div className="space-y-6">
              <Surface>
                <SectionTitle title="Organisation profile" hint="Legal identity checked against registry data" />
                <dl className="grid gap-5 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Legal name" value={app.organisation.legalName} />
                  <Field label="Trading name" value={app.organisation.tradingName} />
                  <Field label="Registration no." value={app.organisation.registrationNo} />
                  <Field label="Incorporated" value={app.organisation.incorporated} />
                  <Field label="Jurisdiction" value={`${app.organisation.city}, ${app.organisation.country}`} />
                  <Field
                    label="Website"
                    value={<span className="text-link">{app.organisation.website}</span>}
                  />
                  <Field label="Primary contact" value={app.organisation.contact.name} />
                  <Field label="Email" value={app.organisation.contact.email} />
                  <Field label="Phone" value={app.organisation.contact.phone} />
                </dl>
              </Surface>

              <Surface>
                <SectionTitle title="Beneficial ownership" hint="Screened against PEP and sanctions lists" />
                <div className="divide-y divide-border">
                  {app.organisation.beneficialOwners.map((o) => (
                    <div key={o.name} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-navy">{o.name}</p>
                        <p className="text-xs text-muted-foreground">{o.share}% holding</p>
                      </div>
                      {o.pep ? <Pill tone="warning">PEP match</Pill> : <Pill tone="success">clear</Pill>}
                    </div>
                  ))}
                </div>
              </Surface>
            </div>
          ) : null}

          {tab === "capability" ? (
            <div className="space-y-6">
              <Surface>
                <SectionTitle title="Lead assessor" hint="Professional competence for material assessment" />
                <dl className="grid gap-5 px-6 py-5 sm:grid-cols-2">
                  <Field label="Name" value={app.capability.leadAssessor} />
                  <Field label="Credential" value={app.capability.credential} />
                  <Field label="Experience" value={`${app.capability.yearsExperience} years`} />
                  <Field label="Registry" value={`${app.capability.registry} (${app.capability.registryId})`} />
                </dl>
              </Surface>
              <Surface>
                <SectionTitle title="Technical staff competency" hint="Signed-off competency per declared method" />
                <div className="divide-y divide-border">
                  {app.capability.staff.map((s) => (
                    <div key={s.name} className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-navy">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.role} · {s.competency}
                        </p>
                      </div>
                      {s.verified ? (
                        <Pill tone="success">
                          <CheckCircle2 className="size-3" /> verified
                        </Pill>
                      ) : (
                        <Pill tone="danger">
                          <XCircle className="size-3" /> sign-off missing
                        </Pill>
                      )}
                    </div>
                  ))}
                </div>
              </Surface>
            </div>
          ) : null}

          {tab === "laboratory" ? (
            <div className="space-y-6">
              <Surface>
                <SectionTitle title="Facility accreditation" hint="Checked against the accreditation body register" />
                <dl className="grid gap-5 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Facility" value={app.laboratory.facility} />
                  <Field label="Standard" value={app.laboratory.accreditation} />
                  <Field label="Body" value={app.laboratory.accreditationBody} />
                  <Field label="Certificate no." value={app.laboratory.certificateNo} />
                  <Field label="Valid until" value={app.laboratory.validUntil} />
                  <Field label="Last surveillance" value={app.laboratory.lastSurveillance} />
                  <Field label="Proficiency testing" value={app.laboratory.proficiencyTesting} />
                </dl>
              </Surface>
              <Surface>
                <SectionTitle
                  title="Accredited scope"
                  hint="Only accredited method/matrix pairs may back a Beldium certificate"
                />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                        <th className="px-6 py-3 font-semibold">Method</th>
                        <th className="px-6 py-3 font-semibold">Matrix</th>
                        <th className="px-6 py-3 font-semibold">Analyte</th>
                        <th className="px-6 py-3 font-semibold">LOQ</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {app.laboratory.scope.map((s) => (
                        <tr key={s.method + s.matrix}>
                          <td className="px-6 py-3 font-medium text-navy">{s.method}</td>
                          <td className="px-6 py-3 text-muted-foreground">{s.matrix}</td>
                          <td className="px-6 py-3 text-muted-foreground">{s.analyte}</td>
                          <td className="px-6 py-3 text-muted-foreground">{s.loq}</td>
                          <td className="px-6 py-3">
                            {s.accredited ? (
                              <Pill tone="success">in scope</Pill>
                            ) : (
                              <Pill tone="danger">outside annex</Pill>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Surface>
            </div>
          ) : null}

          {tab === "documents" ? (
            <div className="space-y-6">
              {(
                [
                  ["organisation", "Organisation documents"],
                  ["professional", "Professional capability documents"],
                  ["laboratory", "Laboratory & accreditation documents"],
                  ["conditional", "Conditional documents"],
                ] as const
              ).map(([cat, label]) => (
                <Surface key={cat}>
                  <SectionTitle
                    title={label}
                    hint={
                      cat === "conditional"
                        ? "Required only because of the declared scope or jurisdiction"
                        : undefined
                    }
                  />
                  <div className="divide-y divide-border">
                    {docsByCategory(cat).length === 0 ? (
                      <EmptyState title="No documents in this category" />
                    ) : (
                      docsByCategory(cat).map((d) => (
                        <div key={d.id} className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-navy">{d.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {d.reference} · issued by {d.issuer} on {d.issued}
                              {d.expires ? ` · expires ${d.expires}` : " · no expiry"}
                            </p>
                            {d.conditionalOn ? (
                              <p className="mt-1 text-xs text-link">Triggered by: {d.conditionalOn}</p>
                            ) : null}
                            {d.note ? (
                              <p className="mt-1 text-xs text-warning-foreground">{d.note}</p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusPill value={d.status} />
                            {canDecide ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDocStatus(app.id, d.id, "verified");
                                    toast.success(`${d.name} verified`);
                                  }}
                                  className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-navy hover:border-link hover:text-link"
                                >
                                  Verify
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDocStatus(app.id, d.id, "flagged");
                                    toast("Document flagged for follow-up");
                                  }}
                                  className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-danger-foreground hover:border-danger"
                                >
                                  Flag
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Surface>
              ))}
            </div>
          ) : null}

          {tab === "risk" ? (
            <div className="space-y-6">
              <Surface>
                <SectionTitle title="Risk flags" hint="Automated screening adjudicated by the operator" />
                <div className="divide-y divide-border">
                  {app.riskFlags.length === 0 ? (
                    <EmptyState title="No risk flags raised" hint="Screening returned a clean profile." />
                  ) : (
                    app.riskFlags.map((f) => (
                      <div key={f.id} className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
                        <div className="flex gap-3">
                          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
                          <div>
                            <p className="text-sm font-medium text-navy">{f.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{f.detail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusPill value={f.severity} />
                          {f.resolved ? (
                            <Pill tone="success">cleared</Pill>
                          ) : canDecide ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  resolveFlag(app.id, f.id);
                                  toast.success("Flag cleared, risk score reduced");
                                }}
                                className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-navy hover:border-link hover:text-link"
                              >
                                Clear
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  raiseNonConformity({
                                    title: f.title,
                                    against: app.organisation.legalName,
                                    severity: f.severity === "high" ? "major" : "minor",
                                    detail: f.detail,
                                  });
                                  toast.success("Non-conformity raised");
                                }}
                                className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-navy hover:border-link hover:text-link"
                              >
                                Raise NCR
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Surface>

              <Surface>
                <SectionTitle title="Decision" hint="Recorded permanently in the audit trail" />
                {canDecide ? (
                  <div className="px-6 py-5">
                    <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Decision rationale
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={4}
                      placeholder="Summarise the evidence relied upon, outstanding conditions and the scope granted."
                      className="mt-2 w-full rounded-2xl border border-border bg-background p-3 text-sm outline-none focus:border-link"
                    />
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => decide("approved")}
                        className="rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-navy-foreground hover:bg-navy/90"
                      >
                        Approve &amp; list partner
                      </button>
                      <button
                        type="button"
                        onClick={() => decide("info_requested")}
                        className="rounded-xl border border-warning bg-warning/20 px-4 py-2.5 text-sm font-semibold text-warning-foreground"
                      >
                        Request information
                      </button>
                      <button
                        type="button"
                        onClick={() => decide("rejected")}
                        className="rounded-xl border border-danger bg-danger/15 px-4 py-2.5 text-sm font-semibold text-danger-foreground"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-5 text-sm text-muted-foreground">
                    Decisions are reserved for compliance operators. Current status:{" "}
                    <StatusPill value={app.status} />
                  </div>
                )}
                {app.decisionNote ? (
                  <div className="mx-6 mb-6 rounded-2xl bg-pale/60 p-4 text-sm text-navy">
                    <p className="text-xs font-semibold tracking-wide uppercase">Last recorded rationale</p>
                    <p className="mt-1">{app.decisionNote}</p>
                  </div>
                ) : null}
              </Surface>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <Surface>
            <SectionTitle title="Verification progress" />
            <div className="space-y-3 px-6 py-5">
              {(
                [
                  ["Organisation", "organisation"],
                  ["Professional", "professional"],
                  ["Laboratory", "laboratory"],
                  ["Conditional", "conditional"],
                ] as const
              ).map(([label, cat]) => {
                const docs = docsByCategory(cat);
                const done = docs.filter((d) => d.status === "verified").length;
                const pct = docs.length ? Math.round((done / docs.length) * 100) : 100;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-navy">{label}</span>
                      <span className="text-muted-foreground">
                        {done}/{docs.length}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-link transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Surface>

          <Surface>
            <SectionTitle title="Audit trail" hint="Append-only decision record" />
            <ol className="space-y-4 px-6 py-5">
              {[...app.audit].reverse().map((e) => (
                <li key={e.id} className="relative border-l border-border pl-4">
                  <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-link" />
                  <p className="text-sm font-medium text-navy">{e.action}</p>
                  <p className="text-xs text-muted-foreground">{e.detail}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {e.actor} · {e.at}
                  </p>
                </li>
              ))}
            </ol>
          </Surface>
        </div>
      </div>
    </>
  );
}
