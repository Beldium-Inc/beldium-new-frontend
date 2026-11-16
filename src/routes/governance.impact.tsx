import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateGovernanceAssessment,
  useCreateGovernanceScenario,
  useGovernanceAssessments,
  useGovernanceCan,
  type GovernanceAssessment,
  type GovernanceAssessmentInput,
  type GovernanceImpactCategory,
} from "@/lib/api";
import {
  DataTable,
  Field,
  LoadError,
  Loading,
  PageHeader,
  Panel,
  errorMessage,
  humanise,
  selectClass,
} from "@/verticals/governance/ui";

export const Route = createFileRoute("/governance/impact")({ component: Impact });

function Impact() {
  const assessments = useGovernanceAssessments();
  const canAuthor = useGovernanceCan("author");
  const [selected, setSelected] = useState<string | null>(null);
  const [costAdj, setCostAdj] = useState(0);
  const [benAdj, setBenAdj] = useState(0);
  const [creating, setCreating] = useState(false);
  const [addingScenario, setAddingScenario] = useState(false);

  const list = assessments.data ?? [];
  const current = list.find((a) => a.id === selected) ?? list[0];

  return (
    <>
      <PageHeader
        title="Regulatory Impact Assessment"
        desc={
          current
            ? `${current.reference} · ${current.title} · ${current.currency} ${current.unit}, NPV over ${current.horizon_years} years at ${Number(current.discount_rate)}% discount rate.`
            : "Compare policy scenarios with cost benefit and sensitivity analysis."
        }
        actions={
          <>
            {list.length > 1 && (
              <select
                aria-label="Assessment"
                className={`${selectClass} w-64`}
                value={current?.id ?? ""}
                onChange={(e) => setSelected(e.target.value)}
              >
                {list.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.reference} {a.title}
                  </option>
                ))}
              </select>
            )}
            {canAuthor && current && (
              <Button variant="outline" onClick={() => setAddingScenario(true)}>
                Add scenario
              </Button>
            )}
            {canAuthor && <Button onClick={() => setCreating(true)}>New assessment</Button>}
          </>
        }
      />
      {assessments.isPending ? (
        <Loading />
      ) : assessments.error ? (
        <LoadError error={assessments.error} />
      ) : !current ? (
        <Panel>
          <p className="py-6 text-center text-sm text-muted-foreground">
            No impact assessments yet.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel title="Scenario comparison" className="lg:col-span-2">
            <DataTable
              cols={["Scenario", "Cost", "Benefit", "Net", "BCR", "Data"]}
              empty="Add a scenario to compare."
              rows={current.scenarios.map((s) => {
                const c = Number(s.cost) * (1 + costAdj / 100);
                const b = Number(s.benefit) * (1 + benAdj / 100);
                return [
                  <span className="font-medium">{s.name}</span>,
                  c.toFixed(1),
                  b.toFixed(1),
                  (b - c).toFixed(1),
                  <span className="font-mono">{c ? (b / c).toFixed(2) : "N/A"}</span>,
                  <span className={`text-xs ${s.verified ? "text-success" : "text-warning"}`}>
                    {s.verified ? "Verified" : "Estimated"}
                  </span>,
                ];
              })}
            />
          </Panel>
          <Panel title="Sensitivity analysis">
            <div className="space-y-6 text-sm">
              {(
                [
                  ["Implementation cost", costAdj, setCostAdj],
                  ["Estimated benefits", benAdj, setBenAdj],
                ] as const
              ).map(([label, value, setter]) => (
                <div key={label}>
                  <div className="mb-2 flex justify-between">
                    <span>{label}</span>
                    <span className="font-mono">
                      {value > 0 ? "+" : value < 0 ? "−" : ""}
                      {Math.abs(value)}%
                    </span>
                  </div>
                  <Slider
                    min={-30}
                    max={30}
                    value={[value]}
                    onValueChange={(v) => setter(v[0] ?? 0)}
                    aria-label={label}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                {current.assumptions || "No assumptions recorded."} Adjustments here are a what-if
                view only and are not saved.
              </p>
            </div>
          </Panel>
          <Panel title="Impact matrix (1 low to 5 high)" className="lg:col-span-3">
            <DataTable
              cols={[
                "Category",
                ...current.scenarios.filter((s) => !s.is_baseline).map((s) => s.name),
              ]}
              rows={current.categories.map((category) => [
                humanise(category),
                ...current.scenarios
                  .filter((s) => !s.is_baseline)
                  .map((s) => {
                    const score = s.scores[category] ?? 0;
                    return (
                      <div className="flex gap-1" aria-label={`${score} of 5`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span
                            key={n}
                            className={`h-2 w-6 rounded-sm ${n <= score ? "bg-primary" : "bg-muted"}`}
                          />
                        ))}
                      </div>
                    );
                  }),
              ])}
            />
          </Panel>
        </div>
      )}
      {creating && (
        <AssessmentForm
          onClose={(created) => {
            setCreating(false);
            if (created) setSelected(created.id);
          }}
        />
      )}
      {addingScenario && current && (
        <ScenarioForm assessment={current} onClose={() => setAddingScenario(false)} />
      )}
    </>
  );
}

function AssessmentForm({ onClose }: { onClose: (created?: GovernanceAssessment) => void }) {
  const create = useCreateGovernanceAssessment();
  const [form, setForm] = useState<GovernanceAssessmentInput>({
    currency: "USD",
    unit: "millions",
    horizon_years: 10,
    discount_rate: "8",
  });
  const set = <K extends keyof GovernanceAssessmentInput>(
    key: K,
    value: GovernanceAssessmentInput[K],
  ) => setForm((f) => ({ ...f, [key]: value }));
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New impact assessment</DialogTitle>
          <DialogDescription>Add scenarios once the assessment exists.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(form, {
              onSuccess: (a) => {
                toast.success(`${a.reference} created`);
                onClose(a);
              },
              onError: (err) => toast.error(errorMessage(err)),
            });
          }}
        >
          <Field label="Title" htmlFor="a-title">
            <Input
              id="a-title"
              required
              value={form.title ?? ""}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Currency" htmlFor="a-cur">
              <Input
                id="a-cur"
                value={form.currency ?? ""}
                onChange={(e) => set("currency", e.target.value)}
              />
            </Field>
            <Field label="Unit" htmlFor="a-unit">
              <Input
                id="a-unit"
                value={form.unit ?? ""}
                onChange={(e) => set("unit", e.target.value)}
              />
            </Field>
            <Field label="Years" htmlFor="a-years">
              <Input
                id="a-years"
                type="number"
                min={1}
                max={50}
                value={form.horizon_years ?? 10}
                onChange={(e) => set("horizon_years", Number(e.target.value))}
              />
            </Field>
            <Field label="Discount %" htmlFor="a-rate">
              <Input
                id="a-rate"
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={form.discount_rate ?? ""}
                onChange={(e) => set("discount_rate", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Assumptions" htmlFor="a-ass">
            <Textarea
              id="a-ass"
              rows={3}
              value={form.assumptions ?? ""}
              onChange={(e) => set("assumptions", e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ScenarioForm({
  assessment,
  onClose,
}: {
  assessment: GovernanceAssessment;
  onClose: () => void;
}) {
  const create = useCreateGovernanceScenario();
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [benefit, setBenefit] = useState("");
  const [verified, setVerified] = useState(false);
  const [baseline, setBaseline] = useState(false);
  const [scores, setScores] = useState<Partial<Record<GovernanceImpactCategory, number>>>({});
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add scenario</DialogTitle>
          <DialogDescription>
            {assessment.reference} · {assessment.currency} {assessment.unit}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(
              {
                assessment: assessment.id,
                name,
                cost: cost || "0",
                benefit: benefit || "0",
                verified,
                is_baseline: baseline,
                scores: baseline ? {} : scores,
                position: assessment.scenarios.length,
              },
              {
                onSuccess: () => {
                  toast.success("Scenario added");
                  onClose();
                },
                onError: (err) => toast.error(errorMessage(err)),
              },
            );
          }}
        >
          <Field label="Scenario name" htmlFor="sc-name">
            <Input id="sc-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cost" htmlFor="sc-cost">
              <Input
                id="sc-cost"
                type="number"
                step="0.01"
                min={0}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </Field>
            <Field label="Benefit" htmlFor="sc-ben">
              <Input
                id="sc-ben"
                type="number"
                step="0.01"
                min={0}
                value={benefit}
                onChange={(e) => setBenefit(e.target.value)}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={verified} onCheckedChange={(v) => setVerified(Boolean(v))} /> Figures
            come from verified data
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={baseline} onCheckedChange={(v) => setBaseline(Boolean(v))} /> This is
            the baseline (status quo)
          </label>
          {!baseline && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {assessment.categories.map((c) => (
                <Field key={c} label={humanise(c)} htmlFor={`sc-${c}`}>
                  <select
                    id={`sc-${c}`}
                    className={selectClass}
                    value={scores[c] ?? ""}
                    onChange={(e) =>
                      setScores((s) => {
                        const next = { ...s };
                        if (e.target.value) next[c] = Number(e.target.value);
                        else delete next[c];
                        return next;
                      })
                    }
                  >
                    <option value="">Not scored</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
