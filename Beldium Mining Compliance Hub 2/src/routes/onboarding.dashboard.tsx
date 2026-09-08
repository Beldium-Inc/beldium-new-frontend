import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Clock, FileText, ShieldCheck, Users } from "lucide-react";
import { AuthShell, InfoRow, StateChip } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { roleCatalogue } from "@/lib/onboarding/data";
import { demoConditions, demoFindings, useOnboarding } from "@/lib/onboarding/store";
import type { VerificationState } from "@/lib/onboarding/types";

export const Route = createFileRoute("/onboarding/dashboard")({ component: OnboardingDashboard });

function OnboardingDashboard() {
  const s = useOnboarding();
  const navigate = useNavigate();
  const [reply, setReply] = useState<Record<string, string>>({});

  const roleEntry = roleCatalogue.find((r) => r.role === s.role);
  const checklist = [
    { label: "Role selected", done: Boolean(s.role) },
    { label: "Account created", done: s.account.fullName.length > 0 },
    { label: "Email verified", done: s.account.emailVerified },
    { label: "Phone verified", done: s.account.phoneVerified },
    { label: "Documents attached", done: s.documents.length > 0 },
    { label: "Personnel registered", done: s.personnel.length > 0 },
    { label: "Declaration signed", done: s.conflict.attested },
    { label: "Application submitted", done: Boolean(s.submittedAt) },
  ];
  const complete = checklist.filter((c) => c.done).length;
  const pct = Math.round((complete / checklist.length) * 100);

  const stateCopy: Record<VerificationState, { title: string; body: string; tone: string; icon: React.ReactNode }> = {
    Draft: {
      title: "Application in draft",
      body: "Finish the outstanding steps below and submit for verification.",
      tone: "border-border bg-muted/50",
      icon: <FileText className="size-5" />,
    },
    "Under Review": {
      title: "Under review by the Beldium verification team",
      body: `Submitted ${s.submittedAt ?? "just now"}. Typical turnaround is 5 working days. You will be notified if anything further is needed.`,
      tone: "border-brand/30 bg-brand-soft/60",
      icon: <Clock className="size-5" />,
    },
    "Information Required": {
      title: "Information required",
      body: "Reviewers need clarification before verification can continue. Respond to each item below.",
      tone: "border-warning/50 bg-warning/15",
      icon: <AlertTriangle className="size-5" />,
    },
    "Conditionally Verified": {
      title: "Conditionally verified",
      body: "You have limited platform access while the conditions below are outstanding.",
      tone: "border-warning/50 bg-warning/10",
      icon: <ShieldCheck className="size-5" />,
    },
    Verified: {
      title: "Organisation verified",
      body: "Full access has been granted to your compliance workspace.",
      tone: "border-success/50 bg-success/25",
      icon: <CheckCircle2 className="size-5" />,
    },
    Rejected: {
      title: "Application not approved",
      body: "Your application was declined. Review the timeline for the reason and resubmit when resolved.",
      tone: "border-danger/50 bg-danger/15",
      icon: <AlertTriangle className="size-5" />,
    },
  };
  const copy = stateCopy[s.verification];

  return (
    <AuthShell
      eyebrow="Onboarding workspace"
      title={`Welcome${s.account.fullName ? `, ${s.account.fullName.split(" ")[0]}` : ""}`}
      description={roleEntry ? `${roleEntry.title} · permissions are provisioned once verification completes.` : "Complete your registration to gain access."}
      width="lg"
    >
      <div className={`rounded-[20px] border p-5 ${copy.tone}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-surface">{copy.icon}</span>
            <div>
              <p className="font-display text-base font-semibold">{copy.title}</p>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{copy.body}</p>
            </div>
          </div>
          <StateChip state={s.verification} />
        </div>
        {s.application.ref && <p className="mt-4 text-xs text-muted-foreground">Reference {s.application.ref}</p>}
        {s.verification === "Verified" && (
          <Button className="mt-4" onClick={() => navigate({ to: "/onboarding/welcome" })}>
            Open my workspace
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-[20px] border border-border p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-sm font-semibold">Registration progress</p>
              <span className="text-sm font-medium tabular-nums">{pct}%</span>
            </div>
            <Progress value={pct} className="mt-3" />
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-sm">
                  <span className={`grid size-5 place-items-center rounded-full text-[10px] ${c.done ? "bg-success/60" : "bg-muted text-muted-foreground"}`}>
                    {c.done ? "✓" : "–"}
                  </span>
                  <span className={c.done ? "" : "text-muted-foreground"}>{c.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/onboarding/application">Continue application</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/onboarding/join">Organisation access</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/onboarding/admin">Administrator review</Link>
              </Button>
            </div>
          </div>

          {s.verification === "Information Required" && (
            <div className="rounded-[20px] border border-warning/50 p-5">
              <p className="font-display text-sm font-semibold">Outstanding items</p>
              <div className="mt-3 space-y-4">
                {s.findings.map((f) => (
                  <div key={f.id} className="rounded-[14px] border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{f.area}</p>
                      <span className="text-xs text-muted-foreground">{f.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{f.requirement}</p>
                    {f.status === "Outstanding" && (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          rows={2}
                          placeholder="Your response, and note any document you are attaching."
                          value={reply[f.id] ?? ""}
                          onChange={(e) => setReply({ ...reply, [f.id]: e.target.value })}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if ((reply[f.id] ?? "").trim().length < 5) {
                              toast.error("Add a response before submitting.");
                              return;
                            }
                            s.resolveFinding(f.id);
                            toast.success("Response submitted to the review team.");
                          }}
                        >
                          Submit response
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {s.verification === "Conditionally Verified" && (
            <div className="rounded-[20px] border border-warning/50 p-5">
              <p className="font-display text-sm font-semibold">Conditions of your provisional access</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {s.conditions.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" />
                    {c}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Restricted while conditional: production reporting and transaction records are read-only.
              </p>
            </div>
          )}

          <div className="rounded-[20px] border border-border p-5">
            <p className="font-display text-sm font-semibold">Submitted details</p>
            <div className="mt-2">
              <InfoRow label="Contact" value={`${s.account.fullName} · ${s.account.email}`} />
              <InfoRow label="Organisation" value={s.application.legalName} />
              <InfoRow label="Licence" value={s.application.licenceNumber} />
              <InfoRow label="Documents" value={`${s.documents.length} attached`} />
              <InfoRow label="Personnel" value={`${s.personnel.length} registered`} />
              <InfoRow label="Inspection capability" value={s.capability.offersInspection ? "Declared" : "Not declared"} />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[20px] border border-border p-5">
            <p className="font-display text-sm font-semibold">Permissions granted</p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {(roleEntry?.permissions ?? []).map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Users className="size-3.5" /> {p}
                  <span className="ml-auto">{s.verification === "Verified" ? "Active" : s.verification === "Conditionally Verified" ? "Limited" : "Pending"}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[20px] border border-dashed border-border p-5">
            <p className="font-display text-sm font-semibold">Demo: simulate a review outcome</p>
            <p className="mt-1 text-xs text-muted-foreground">Prototype control to walk through each verification state.</p>
            <div className="mt-3 grid gap-2">
              <Button variant="outline" size="sm" onClick={() => s.setVerification("Under Review", { note: "Application queued with the verification team." })}>
                Under review
              </Button>
              <Button variant="outline" size="sm" onClick={() => s.setVerification("Information Required", { findings: demoFindings(), note: "Two clarifications raised by the reviewer." })}>
                Information required
              </Button>
              <Button variant="outline" size="sm" onClick={() => s.setVerification("Conditionally Verified", { conditions: demoConditions, note: "Provisional access granted with two conditions." })}>
                Conditionally verified
              </Button>
              <Button variant="outline" size="sm" onClick={() => s.setVerification("Verified", { note: "All checks passed — full access granted." })}>
                Verified
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { s.resetOnboarding(); toast.info("Onboarding data reset."); navigate({ to: "/onboarding/role" }); }}>
                Reset onboarding demo
              </Button>
            </div>
          </div>

          <div className="rounded-[20px] border border-border p-5">
            <p className="font-display text-sm font-semibold">Activity</p>
            <ol className="mt-3 space-y-3">
              {s.timeline.slice(0, 8).map((t) => (
                <li key={t.id} className="border-l-2 border-border pl-3">
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.detail}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{t.actor} · {t.at}</p>
                </li>
              ))}
              {s.timeline.length === 0 && <li className="text-xs text-muted-foreground">No activity yet.</li>}
            </ol>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
