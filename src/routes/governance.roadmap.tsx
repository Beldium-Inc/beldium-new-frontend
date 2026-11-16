import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import {
  useCreateGovernanceMilestone,
  useGovernanceCan,
  useGovernanceMilestones,
  useGovernancePeople,
  useGovernancePolicies,
  useUpdateGovernanceMilestone,
  type GovernanceMilestone,
  type GovernanceMilestoneInput,
  type GovernanceMilestonePhase,
  type GovernanceMilestoneStatus,
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
  selectClass,
} from "@/verticals/governance/ui";

export const Route = createFileRoute("/governance/roadmap")({ component: Roadmap });

const PHASES: GovernanceMilestonePhase[] = ["design", "pilot", "rollout", "review"];
const STATUSES: GovernanceMilestoneStatus[] = ["not_started", "on_track", "delayed", "complete"];

const monthIndex = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return (y ?? 0) * 12 + ((m ?? 1) - 1);
};

function Roadmap() {
  const milestones = useGovernanceMilestones();
  const canAuthor = useGovernanceCan("author");
  const [view, setView] = useState<"timeline" | "table">("timeline");
  const [editing, setEditing] = useState<GovernanceMilestone | "new" | null>(null);

  // A twelve month window starting at the earlier of this month and the first milestone.
  const window = useMemo(() => {
    const now = new Date();
    const current = now.getFullYear() * 12 + now.getMonth();
    const first = Math.min(
      current,
      ...(milestones.data ?? []).map((m) => monthIndex(m.start_date)),
    );
    return Array.from({ length: 12 }, (_, i) => first + i);
  }, [milestones.data]);
  const label = (index: number) =>
    new Date(Math.floor(index / 12), index % 12, 1).toLocaleDateString("en-GB", {
      month: "short",
      year: "2-digit",
    });

  return (
    <>
      <PageHeader
        title="Policy Roadmap & Implementation"
        desc={`${label(window[0]!)} to ${label(window[11]!)}`}
        actions={
          <>
            <div className="flex rounded-md border p-0.5">
              {(["timeline", "table"] as const).map((v) => (
                <Button
                  key={v}
                  size="sm"
                  variant={view === v ? "default" : "ghost"}
                  onClick={() => setView(v)}
                  className="capitalize"
                >
                  {v}
                </Button>
              ))}
            </div>
            {canAuthor && <Button onClick={() => setEditing("new")}>Add milestone</Button>}
          </>
        }
      />
      <Panel>
        {milestones.isPending ? (
          <Loading />
        ) : milestones.error ? (
          <LoadError error={milestones.error} />
        ) : milestones.data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No milestones yet.</p>
        ) : view === "timeline" ? (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[220px_repeat(12,1fr)] border-b pb-2 text-xs text-muted-foreground">
                <div />
                {window.map((m) => (
                  <div key={m}>{label(m)}</div>
                ))}
              </div>
              {milestones.data.map((m) => {
                const start = Math.max(monthIndex(m.start_date) - window[0]!, 0);
                const end = Math.min(monthIndex(m.end_date) - window[0]! + 1, 12);
                const visible = end > 0 && start < 12;
                return (
                  <div
                    key={m.id}
                    className="grid grid-cols-[220px_repeat(12,1fr)] items-center border-b py-3 last:border-0"
                  >
                    <button
                      className="pr-3 text-left text-sm disabled:cursor-default"
                      disabled={!canAuthor}
                      onClick={() => setEditing(m)}
                    >
                      <div className="font-medium">{m.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {m.policy_reference}
                      </div>
                    </button>
                    {visible ? (
                      <div
                        className="relative h-6 rounded bg-muted"
                        style={{ gridColumn: `${start + 2} / ${end + 2}` }}
                      >
                        <div
                          className={`h-6 rounded ${m.status === "delayed" ? "bg-warning" : "bg-primary"}`}
                          style={{ width: `${Math.max(m.progress, 3)}%` }}
                        />
                        {/* Light text once the filled bar sits under the centred label. */}
                        <span
                          className={`absolute inset-0 grid place-items-center text-xs font-medium ${m.progress >= 50 && m.status !== "delayed" ? "text-primary-foreground" : ""}`}
                        >
                          {m.progress}%
                        </span>
                      </div>
                    ) : (
                      <span className="col-span-12 text-xs text-muted-foreground">
                        Outside this window
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <DataTable
            cols={[
              "Policy",
              "Phase",
              "Milestone",
              "Owner",
              "Start",
              "End",
              "KPI",
              "Progress",
              "Status",
              "",
            ]}
            rows={milestones.data.map((m) => [
              <span className="font-mono text-xs">{m.policy_reference}</span>,
              humanise(m.phase),
              <span className="font-medium">{m.name}</span>,
              m.owner_detail.name,
              formatDate(m.start_date),
              formatDate(m.end_date),
              m.kpi,
              `${m.progress}%`,
              <StatusBadge value={m.status} />,
              canAuthor ? (
                <Button size="sm" variant="ghost" onClick={() => setEditing(m)}>
                  Update
                </Button>
              ) : null,
            ])}
          />
        )}
      </Panel>
      {editing && (
        <MilestoneForm
          key={editing === "new" ? "new" : editing.id}
          milestone={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function MilestoneForm({
  milestone,
  onClose,
}: {
  milestone: GovernanceMilestone | "new";
  onClose: () => void;
}) {
  const people = useGovernancePeople();
  const policies = useGovernancePolicies();
  const create = useCreateGovernanceMilestone();
  const update = useUpdateGovernanceMilestone();
  const existing = milestone === "new" ? null : milestone;
  const [form, setForm] = useState<GovernanceMilestoneInput>(() =>
    existing
      ? {
          policy: existing.policy,
          name: existing.name,
          phase: existing.phase,
          owner: existing.owner,
          start_date: existing.start_date,
          end_date: existing.end_date,
          progress: existing.progress,
          kpi: existing.kpi,
          status: existing.status,
        }
      : { progress: 0, status: "not_started" },
  );
  const set = <K extends keyof GovernanceMilestoneInput>(
    key: K,
    value: GovernanceMilestoneInput[K],
  ) => setForm((f) => ({ ...f, [key]: value }));
  const done = {
    onSuccess: () => {
      toast.success("Milestone saved");
      onClose();
    },
    onError: (e: unknown) => toast.error(errorMessage(e)),
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Update milestone" : "Add milestone"}</DialogTitle>
          <DialogDescription>
            A complete milestone is at 100 percent; one not started is at 0.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (existing) update.mutate({ id: existing.id, body: form }, done);
            else create.mutate(form, done);
          }}
        >
          <Field label="Policy" htmlFor="m-policy">
            <select
              id="m-policy"
              required
              className={selectClass}
              value={form.policy ?? ""}
              onChange={(e) => set("policy", e.target.value)}
            >
              <option value="">Choose…</option>
              {(policies.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference} {p.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Milestone" htmlFor="m-name">
            <Input
              id="m-name"
              required
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Phase" htmlFor="m-phase">
              <select
                id="m-phase"
                required
                className={selectClass}
                value={form.phase ?? ""}
                onChange={(e) => set("phase", e.target.value as GovernanceMilestonePhase)}
              >
                <option value="">Choose…</option>
                {PHASES.map((p) => (
                  <option key={p} value={p}>
                    {humanise(p)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Owner" htmlFor="m-owner">
              <select
                id="m-owner"
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
            <Field label="Start" htmlFor="m-start">
              <Input
                id="m-start"
                type="date"
                required
                value={form.start_date ?? ""}
                onChange={(e) => set("start_date", e.target.value)}
              />
            </Field>
            <Field label="End" htmlFor="m-end">
              <Input
                id="m-end"
                type="date"
                required
                value={form.end_date ?? ""}
                onChange={(e) => set("end_date", e.target.value)}
              />
            </Field>
            <Field label="Status" htmlFor="m-status">
              <select
                id="m-status"
                className={selectClass}
                value={form.status ?? "not_started"}
                onChange={(e) => set("status", e.target.value as GovernanceMilestoneStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {humanise(s)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Progress (%)" htmlFor="m-progress">
              <Input
                id="m-progress"
                type="number"
                min={0}
                max={100}
                value={form.progress ?? 0}
                onChange={(e) => set("progress", Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="KPI" htmlFor="m-kpi">
            <Input id="m-kpi" value={form.kpi ?? ""} onChange={(e) => set("kpi", e.target.value)} />
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
