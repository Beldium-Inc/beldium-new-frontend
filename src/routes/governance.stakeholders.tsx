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
  useCreateGovernanceStakeholder,
  useGovernanceCan,
  useGovernancePeople,
  useGovernanceStakeholders,
  useUpdateGovernanceStakeholder,
  type GovernanceStakeholder,
  type GovernanceStakeholderCategory,
  type GovernanceStakeholderInput,
} from "@/lib/api";
import {
  DataTable,
  Field,
  LoadError,
  Loading,
  PageHeader,
  Panel,
  errorMessage,
  formatDate,
  humanise,
  selectClass,
} from "@/verticals/governance/ui";

export const Route = createFileRoute("/governance/stakeholders")({ component: Stakeholders });

const CATEGORIES: GovernanceStakeholderCategory[] = [
  "regulator",
  "government",
  "community",
  "financier",
  "commercial",
  "ngo",
  "industry",
  "research",
];

const quadrant = (s: GovernanceStakeholder) =>
  s.influence > 5
    ? s.interest > 5
      ? "Manage closely"
      : "Keep satisfied"
    : s.interest > 5
      ? "Keep informed"
      : "Monitor";

function Stakeholders() {
  const stakeholders = useGovernanceStakeholders();
  const canAuthor = useGovernanceCan("author");
  const [editing, setEditing] = useState<GovernanceStakeholder | "new" | null>(null);

  return (
    <>
      <PageHeader
        title="Stakeholder Intelligence"
        desc="Power and interest matrix and engagement ownership."
        actions={canAuthor && <Button onClick={() => setEditing("new")}>Add stakeholder</Button>}
      />
      {stakeholders.isPending ? (
        <Loading />
      ) : stakeholders.error ? (
        <LoadError error={stakeholders.error} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Power and interest matrix">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted/40">
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 text-[11px] tracking-wide text-muted-foreground uppercase">
                <div className="border-r border-b p-2">Keep satisfied</div>
                <div className="border-b p-2 text-right">Manage closely</div>
                <div className="flex items-end border-r p-2">Monitor</div>
                <div className="flex items-end justify-end p-2">Keep informed</div>
              </div>
              {stakeholders.data.map((s) => (
                <div
                  key={s.id}
                  className="absolute -translate-x-1/2 translate-y-1/2"
                  style={{
                    left: `${Math.min(Math.max(s.interest * 10 - 5, 6), 94)}%`,
                    bottom: `${Math.min(Math.max(s.influence * 10 - 5, 6), 94)}%`,
                  }}
                  title={`${s.name}: influence ${s.influence}, interest ${s.interest}`}
                >
                  <div className="mx-auto h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
                  <div className="mt-1 max-w-28 truncate text-center text-xs font-medium">
                    {s.name}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>↑ Influence</span>
              <span>Interest →</span>
            </div>
          </Panel>
          <Panel title="Stakeholders">
            <DataTable
              cols={[
                "Name",
                "Category",
                "Influence",
                "Interest",
                "Strategy",
                "Owner",
                "Last engaged",
                "",
              ]}
              empty="No stakeholders mapped yet."
              rows={stakeholders.data.map((s) => [
                <span className="font-medium">{s.name}</span>,
                humanise(s.category),
                s.influence,
                s.interest,
                <span className="text-xs">{quadrant(s)}</span>,
                s.owner_detail.name,
                formatDate(s.last_engaged_on),
                canAuthor ? (
                  <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>
                    Edit
                  </Button>
                ) : null,
              ])}
            />
          </Panel>
        </div>
      )}
      {editing && (
        <StakeholderForm
          key={editing === "new" ? "new" : editing.id}
          stakeholder={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function StakeholderForm({
  stakeholder,
  onClose,
}: {
  stakeholder: GovernanceStakeholder | "new";
  onClose: () => void;
}) {
  const people = useGovernancePeople();
  const create = useCreateGovernanceStakeholder();
  const update = useUpdateGovernanceStakeholder();
  const existing = stakeholder === "new" ? null : stakeholder;
  const [form, setForm] = useState<GovernanceStakeholderInput>(() =>
    existing
      ? {
          name: existing.name,
          category: existing.category,
          influence: existing.influence,
          interest: existing.interest,
          owner: existing.owner,
          engagement_plan: existing.engagement_plan,
          last_engaged_on: existing.last_engaged_on,
        }
      : { influence: 5, interest: 5 },
  );
  const set = <K extends keyof GovernanceStakeholderInput>(
    key: K,
    value: GovernanceStakeholderInput[K],
  ) => setForm((f) => ({ ...f, [key]: value }));
  const done = {
    onSuccess: () => {
      toast.success("Stakeholder saved");
      onClose();
    },
    onError: (e: unknown) => toast.error(errorMessage(e)),
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? `Edit ${existing.name}` : "Add stakeholder"}</DialogTitle>
          <DialogDescription>
            Influence and interest run from 1 (low) to 10 (high).
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const body = { ...form, last_engaged_on: form.last_engaged_on || null };
            if (existing) update.mutate({ id: existing.id, body }, done);
            else create.mutate(body, done);
          }}
        >
          <Field label="Name" htmlFor="s-name">
            <Input
              id="s-name"
              required
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category" htmlFor="s-cat">
              <select
                id="s-cat"
                required
                className={selectClass}
                value={form.category ?? ""}
                onChange={(e) => set("category", e.target.value as GovernanceStakeholderCategory)}
              >
                <option value="">Choose…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c === "ngo" ? "NGO" : humanise(c)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Engagement owner" htmlFor="s-owner">
              <select
                id="s-owner"
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
            <Field label="Influence (1 to 10)" htmlFor="s-inf">
              <Input
                id="s-inf"
                type="number"
                min={1}
                max={10}
                required
                value={form.influence ?? ""}
                onChange={(e) => set("influence", Number(e.target.value))}
              />
            </Field>
            <Field label="Interest (1 to 10)" htmlFor="s-int">
              <Input
                id="s-int"
                type="number"
                min={1}
                max={10}
                required
                value={form.interest ?? ""}
                onChange={(e) => set("interest", Number(e.target.value))}
              />
            </Field>
            <Field label="Last engaged" htmlFor="s-last">
              <Input
                id="s-last"
                type="date"
                value={form.last_engaged_on ?? ""}
                onChange={(e) => set("last_engaged_on", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Engagement plan" htmlFor="s-plan">
            <Textarea
              id="s-plan"
              rows={3}
              value={form.engagement_plan ?? ""}
              onChange={(e) => set("engagement_plan", e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap justify-between gap-2">
            {existing ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                onClick={() => update.mutate({ id: existing.id, body: { is_active: false } }, done)}
              >
                Retire stakeholder
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                Save
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
