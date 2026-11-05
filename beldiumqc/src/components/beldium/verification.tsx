import * as React from "react";
import { Btn, Label, inputClass } from "./auth";
import { SectionTitle, Surface, StatusPill } from "./ui";
import type { VerificationInput, VerificationRecord } from "@/lib/beldium/compliance";

export function VerificationPanel({ subject, records, editable, onRecord }: { subject: string; records: VerificationRecord[]; editable: boolean; onRecord: (input: VerificationInput) => void }) {
  const [input, setInput] = React.useState<VerificationInput>({ subject, requirement: "", evidence: "", source: "", method: "", findings: "", decision: "accepted", scope: "", nextReview: "" });
  const [error, setError] = React.useState("");
  const fields = [["requirement", "Requirement assessed"], ["evidence", "Evidence reference"], ["source", "Verification source"], ["method", "Verification method"], ["findings", "Findings"], ["scope", "Decision scope"], ["nextReview", "Expiry / next review date (if applicable)"]] as const;
  return <Surface className="mt-6">
    <SectionTitle title="Independent source verification" hint="Simulated evidence review · not official regulatory approval" />
    <ol className="flex flex-wrap gap-2 px-6 py-4 text-xs text-muted-foreground">{["Submitted", "Evidence review", "Source verification", "Findings", "Information / decision", "Monitoring & reverification"].map((s) => <li key={s}>{s} →</li>)}</ol>
    {editable ? <form className="grid gap-4 px-6 pb-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); try { onRecord(input); setError(""); setInput({ ...input, findings: "", evidence: "" }); } catch (e) { setError(e instanceof Error ? e.message : "Unable to record review."); } }}>
      {fields.map(([key, label]) => <div key={key}><Label htmlFor={`verification-${key}`}>{label}</Label><input id={`verification-${key}`} type={key === "nextReview" ? "date" : "text"} required={key !== "nextReview"} value={input[key]} onChange={(e) => setInput({ ...input, [key]: e.target.value })} className={inputClass} /></div>)}
      <div><Label htmlFor="verification-decision">Simulated finding decision</Label><select id="verification-decision" className={inputClass} value={input.decision} onChange={(e) => setInput({ ...input, decision: e.target.value as VerificationInput["decision"] })}><option value="accepted">Evidence accepted</option><option value="information_requested">Information requested</option><option value="deficiency">Deficiency recorded</option><option value="rejected">Evidence rejected</option></select></div>
      {error ? <p className="text-sm text-danger-foreground sm:col-span-2">{error}</p> : null}<Btn type="submit" className="sm:col-span-2">Record simulated verification</Btn>
    </form> : null}
    <div className="divide-y divide-border">{records.length ? [...records].reverse().map((r) => <article key={r.id} className="px-6 py-5 text-sm"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-navy">{r.requirement}</p><StatusPill value={r.decision} /></div><p className="mt-2 text-navy">{r.findings}</p><dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2"><div>Subject: {r.subject}</div><div>Evidence: {r.evidence}</div><div>Source: {r.source}</div><div>Method: {r.method}</div><div>Scope: {r.scope}</div><div>Next review: {r.nextReview || "Not applicable"}</div><div>Officer: {r.officer}</div><div>Timestamp: {r.at}</div></dl><p className="mt-2 text-xs text-muted-foreground">{r.audit.map((a) => `${a.action} · ${a.actor} · ${a.at}`).join("; ")}</p></article>) : <p className="px-6 py-5 text-sm text-muted-foreground">No source verification recorded.</p>}</div>
  </Surface>;
}