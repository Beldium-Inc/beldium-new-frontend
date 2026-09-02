import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Flag,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { AppShell, Button, DemoNote, SectionCard } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtDate, fmtDateTime, fmtTonnes, fmtUsd, useDemo, type OperatorAction } from "@/lib/store";

export const Route = createFileRoute("/compliance/$id")({
  head: () => ({
    meta: [
      { title: "Application review — Beldium Compliance" },
      {
        name: "description",
        content:
          "Review corporate information, ownership, representatives, documents, risk and limits for a marketplace applicant.",
      },
      { property: "og:title", content: "Application review — Beldium Compliance" },
      {
        property: "og:description",
        content: "Verify, reject, request information, flag or escalate an onboarding application.",
      },
    ],
  }),
  component: ReviewDetail,
});

const ACTIONS: { key: OperatorAction; label: string; icon: typeof CheckCircle2; variant: "default" | "outline" | "destructive" }[] = [
  { key: "verify", label: "Verify", icon: CheckCircle2, variant: "default" },
  { key: "request_info", label: "Request information", icon: MessageSquare, variant: "outline" },
  { key: "flag", label: "Flag", icon: Flag, variant: "outline" },
  { key: "escalate", label: "Escalate", icon: ShieldAlert, variant: "outline" },
  { key: "reject", label: "Reject", icon: Ban, variant: "destructive" },
];

function ReviewDetail() {
  const { id } = Route.useParams();
  const { state, applyOperatorAction, updateLimits, addNonConformity, advanceNonConformity } = useDemo();
  const app = state.applications.find((a) => a.id === id);
  const isOperator = state.role === "operator";

  const [note, setNote] = useState("");
  const [ncTitle, setNcTitle] = useState("");
  const [ncSeverity, setNcSeverity] = useState<"Minor" | "Major" | "Critical">("Major");
  const [single, setSingle] = useState<string>("");
  const [monthly, setMonthly] = useState<string>("");

  if (!app) throw notFound();

  const run = (action: OperatorAction) => {
    applyOperatorAction(app.id, action, note);
    toast.success(`${action.replace(/_/g, " ")} recorded on ${app.id}`, {
      description: note || "Status updated and audit trail entry created.",
    });
    setNote("");
  };

  return (
    <AppShell
      title={app.entityName}
      subtitle={`${app.id} · ${app.type} applicant · ${app.jurisdiction}`}
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/compliance">
            <ArrowLeft className="size-4" /> Queue
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <div className="surface flex flex-wrap items-center gap-4 p-5">
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Current status</p>
              <div className="mt-1">
                <StatusBadge status={app.status} />
              </div>
            </div>
            <Divider />
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Risk</p>
              <p className="font-display mt-1 text-lg font-semibold">
                {app.riskScore}
                <span className="text-sm font-normal text-muted-foreground">/100 · {app.riskBand}</span>
              </p>
            </div>
            <Divider />
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Sanctions</p>
              <div className="mt-1">
                <StatusBadge status={app.sanctionsScreen} />
              </div>
            </div>
            <Divider />
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">PEP</p>
              <div className="mt-1">
                <StatusBadge status={app.pepScreen} />
              </div>
            </div>
            <Divider />
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Submitted</p>
              <p className="mt-1 text-sm font-medium">{fmtDate(app.submittedAt)}</p>
            </div>
          </div>

          <Tabs defaultValue="corporate">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="corporate">Corporate</TabsTrigger>
              <TabsTrigger value="ownership">Ownership</TabsTrigger>
              <TabsTrigger value="reps">Authorised reps</TabsTrigger>
              <TabsTrigger value="profile">
                {app.type === "OEM" ? "Demand profile" : "Business profile"}
              </TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="risk">Risk</TabsTrigger>
              <TabsTrigger value="limits">Limits</TabsTrigger>
              <TabsTrigger value="nc">Non-conformity</TabsTrigger>
              <TabsTrigger value="audit">Audit trail</TabsTrigger>
            </TabsList>

            <TabsContent value="corporate" className="mt-4">
              <SectionCard title="Corporate information" description="As declared and verified against registry extracts">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Field label="Registered name" value={app.entityName} />
                  <Field label="Applicant type" value={app.type} />
                  <Field label="Jurisdiction" value={app.jurisdiction} />
                  <Field label="Country of operation" value={app.country} />
                  <Field label="Registration number" value={app.registrationNo} />
                  <Field label="VAT / tax number" value={app.vatNo} />
                  <Field label="Incorporated" value={fmtDate(app.incorporated)} />
                  <Field label="Website" value={app.website} />
                  <Field label="Banking reference" value={app.profile.banking} />
                  <Field label="Logistics arrangement" value={app.profile.logistics} />
                </dl>
              </SectionCard>
            </TabsContent>

            <TabsContent value="ownership" className="mt-4">
              <SectionCard title="Ownership & control" description="Beneficial owners above 5%, with PEP flags">
                <Table
                  head={["Holder", "Type", "Country", "Holding", "PEP"]}
                  rows={app.ownership.map((o) => [
                    o.name,
                    o.type,
                    o.country,
                    `${o.pct}%`,
                    o.pep ? <StatusBadge key={o.name} status="review" /> : "No",
                  ])}
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  Aggregate declared holding: {app.ownership.reduce((s, o) => s + o.pct, 0)}%
                </p>
              </SectionCard>
            </TabsContent>

            <TabsContent value="reps" className="mt-4">
              <SectionCard title="Authorised representatives" description="Signatories permitted to bind the entity">
                <Table
                  head={["Name", "Role", "Email", "Phone", "ID verified"]}
                  rows={app.reps.map((r) => [
                    r.name,
                    r.role,
                    r.email,
                    r.phone,
                    r.idVerified ? (
                      <StatusBadge key={r.email} status="verified" />
                    ) : (
                      <StatusBadge key={r.email} status="pending" />
                    ),
                  ])}
                />
              </SectionCard>
            </TabsContent>

            <TabsContent value="profile" className="mt-4">
              <SectionCard
                title={app.type === "OEM" ? "Demand profile" : "Business profile"}
                description={app.profile.headline}
              >
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Field label="Commodities" value={app.profile.commodities.join(", ")} />
                  <Field
                    label={app.type === "Offtaker" ? "Annual offtake demand" : "Annual demand"}
                    value={fmtTonnes(app.profile.annualDemandTonnes ?? 0)}
                  />
                  <Field label="Target markets" value={app.profile.markets.join(", ")} />
                  <Field label="Years trading" value={String(app.profile.yearsTrading)} />
                  <Field label="Declared turnover" value={fmtUsd(app.profile.turnoverUsd)} />
                  <Field
                    label="Requested limit vs turnover"
                    value={`${(app.limits.proposedMonthlyUsd / app.profile.turnoverUsd).toFixed(2)}x`}
                  />
                </dl>
              </SectionCard>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <SectionCard title="Documents" description="KYC pack completeness and expiry tracking">
                <Table
                  head={["Document", "Category", "Uploaded", "Expires", "Status"]}
                  rows={app.documents.map((d) => [
                    d.name,
                    d.kind,
                    fmtDate(d.uploadedAt),
                    d.expires ? fmtDate(d.expires) : "—",
                    <StatusBadge key={d.id} status={d.status} />,
                  ])}
                />
              </SectionCard>
            </TabsContent>

            <TabsContent value="risk" className="mt-4">
              <SectionCard
                title="Risk explanation"
                description={`Model v3.2 — composite score ${app.riskScore}/100 (${app.riskBand} band)`}
              >
                <ul className="space-y-4">
                  {app.riskFactors.map((f) => (
                    <li key={f.label}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{f.label}</span>
                        <span className="text-muted-foreground">+{f.weight} pts</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, f.weight * 4)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{f.note}</p>
                    </li>
                  ))}
                </ul>
                <DemoNote>
                  Scores are illustrative. Bands: 0–29 Low, 30–59 Medium, 60+ High (enhanced due
                  diligence and committee sign-off required).
                </DemoNote>
              </SectionCard>
            </TabsContent>

            <TabsContent value="limits" className="mt-4">
              <SectionCard title="Transaction limits" description="Proposed by applicant, approved by the compliance desk">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Field label="Proposed single transaction" value={fmtUsd(app.limits.proposedSingleTxnUsd)} />
                  <Field label="Proposed monthly volume" value={fmtUsd(app.limits.proposedMonthlyUsd)} />
                  <Field
                    label="Approved single transaction"
                    value={app.limits.approvedSingleTxnUsd ? fmtUsd(app.limits.approvedSingleTxnUsd) : "Not approved"}
                  />
                  <Field
                    label="Approved monthly volume"
                    value={app.limits.approvedMonthlyUsd ? fmtUsd(app.limits.approvedMonthlyUsd) : "Not approved"}
                  />
                  <Field label="Settlement tenor" value={`${app.limits.tenorDays} days`} />
                </dl>
                {isOperator && (
                  <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <label className="text-sm">
                      <span className="mb-1 block text-muted-foreground">Approve single txn ($m)</span>
                      <Input value={single} onChange={(e) => setSingle(e.target.value)} placeholder="250" />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block text-muted-foreground">Approve monthly ($m)</span>
                      <Input value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="600" />
                    </label>
                    <Button
                      onClick={() => {
                        const s = Number(single) * 1e6;
                        const m = Number(monthly) * 1e6;
                        if (!s || !m) {
                          toast.error("Enter both limits in $ millions.");
                          return;
                        }
                        updateLimits(app.id, s, m);
                        setSingle("");
                        setMonthly("");
                        toast.success("Transaction limits updated");
                      }}
                    >
                      Apply limits
                    </Button>
                  </div>
                )}
              </SectionCard>
            </TabsContent>

            <TabsContent value="nc" className="mt-4">
              <SectionCard title="Non-conformity workflow" description="Raise → remediation → closed">
                <ul className="space-y-3">
                  {app.nonConformities.length === 0 && (
                    <li className="text-sm text-muted-foreground">No non-conformities recorded.</li>
                  )}
                  {app.nonConformities.map((nc) => (
                    <li key={nc.id} className="rounded-md border border-border p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{nc.title}</span>
                        <StatusBadge status={nc.status} />
                        <span className="ml-auto text-xs text-muted-foreground">
                          {nc.id} · {nc.severity} · raised {fmtDate(nc.raisedAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{nc.note}</p>
                      {isOperator && nc.status !== "closed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => {
                            advanceNonConformity(app.id, nc.id);
                            toast.success(
                              nc.status === "open"
                                ? `${nc.id} moved to remediation`
                                : `${nc.id} closed`,
                            );
                          }}
                        >
                          {nc.status === "open" ? "Move to remediation" : "Close non-conformity"}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>

                {isOperator && (
                  <div className="mt-5 space-y-3 border-t border-border pt-4">
                    <p className="text-sm font-medium">Raise a non-conformity</p>
                    <Input
                      value={ncTitle}
                      onChange={(e) => setNcTitle(e.target.value)}
                      placeholder="e.g. Certified UBO register outstanding"
                    />
                    <div className="flex flex-wrap gap-2">
                      {(["Minor", "Major", "Critical"] as const).map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={ncSeverity === s ? "default" : "outline"}
                          onClick={() => setNcSeverity(s)}
                        >
                          {s}
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        className="ml-auto"
                        onClick={() => {
                          if (!ncTitle.trim()) {
                            toast.error("Describe the non-conformity first.");
                            return;
                          }
                          addNonConformity(app.id, ncTitle, ncSeverity, note || "Remediation evidence required from applicant.");
                          setNcTitle("");
                          toast.success(`${ncSeverity} non-conformity raised`);
                        }}
                      >
                        <AlertTriangle className="size-4" /> Raise
                      </Button>
                    </div>
                  </div>
                )}
              </SectionCard>
            </TabsContent>

            <TabsContent value="audit" className="mt-4">
              <SectionCard title="Audit trail" description="Immutable record of decisions and screening events">
                <ol className="relative space-y-5 border-l border-border pl-5">
                  {app.audit.map((e) => (
                    <li key={e.id}>
                      <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-primary" />
                      <p className="text-sm font-medium">{e.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDateTime(e.at)} · {e.actor}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{e.detail}</p>
                    </li>
                  ))}
                </ol>
              </SectionCard>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-6">
          {isOperator ? (
            <SectionCard title="Decision" description="Actions are recorded in the audit trail">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reviewer note (optional) — rationale, conditions, information requested…"
                rows={4}
              />
              <div className="mt-3 grid gap-2">
                {ACTIONS.map((a) => (
                  <Button key={a.key} variant={a.variant} onClick={() => run(a.key)}>
                    <a.icon className="size-4" /> {a.label}
                  </Button>
                ))}
              </div>
              <DemoNote>
                Verify auto-approves the proposed limits; Flag and Reject zero them. Escalate routes
                the file to the credit & compliance committee.
              </DemoNote>
            </SectionCard>
          ) : (
            <SectionCard title="What happens next" description="Your onboarding progress">
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>Status: <StatusBadge status={app.status} /></li>
                <li>{app.nonConformities.filter((n) => n.status !== "closed").length} open item(s) requiring your action.</li>
                <li>Approved trading limit: {app.limits.approvedMonthlyUsd ? fmtUsd(app.limits.approvedMonthlyUsd) : "pending decision"} per month.</li>
              </ul>
            </SectionCard>
          )}

          <SectionCard title="Screening summary">
            <dl className="space-y-3 text-sm">
              <Field label="Sanctions lists" value={app.sanctionsScreen === "clear" ? "No matches" : "Manual review required"} />
              <Field label="PEP" value={app.pepScreen === "clear" ? "No matches" : "Potential match — see ownership"} />
              <Field label="Adverse media" value={app.riskBand === "High" ? "Findings present" : "No material findings"} />
              <Field label="Documents outstanding" value={String(app.documents.filter((d) => d.status !== "verified").length)} />
            </dl>
          </SectionCard>
        </aside>
      </div>
    </AppShell>
  );
}

function Divider() {
  return <span className="hidden h-10 w-px bg-border sm:block" />;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium break-words">{value}</dd>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[620px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
            {head.map((h) => (
              <th key={h} className="py-2 pr-4 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/70 last:border-0">
              {r.map((c, j) => (
                <td key={j} className="py-3 pr-4 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
