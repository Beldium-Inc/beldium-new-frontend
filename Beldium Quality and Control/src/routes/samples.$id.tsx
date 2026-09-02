import * as React from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck, Truck } from "lucide-react";
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
import { buyerSpecs, useBeldium } from "@/lib/beldium/store";
import type { ResultVerdict } from "@/lib/beldium/types";

export const Route = createFileRoute("/samples/$id")({
  head: () => ({
    meta: [
      { title: "Sample dossier — Beldium" },
      {
        name: "description",
        content:
          "Custody timeline, test request, analytical results, buyer specification matching and quality review for a single sealed sample.",
      },
      { property: "og:title", content: "Sample dossier — Beldium" },
      {
        property: "og:description",
        content: "Custody timeline, results, buyer-spec matching and quality review in one dossier.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <SampleDetail />
    </AppShell>
  ),
});

const methodOptions = [
  "ICP-MS (Sn, As, Pb)",
  "XRF (Ta2O5, Nb2O5)",
  "Fire assay (Au)",
  "Moisture gravimetric",
  "Gamma screen (U/Th)",
];

function SampleDetail() {
  const { id } = useParams({ from: "/samples/$id" });
  const navigate = useNavigate();
  const {
    state,
    role,
    addCustody,
    createTestRequest,
    setResultVerdict,
    submitQualityReview,
    issueCertificate,
    raiseNonConformity,
  } = useBeldium();

  const sample = state.samples.find((s) => s.id === id);
  const [methods, setMethods] = React.useState<string[]>([methodOptions[0]!]);
  const [priority, setPriority] = React.useState<"standard" | "expedited">("standard");
  const [reviewNote, setReviewNote] = React.useState("");

  if (!sample) {
    return (
      <Surface>
        <EmptyState title="Sample not found" />
      </Surface>
    );
  }

  const spec = buyerSpecs.find((s) => s.id === sample.buyerSpecId);
  const isPartner = role === "partner";
  const isMiner = role === "miner";
  const isOperator = role === "operator";
  const cert = state.certificates.find((c) => c.sampleRef === sample.ref);

  const verdicts: ResultVerdict[] = ["pass", "conditional", "fail", "pending"];

  return (
    <>
      <Link
        to="/samples"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-link hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to samples
      </Link>

      <PageHeader
        eyebrow={sample.ref}
        title={`${sample.material} · lot ${sample.lot}`}
        description={`${sample.mineSite}, ${sample.origin} · ${sample.massKg} kg · registered ${sample.registeredAt}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill value={sample.status} />
            {cert ? (
              <Link
                to="/certificates/$id"
                params={{ id: cert.id }}
                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-link"
              >
                View certificate
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Surface>
            <SectionTitle title="Sample registration" hint="Identity fixed at the moment of sealing" />
            <dl className="grid gap-5 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Sample ref" value={sample.ref} />
              <Field label="Lot" value={sample.lot} />
              <Field label="Producer" value={sample.minerOrg} />
              <Field label="Quality partner" value={sample.partnerOrg} />
              <Field label="Buyer" value={sample.buyerOrg} />
              <Field label="Specification" value={spec?.name ?? "—"} />
            </dl>
          </Surface>

          <Surface>
            <SectionTitle
              title="Chain of custody"
              hint="Each event is hashed; a broken seal invalidates downstream results"
              action={
                isMiner || isPartner ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        addCustody(sample.id, "Handover to transporter", "Regional depot", true);
                        toast.success("Custody event recorded");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-navy hover:border-link hover:text-link"
                    >
                      <Truck className="size-3.5" /> Handover
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        addCustody(sample.id, "Received at laboratory", sample.partnerOrg, true);
                        toast.success("Receipt recorded at laboratory");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-navy hover:border-link hover:text-link"
                    >
                      <ShieldCheck className="size-3.5" /> Receive
                    </button>
                  </div>
                ) : null
              }
            />
            <ol className="space-y-5 px-6 py-5">
              {sample.custody.map((c) => (
                <li key={c.id} className="relative border-l-2 border-pale pl-5">
                  <span className="absolute -left-[7px] top-1.5 size-3 rounded-full bg-link" />
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-navy">{c.action}</p>
                    {c.sealIntact ? (
                      <Pill tone="success">seal intact</Pill>
                    ) : (
                      <Pill tone="danger">seal broken</Pill>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.location} · {c.actor} · {c.at}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{c.hash}</p>
                </li>
              ))}
            </ol>
          </Surface>

          <Surface>
            <SectionTitle title="Test request" hint="Methods must fall inside the partner's accredited scope" />
            {sample.testRequest ? (
              <dl className="grid gap-5 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Requested" value={sample.testRequest.requestedAt} />
                <Field label="Priority" value={sample.testRequest.priority} />
                <Field label="Turnaround" value={sample.testRequest.turnaround} />
                <Field label="Methods" value={sample.testRequest.methods.join(", ")} />
                <Field label="Status" value={<StatusPill value={sample.testRequest.status} />} />
              </dl>
            ) : isMiner || isPartner || isOperator ? (
              <div className="px-6 py-5">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Select methods
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {methodOptions.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        setMethods((prev) =>
                          prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
                        )
                      }
                      className={
                        methods.includes(m)
                          ? "rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-navy-foreground"
                          : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-link"
                      }
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as "standard" | "expedited")}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-link"
                  >
                    <option value="standard">Standard · 5 working days</option>
                    <option value="expedited">Expedited · 48 hours</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (methods.length === 0) {
                        toast.error("Select at least one method");
                        return;
                      }
                      createTestRequest(sample.id, {
                        methods,
                        priority,
                        turnaround: priority === "expedited" ? "48 hours" : "5 working days",
                      });
                      toast.success("Test request submitted to the laboratory");
                    }}
                    className="rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-navy-foreground hover:bg-navy/90"
                  >
                    Submit test request
                  </button>
                </div>
              </div>
            ) : (
              <EmptyState title="No test request raised yet" />
            )}
          </Surface>

          <Surface>
            <SectionTitle
              title="Results review"
              hint="Each analyte is judged against the buyer specification with measurement uncertainty"
            />
            {sample.results.length === 0 ? (
              <EmptyState title="No results recorded" hint="Results appear once testing begins." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                      <th className="px-6 py-3 font-semibold">Analyte</th>
                      <th className="px-6 py-3 font-semibold">Method</th>
                      <th className="px-6 py-3 font-semibold">Result</th>
                      <th className="px-6 py-3 font-semibold">Specification</th>
                      <th className="px-6 py-3 font-semibold">Verdict</th>
                      {isPartner ? <th className="px-6 py-3 font-semibold">Set</th> : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sample.results.map((r) => (
                      <tr key={r.id}>
                        <td className="px-6 py-3 font-medium text-navy">{r.analyte}</td>
                        <td className="px-6 py-3 text-muted-foreground">{r.method}</td>
                        <td className="px-6 py-3 text-navy">
                          {r.value} {r.unit}{" "}
                          <span className="text-xs text-muted-foreground">{r.uncertainty}</span>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{r.spec}</td>
                        <td className="px-6 py-3">
                          <StatusPill value={r.verdict} />
                        </td>
                        {isPartner ? (
                          <td className="px-6 py-3">
                            <select
                              value={r.verdict}
                              onChange={(e) => {
                                setResultVerdict(sample.id, r.id, e.target.value as ResultVerdict);
                                toast.success(`${r.analyte} marked ${e.target.value}`);
                              }}
                              className="rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-link"
                            >
                              {verdicts.map((v) => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Surface>

          <Surface>
            <SectionTitle title="Quality review" hint="Independent technical sign-off before certification" />
            {sample.qualityReview ? (
              <div className="px-6 py-5">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill value={sample.qualityReview.verdict} />
                  <p className="text-sm text-navy">
                    {sample.qualityReview.reviewer} · {sample.qualityReview.at}
                  </p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{sample.qualityReview.note}</p>
              </div>
            ) : isPartner ? (
              <div className="px-6 py-5">
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Technical justification for the overall verdict."
                  className="w-full rounded-2xl border border-border bg-background p-3 text-sm outline-none focus:border-link"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["pass", "conditional", "fail"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        submitQualityReview(sample.id, v, reviewNote);
                        setReviewNote("");
                        toast.success(`Quality review recorded: ${v}`);
                      }}
                      className={
                        v === "pass"
                          ? "rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-navy-foreground"
                          : v === "conditional"
                            ? "rounded-xl border border-warning bg-warning/20 px-4 py-2.5 text-sm font-semibold text-warning-foreground"
                            : "rounded-xl border border-danger bg-danger/15 px-4 py-2.5 text-sm font-semibold text-danger-foreground"
                      }
                    >
                      Record {v}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Awaiting laboratory quality review" />
            )}
          </Surface>
        </div>

        <div className="space-y-6">
          <Surface>
            <SectionTitle title="Buyer specification matching" hint={spec?.name ?? ""} />
            <div className="divide-y divide-border">
              {(spec?.limits ?? []).map((l) => {
                const res = sample.results.find((r) => r.analyte === l.analyte);
                return (
                  <div key={l.analyte} className="flex items-center justify-between gap-2 px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-navy">{l.analyte}</p>
                      <p className="text-xs text-muted-foreground">{l.rule}</p>
                    </div>
                    {res ? <StatusPill value={res.verdict} /> : <Pill tone="neutral">no data</Pill>}
                  </div>
                );
              })}
            </div>
          </Surface>

          <Surface>
            <SectionTitle title="Certification" />
            <div className="px-6 py-5">
              {cert ? (
                <div>
                  <p className="text-sm font-semibold text-navy">{cert.ref}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Issued {cert.issuedAt} by {cert.issuedBy}
                  </p>
                  <div className="mt-2">
                    <StatusPill value={cert.status} />
                  </div>
                </div>
              ) : isPartner && sample.qualityReview && sample.qualityReview.verdict !== "fail" ? (
                <button
                  type="button"
                  onClick={() => {
                    const newId = issueCertificate(sample.id);
                    toast.success("Certificate issued");
                    navigate({ to: "/certificates/$id", params: { id: newId } });
                  }}
                  className="w-full rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-navy-foreground hover:bg-navy/90"
                >
                  Issue certificate
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  A certificate can be issued once the laboratory records a passing or conditional
                  quality review.
                </p>
              )}
              {isOperator ? (
                <button
                  type="button"
                  onClick={() => {
                    raiseNonConformity({
                      title: `Deviation on ${sample.ref}`,
                      against: sample.partnerOrg,
                      severity: "major",
                      detail: `Raised from sample dossier ${sample.ref} (${sample.material}, lot ${sample.lot}).`,
                    });
                    toast.success("Non-conformity raised against the partner");
                  }}
                  className="mt-3 w-full rounded-xl border border-danger bg-danger/10 px-4 py-2.5 text-sm font-semibold text-danger-foreground"
                >
                  Raise non-conformity
                </button>
              ) : null}
            </div>
          </Surface>

          <Surface>
            <SectionTitle title="Sample audit trail" />
            <ol className="space-y-4 px-6 py-5">
              {[...sample.audit].reverse().map((e) => (
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
