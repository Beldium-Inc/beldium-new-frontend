import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AppShell } from "@/verticals/quality/shell";
import {
  EmptyState,
  PageHeader,
  Pill,
  SectionTitle,
  Stat,
  StatusPill,
  Surface,
} from "@/verticals/quality/ui";
import { useBeldium } from "@/verticals/quality/store";
import { usePendingActions } from "@/verticals/quality/pending-actions";
import { ReasonDialog } from "@/verticals/quality/reason-dialog";
import type { NonConformity } from "@/verticals/quality/types";

export const Route = createFileRoute("/quality/nonconformities")({
  head: () => ({
    meta: [
      { title: "Non-conformities & corrective actions | Beldium" },
      {
        name: "description",
        content:
          "Raise non-conformities against partners, track corrective and preventive actions to closure, and keep the material trust chain intact.",
      },
      { property: "og:title", content: "Non-conformities & corrective actions | Beldium" },
      {
        property: "og:description",
        content: "CAPA supervision from finding to verified closure.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <NonConformitiesPage />
    </AppShell>
  ),
});

function NonConformitiesPage() {
  const {
    state,
    role,
    raiseNonConformity,
    addCorrectiveAction,
    advanceCorrectiveAction,
    closeNonConformity,
  } = useBeldium();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    against: "Antwerp Assay Laboratories NV",
    severity: "major" as NonConformity["severity"],
    detail: "",
  });
  const [capaDraft, setCapaDraft] = React.useState<Record<string, string>>({});
  const actions = usePendingActions();
  const [closing, setClosing] = React.useState<NonConformity | null>(null);

  const canRaise = role === "operator";
  const canRespond = role === "partner" || role === "operator";

  return (
    <>
      <PageHeader
        eyebrow="Assurance"
        title="Non-conformities & corrective actions"
        description="Findings never disappear quietly. Each non-conformity carries an owner, a due date and evidence of closure before the partner's standing is restored."
        actions={
          canRaise ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-navy-foreground hover:bg-navy/90"
            >
              <Plus className="size-4" /> Raise non-conformity
            </button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Open"
          value={state.nonConformities.filter((n) => n.status === "open").length}
        />
        <Stat
          label="CAPA submitted"
          value={state.nonConformities.filter((n) => n.status === "capa_submitted").length}
          tone="pale"
        />
        <Stat
          label="Closed"
          value={state.nonConformities.filter((n) => n.status === "closed").length}
        />
        <Stat
          label="Actions overdue"
          value={
            state.nonConformities.flatMap((n) => n.capa).filter((c) => c.status !== "complete")
              .length
          }
          sub="pending completion"
        />
      </div>

      {open && canRaise ? (
        <Surface className="mt-6">
          <SectionTitle title="New non-conformity" />
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Title
              </span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Sample seal broken before laboratory receipt"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-link"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Against
              </span>
              <input
                value={form.against}
                onChange={(e) => setForm({ ...form, against: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-link"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Severity
              </span>
              <select
                value={form.severity}
                onChange={(e) =>
                  setForm({ ...form, severity: e.target.value as NonConformity["severity"] })
                }
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-link"
              >
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Detail
              </span>
              <textarea
                rows={3}
                value={form.detail}
                onChange={(e) => setForm({ ...form, detail: e.target.value })}
                className="mt-1.5 w-full rounded-2xl border border-border bg-background p-3 text-sm outline-none focus:border-link"
              />
            </label>
          </div>
          <div className="px-6 pb-6">
            <button
              type="button"
              disabled={actions.isBusy("raise")}
              onClick={async () => {
                if (!form.title.trim()) {
                  toast.error("A title is required");
                  return;
                }
                const ok = await actions.run(
                  "raise",
                  () => raiseNonConformity(form),
                  "Non-conformity raised",
                );
                if (!ok) return;
                setForm((prev) => ({ ...prev, title: "", detail: "" }));
                setOpen(false);
              }}
              className="disabled:opacity-50 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-navy-foreground hover:bg-navy/90"
            >
              Raise finding
            </button>
          </div>
        </Surface>
      ) : null}

      <div className="mt-6 space-y-6">
        {state.nonConformities.length === 0 ? (
          <Surface>
            <EmptyState title="No non-conformities recorded" />
          </Surface>
        ) : (
          state.nonConformities.map((n) => (
            <Surface key={n.id}>
              <SectionTitle
                title={`${n.ref} · ${n.title}`}
                hint={`Raised ${n.raisedAt} by ${n.raisedBy} against ${n.against}`}
                action={
                  <div className="flex items-center gap-2">
                    <StatusPill value={n.severity} />
                    <StatusPill value={n.status} />
                  </div>
                }
              />
              <div className="px-6 py-5">
                <p className="text-sm text-muted-foreground">{n.detail}</p>

                <p className="mt-5 text-xs font-semibold tracking-wide text-navy uppercase">
                  Corrective &amp; preventive actions
                </p>
                <div className="mt-2 divide-y divide-border rounded-2xl border border-border">
                  {n.capa.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-muted-foreground">
                      No actions submitted yet.
                    </p>
                  ) : (
                    n.capa.map((c) => (
                      <div
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-navy">{c.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.owner} · due {c.due}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusPill value={c.status} />
                          {canRespond && c.status !== "complete" ? (
                            <button
                              type="button"
                              disabled={actions.isBusy(`advance:${c.id}`)}
                              onClick={() =>
                                void actions.run(
                                  `advance:${c.id}`,
                                  () => advanceCorrectiveAction(n.id, c.id),
                                  "Action progressed",
                                )
                              }
                              className="disabled:opacity-50 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-navy hover:border-link hover:text-link"
                            >
                              Advance
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {canRespond && n.status !== "closed" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <input
                      value={capaDraft[n.id] ?? ""}
                      onChange={(e) => setCapaDraft({ ...capaDraft, [n.id]: e.target.value })}
                      placeholder="Describe a corrective action"
                      className="min-w-[240px] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-link"
                    />
                    <button
                      type="button"
                      disabled={actions.isBusy(`capa:${n.id}`)}
                      onClick={async () => {
                        const text = (capaDraft[n.id] ?? "").trim();
                        if (!text) {
                          toast.error("Describe the action first");
                          return;
                        }
                        const ok = await actions.run(
                          `capa:${n.id}`,
                          () =>
                            addCorrectiveAction(n.id, {
                              action: text,
                              owner: "Assigned partner",
                              due: "2026-09-15",
                              status: "open",
                            }),
                          "Corrective action submitted",
                        );
                        if (ok) setCapaDraft((prev) => ({ ...prev, [n.id]: "" }));
                      }}
                      className="disabled:opacity-50 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-navy-foreground hover:bg-navy/90"
                    >
                      Submit action
                    </button>
                    {role === "operator" ? (
                      <button
                        type="button"
                        onClick={() => setClosing(n)}
                        disabled={actions.isBusy(`close:${n.id}`)}
                        className="disabled:opacity-50 rounded-xl border border-success bg-success/40 px-4 py-2 text-sm font-semibold text-success-foreground"
                      >
                        Verify &amp; close
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {n.status === "closed" ? (
                  <Pill tone="success" className="mt-4">
                    Closure verified by the compliance operator
                  </Pill>
                ) : null}
              </div>
            </Surface>
          ))
        )}
      </div>

      <ReasonDialog
        open={closing !== null}
        onOpenChange={(next) => {
          if (!next) setClosing(null);
        }}
        title="Close this non-conformity?"
        description="Closing records that the corrective actions were verified. The reason is kept on the record."
        confirmLabel="Verify and close"
        busy={closing !== null && actions.isBusy(`close:${closing.id}`)}
        onConfirm={async (reason) => {
          if (!closing) return false;
          const ok = await actions.run(
            `close:${closing.id}`,
            () => closeNonConformity(closing.id, reason),
            "Non-conformity closed",
          );
          if (ok) setClosing(null);
          return ok;
        }}
      />
    </>
  );
}
