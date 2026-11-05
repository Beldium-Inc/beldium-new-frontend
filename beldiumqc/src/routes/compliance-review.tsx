import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/beldium/shell";
import { PageHeader, SectionTitle, Surface, StatusPill } from "@/components/beldium/ui";
import { Btn, Label, inputClass } from "@/components/beldium/auth";
import { VerificationPanel } from "@/components/beldium/verification";
import { useAccounts } from "@/lib/beldium/accounts";
import { useBeldium } from "@/lib/beldium/store";
import { canReview } from "@/lib/beldium/compliance";
import { appStatuses, type AppStatus } from "@/lib/beldium/onboarding";

export const Route = createFileRoute("/compliance-review")({
  head: () => ({ meta: [{ title: "Independent applicant review — Beldium" }, { name: "description", content: "Delegated independent review of sector applicant evidence and simulated decisions." }, { property: "og:title", content: "Independent applicant review — Beldium" }, { property: "og:description", content: "Source verification, findings, requests and monitoring for Beldium applicants." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <AppShell><ApplicantReview /></AppShell>,
});

function ApplicantReview() {
  const { accounts, setStatus, recordVerification } = useAccounts();
  const { user } = useBeldium();
  const applicants = accounts.filter((a) => a.roleKey && a.application);
  const [id, setId] = React.useState("");
  const [status, setDecision] = React.useState<AppStatus>("information_required");
  const [note, setNote] = React.useState("");
  const target = applicants.find((a) => a.id === id) ?? applicants[0];
  const app = target?.application;
  const editable = !!target && canReview(user, target.orgName) && target.id !== user?.id;
  return <>
    <PageHeader eyebrow="Compliance verification" title="Independent applicant review" description="Simulated Beldium decisions within delegated Quality & Control scope. Regulatory authority access requires separate authorisation." />
    <Label htmlFor="review-applicant">Application</Label><select id="review-applicant" className={inputClass} value={target?.id ?? ""} onChange={(e) => { setId(e.target.value); setNote(""); }}>{applicants.map((a) => <option key={a.id} value={a.id}>{a.application?.ref} · {a.orgName} · {a.name}</option>)}</select>
    {target && app ? <>
      <Surface className="mt-6"><SectionTitle title={`${app.ref} · ${app.type}`} action={<StatusPill value={app.status} />} /><div className="px-6 py-5"><p className="text-sm text-navy">{target.name} · {target.orgName} · submitted {app.submittedAt}</p><ul className="mt-4 divide-y divide-border">{app.documents.map((d) => <li className="flex flex-wrap justify-between gap-2 py-3" key={d.id}><span className="text-sm text-navy">{d.type}<span className="block text-xs text-muted-foreground">Evidence reference: {d.fileName}</span></span><StatusPill value={d.status} /></li>)}</ul></div></Surface>
      <VerificationPanel key={target.id} subject={target.orgName} records={app.verifications ?? []} editable={editable} onRecord={(input) => recordVerification(target.id, input)} />
      {editable ? <Surface className="mt-6"><SectionTitle title="Simulated application decision" /><form className="space-y-4 px-6 py-5" onSubmit={(e) => { e.preventDefault(); try { setStatus(target.id, status, note); toast.success("Simulated independent decision recorded"); setNote(""); } catch (e) { toast.error(e instanceof Error ? e.message : "Decision could not be recorded."); } }}><div><Label htmlFor="review-status">Decision / monitoring status</Label><select id="review-status" className={inputClass} value={status} onChange={(e) => setDecision(e.target.value as AppStatus)}>{appStatuses.map((s) => <option value={s} key={s}>{s.replace(/_/g, " ")}</option>)}</select></div><div><Label htmlFor="review-rationale">Decision rationale</Label><textarea id="review-rationale" required className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} /></div><Btn type="submit">Record simulated decision</Btn></form></Surface> : null}
      <Surface className="mt-6"><SectionTitle title="Review & response audit" /><ol className="space-y-3 px-6 py-5">{[...app.timeline].reverse().map((t) => <li key={t.id}><p className="text-sm font-semibold text-navy">{t.title}</p><p className="text-xs text-muted-foreground">{t.detail} · {t.actor} · {t.at}</p></li>)}</ol></Surface>
    </> : <p className="mt-6 text-sm text-muted-foreground">No applications submitted.</p>}
  </>;
}