import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  GOVERNANCE_SECTORS,
  useCreateGovernanceRisk,
  useEscalateGovernanceRisk,
  useGovernanceCan,
  useGovernancePeople,
  useGovernanceRisks,
  useSetGovernanceRiskStatus,
  useUpdateGovernanceRisk,
  type GovernanceControl,
  type GovernanceRisk,
  type GovernanceRiskCategory,
  type GovernanceRiskInput,
  type GovernanceSector,
} from "@/lib/api";
import {
  DataTable,
  Field,
  LoadError,
  Loading,
  PageHeader,
  Panel,
  StatusBadge,
  errorMessage,
  formatDate,
  humanise,
  riskTone,
  selectClass,
} from "@/verticals/governance/ui";

export const Route = createFileRoute("/governance/risks")({ component: Risks });

const CATEGORIES: GovernanceRiskCategory[] = [
  "governance",
  "fraud",
  "cybersecurity",
  "environmental",
  "counterparty",
  "operational",
  "regulatory",
  "reputational",
  "financial",
];
const CONTROLS: GovernanceControl[] = ["effective", "partial", "weak", "none"];

function Risks() {
  const risks = useGovernanceRisks();
  const canAuthor = useGovernanceCan("author");
  const canEscalate = useGovernanceCan("escalate");
  const [cell, setCell] = useState<[number, number] | null>(null);
  const [editing, setEditing] = useState<GovernanceRisk | "new" | null>(null);
  const [acting, setActing] = useState<{
    risk: GovernanceRisk;
    kind: "escalate" | "close" | "monitor" | "reopen";
  } | null>(null);

  const all = risks.data ?? [];
  const list = cell ? all.filter((r) => r.likelihood === cell[0] && r.impact === cell[1]) : all;

  return (
    <>
      <PageHeader
        title="Enterprise Risk Register"
        desc="Inherent score is likelihood times impact (1 to 5 each). Residual is the owner's assessment after controls, never more than inherent."
        actions={canAuthor && <Button onClick={() => setEditing("new")}>Register risk</Button>}
      />
      {risks.isPending ? (
        <Loading />
      ) : risks.error ? (
        <LoadError error={risks.error} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[auto_1fr]">
          <Panel title="Inherent risk heatmap">
            <div className="flex gap-2">
              <div className="flex rotate-180 flex-col justify-between py-1 text-xs text-muted-foreground [writing-mode:vertical-rl]">
                Likelihood →
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[5, 4, 3, 2, 1].flatMap((l) =>
                  [1, 2, 3, 4, 5].map((i) => {
                    const n = all.filter((r) => r.likelihood === l && r.impact === i).length;
                    const selected = cell?.[0] === l && cell?.[1] === i;
                    return (
                      <button
                        key={`${l}${i}`}
                        aria-label={`Likelihood ${l}, impact ${i}: ${n} risks`}
                        onClick={() => setCell(selected ? null : [l, i])}
                        className={`grid h-11 w-11 place-items-center rounded-md font-mono text-sm sm:h-12 sm:w-12 ${riskTone(l * i)} ${n ? "" : "opacity-35"} ${selected ? "ring-2 ring-ring ring-offset-2" : ""}`}
                      >
                        {n || ""}
                      </button>
                    );
                  }),
                )}
              </div>
            </div>
            <div className="mt-2 text-center text-xs text-muted-foreground">Impact →</div>
            {cell && (
              <div className="mt-3 text-center text-xs text-primary">
                Filtered L{cell[0]} × I{cell[1]} · click again to clear
              </div>
            )}
          </Panel>
          <Panel title={`Risks (${list.length})`}>
            <DataTable
              cols={[
                "Ref",
                "Risk",
                "Category",
                "Sector",
                "Owner",
                "Inherent",
                "Controls",
                "Residual",
                "Due",
                "Status",
                "",
              ]}
              empty="No risks registered."
              rows={list.map((r) => [
                <span className="font-mono text-xs">{r.reference}</span>,
                <span className="font-medium">{r.title}</span>,
                humanise(r.category),
                GOVERNANCE_SECTORS.find((s) => s.value === r.sector)?.label ?? r.sector,
                r.owner_detail.name,
                <span
                  className={`rounded px-2 py-0.5 font-mono text-xs ${riskTone(r.inherent_score)}`}
                >
                  {r.inherent_score}
                </span>,
                <StatusBadge value={r.control_effectiveness} />,
                <span
                  className={`rounded px-2 py-0.5 font-mono text-xs ${riskTone(r.residual_score)}`}
                >
                  {r.residual_score}
                </span>,
                formatDate(r.due_date),
                <StatusBadge value={r.status} label={r.status_label} />,
                <div className="flex gap-1">
                  {canAuthor && r.status !== "closed" && (
                    <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                      Edit
                    </Button>
                  )}
                  {canEscalate && !["escalated", "closed"].includes(r.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActing({ risk: r, kind: "escalate" })}
                    >
                      Escalate
                    </Button>
                  )}
                  {canEscalate && r.status === "escalated" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActing({ risk: r, kind: "monitor" })}
                    >
                      Monitor
                    </Button>
                  )}
                  {canEscalate && r.status !== "closed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActing({ risk: r, kind: "close" })}
                    >
                      Close
                    </Button>
                  )}
                  {canEscalate && r.status === "closed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActing({ risk: r, kind: "reopen" })}
                    >
                      Reopen
                    </Button>
                  )}
                </div>,
              ])}
            />
          </Panel>
        </div>
      )}
      <RiskForm
        key={editing === "new" ? "new" : (editing?.id ?? "closed")}
        risk={editing}
        onClose={() => setEditing(null)}
      />
      <RiskAction
        key={acting ? `${acting.risk.id}-${acting.kind}` : "none"}
        acting={acting}
        onClose={() => setActing(null)}
      />
    </>
  );
}

function RiskAction({
  acting,
  onClose,
}: {
  acting: { risk: GovernanceRisk; kind: "escalate" | "close" | "monitor" | "reopen" } | null;
  onClose: () => void;
}) {
  const escalate = useEscalateGovernanceRisk();
  const setStatus = useSetGovernanceRiskStatus();
  const [comment, setComment] = useState("");
  if (!acting) return null;
  const { risk, kind } = acting;
  const title = {
    escalate: "Escalate risk",
    close: "Close risk",
    monitor: "Move to monitoring",
    reopen: "Reopen risk",
  }[kind];
  const required = kind === "escalate" || kind === "close";
  const done = {
    onSuccess: () => {
      toast.success(`${risk.reference}: ${title.toLowerCase()} recorded`);
      onClose();
    },
    onError: (e: unknown) => toast.error(errorMessage(e)),
  };
  const submit = () => {
    if (kind === "escalate") escalate.mutate({ id: risk.id, comment }, done);
    else
      setStatus.mutate(
        {
          id: risk.id,
          status: kind === "close" ? "closed" : kind === "monitor" ? "monitoring" : "open",
          comment,
        },
        done,
      );
  };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {risk.reference} · {risk.title}
          </DialogDescription>
        </DialogHeader>
        <Field label={required ? "Reason (required)" : "Comment"} htmlFor="risk-comment">
          <Textarea
            id="risk-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={(required && !comment.trim()) || escalate.isPending || setStatus.isPending}
            onClick={submit}
          >
            {title}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Score({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <select
        id={id}
        required
        className={selectClass}
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value="">Choose…</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </Field>
  );
}

function RiskForm({ risk, onClose }: { risk: GovernanceRisk | "new" | null; onClose: () => void }) {
  const people = useGovernancePeople();
  const create = useCreateGovernanceRisk();
  const update = useUpdateGovernanceRisk();
  const existing = risk && risk !== "new" ? risk : null;
  const [form, setForm] = useState<GovernanceRiskInput>(() =>
    existing
      ? {
          title: existing.title,
          description: existing.description,
          category: existing.category,
          sector: existing.sector,
          owner: existing.owner,
          likelihood: existing.likelihood,
          impact: existing.impact,
          controls: existing.controls,
          control_effectiveness: existing.control_effectiveness,
          residual_likelihood: existing.residual_likelihood,
          residual_impact: existing.residual_impact,
          treatment_plan: existing.treatment_plan,
          due_date: existing.due_date,
        }
      : { sector: "all", control_effectiveness: "none" },
  );
  const set = <K extends keyof GovernanceRiskInput>(key: K, value: GovernanceRiskInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const inherent = (form.likelihood ?? 0) * (form.impact ?? 0);
  const residual = (form.residual_likelihood ?? 0) * (form.residual_impact ?? 0);

  const save = () => {
    const body = { ...form, due_date: form.due_date || null };
    const done = {
      onSuccess: () => {
        toast.success(existing ? "Risk updated" : "Risk registered");
        onClose();
      },
      onError: (e: unknown) => toast.error(errorMessage(e)),
    };
    if (existing) update.mutate({ id: existing.id, body }, done);
    else create.mutate(body, done);
  };

  return (
    <Dialog open={risk !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{existing ? `Edit ${existing.reference}` : "Register risk"}</DialogTitle>
          <DialogDescription>Scores run from 1 (low) to 5 (high).</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field label="Risk title" htmlFor="r-title">
            <Input
              id="r-title"
              required
              value={form.title ?? ""}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>
          <Field label="Description" htmlFor="r-desc">
            <Textarea
              id="r-desc"
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Category" htmlFor="r-cat">
              <select
                id="r-cat"
                required
                className={selectClass}
                value={form.category ?? ""}
                onChange={(e) => set("category", e.target.value as GovernanceRiskCategory)}
              >
                <option value="">Choose…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {humanise(c)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sector" htmlFor="r-sector">
              <select
                id="r-sector"
                className={selectClass}
                value={form.sector ?? "all"}
                onChange={(e) => set("sector", e.target.value as GovernanceSector)}
              >
                {GOVERNANCE_SECTORS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Owner" htmlFor="r-owner">
              <select
                id="r-owner"
                required
                className={selectClass}
                value={form.owner ?? ""}
                onChange={(e) => set("owner", e.target.value)}
              >
                <option value="">Choose…</option>
                {(people.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Score
              id="r-l"
              label="Likelihood"
              value={form.likelihood}
              onChange={(v) => set("likelihood", v)}
            />
            <Score id="r-i" label="Impact" value={form.impact} onChange={(v) => set("impact", v)} />
            <Score
              id="r-rl"
              label="Residual likelihood"
              value={form.residual_likelihood}
              onChange={(v) => set("residual_likelihood", v)}
            />
            <Score
              id="r-ri"
              label="Residual impact"
              value={form.residual_impact}
              onChange={(v) => set("residual_impact", v)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Inherent {inherent || "?"} · Residual {residual || "?"}
            {inherent > 0 && residual > inherent && (
              <span className="text-destructive"> · residual cannot exceed inherent</span>
            )}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Control effectiveness" htmlFor="r-ctl">
              <select
                id="r-ctl"
                className={selectClass}
                value={form.control_effectiveness ?? "none"}
                onChange={(e) => set("control_effectiveness", e.target.value as GovernanceControl)}
              >
                {CONTROLS.map((c) => (
                  <option key={c} value={c}>
                    {c === "none" ? "No control" : humanise(c)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Treatment due" htmlFor="r-due">
              <Input
                id="r-due"
                type="date"
                value={form.due_date ?? ""}
                onChange={(e) => set("due_date", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Controls in place" htmlFor="r-controls">
            <Textarea
              id="r-controls"
              rows={2}
              value={form.controls ?? ""}
              onChange={(e) => set("controls", e.target.value)}
            />
          </Field>
          <Field label="Treatment plan" htmlFor="r-plan">
            <Textarea
              id="r-plan"
              rows={2}
              value={form.treatment_plan ?? ""}
              onChange={(e) => set("treatment_plan", e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
