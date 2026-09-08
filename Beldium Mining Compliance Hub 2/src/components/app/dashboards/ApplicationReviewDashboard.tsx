import { useState } from "react";
import { Lock } from "lucide-react";
import { Chip } from "@/components/app/chips";
import { DemoNote, Field, PageHeader, Panel } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useOnboarding } from "@/lib/onboarding/store";

const lockedFunctions = [
  "Miner applications & review queue",
  "Site register & compliance scoring",
  "Inspections & sampling",
  "Non-conformities & corrective actions",
  "Reports & regulator submissions",
];

export function ApplicationReviewDashboard() {
  const {
    role,
    application,
    professional,
    regulator,
    documents,
    verification,
    submittedAt,
    timeline,
    infoRequests,
    messages,
    findings,
    conditions,
    raiseInfoRequests,
    respondToInfoRequest,
    approveApplication,
  } = useOnboarding();
  const isProfessional = role === "independent";
  const isRegulator = role === "regulator-org" || role === "regulator-officer";
  const ref = (isProfessional ? professional.ref : isRegulator ? regulator.ref : application.ref) || "APP-PENDING";
  const name =
    (isProfessional ? professional.fullName : isRegulator ? regulator.legalName : application.legalName) || "Your application";
  const capabilities = isProfessional
    ? professional.reviewCapabilities
    : isRegulator
      ? regulator.oversightCapabilities
      : application.services;
  const applicationType = isProfessional
    ? "Independent Mining Compliance Professional"
    : isRegulator
      ? "Regulatory / Oversight Organisation"
      : "Mining Compliance Organisation";
  const idLabel = isRegulator ? "Beldium Regulatory Organisation ID" : "Beldium Compliance ID";
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const openRequests = infoRequests.filter((r) => r.status === "Open");
  const outstanding = [
    ...openRequests.map((r) => `Respond to information request: ${r.subject}`),
    ...findings.filter((f) => f.status === "Outstanding").map((f) => f.requirement),
    ...(documents.length === 0 ? ["Attach your supporting documents"] : []),
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Application review mode"
        title={name}
        description="Your account is active but operational compliance functions stay locked until Beldium completes verification."
        actions={
          <>
            <Chip tone={verification === "Information Required" ? "warning" : "neutral"}>{verification}</Chip>
            <Chip tone="neutral">{ref}</Chip>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Application status" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reference" value={ref} />
            <Field label="Status" value={verification} />
            <Field label="Submitted" value={submittedAt ?? "Not submitted"} />
            <Field label="Application type" value={applicationType} />
            <Field label={idLabel} value="Issued after approval" />
            <Field label="Requested capabilities" value={`${capabilities.length}`} />
          </div>
          {conditions.length > 0 && (
            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              {conditions.map((c) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Locked until verified">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {lockedFunctions.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Lock className="mt-0.5 size-3.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Information requests" className="lg:col-span-2">
          {infoRequests.length === 0 && <p className="text-sm text-muted-foreground">No information has been requested.</p>}
          <div className="space-y-3">
            {infoRequests.map((r) => (
              <div key={r.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{r.subject}</p>
                  <Chip tone={r.status === "Open" ? "warning" : "success"}>{r.status}</Chip>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{r.detail} · raised {r.raisedAt}</p>
                {r.status === "Open" ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      rows={2}
                      placeholder="Type your response to the verification team"
                      value={drafts[r.id] ?? ""}
                      onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })}
                    />
                    <Button
                      size="sm"
                      disabled={!(drafts[r.id] ?? "").trim()}
                      onClick={() => respondToInfoRequest(r.id, drafts[r.id] ?? "")}
                    >
                      Submit response
                    </Button>
                  </div>
                ) : (
                  <p className="mt-2 text-sm">{r.response}</p>
                )}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Outstanding actions">
          {outstanding.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing outstanding — awaiting Beldium verification.</p>
          ) : (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {outstanding.map((o) => (
                <li key={o}>• {o}</li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={`Documents (${documents.length})`}>
          {documents.length === 0 && <p className="text-sm text-muted-foreground">No documents attached.</p>}
          <div className="space-y-2">
            {documents.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-2.5">
                <div>
                  <p className="text-sm font-medium">{d.category}</p>
                  <p className="text-xs text-muted-foreground">{d.name}</p>
                </div>
                <Chip tone="neutral">{d.status}</Chip>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Beldium review activity" className="lg:col-span-2">
          {timeline.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
          <ol className="space-y-3">
            {timeline.slice(0, 10).map((t) => (
              <li key={t.id} className="border-l-2 border-border pl-3">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.detail}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t.actor} · {t.at}</p>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Messages">
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="rounded-lg border border-border p-3.5">
                <p className="text-xs font-semibold">{m.from}</p>
                <p className="mt-1 text-sm text-muted-foreground">{m.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{m.at}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-5">
        <DemoNote>Prototype controls — simulate the Beldium verification team.</DemoNote>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              raiseInfoRequests([
                { subject: "Clarify professional registration", detail: "Provide a registration certificate valid for the current year." },
                { subject: "Confirm coverage", detail: "Confirm the states where you can mobilise for site inspection." },
              ])
            }
          >
            Request information
          </Button>
          <Button size="sm" onClick={() => approveApplication()}>
            Approve application
          </Button>
        </div>
      </div>
    </div>
  );
}
