import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  GOVERNANCE_SECTORS,
  downloadGovernanceReport,
  useCreateGovernancePolicy,
  useGovernanceCan,
  useGovernancePeople,
  useGovernancePolicies,
  useGovernancePolicy,
  useTransitionGovernancePolicy,
  useUpdateGovernancePolicy,
  type GovernancePolicy,
  type GovernancePolicyAction,
  type GovernancePolicyInput,
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
  formatDateTime,
  humanise,
  selectClass,
} from "@/verticals/governance/ui";

export const Route = createFileRoute("/governance/policies")({
  validateSearch: (search: Record<string, unknown>): { open?: string } =>
    typeof search["open"] === "string" ? { open: search["open"] } : {},
  component: Policies,
});

const FLOW: { value: string; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted for Review" },
  { value: "under_review", label: "Under Review" },
  { value: "revision_requested", label: "Revision Requested" },
  { value: "recommended", label: "Recommended" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const ACTION_LABEL: Record<GovernancePolicyAction, string> = {
  submit: "Submit for review",
  start_review: "Start review",
  request_revision: "Request revision",
  recommend: "Recommend for approval",
  approve: "Approve",
  reject: "Reject",
  publish: "Publish",
  archive: "Archive",
};

const NEEDS_COMMENT = new Set<GovernancePolicyAction>(["request_revision", "reject", "archive"]);

function Policies() {
  const { open } = Route.useSearch();
  const navigate = useNavigate({ from: "/governance/policies" });
  const policies = useGovernancePolicies();
  const canAuthor = useGovernanceCan("author");
  const canReport = useGovernanceCan("report");
  const [editing, setEditing] = useState<GovernancePolicy | "new" | null>(null);

  const setOpen = (id: string | null) => navigate({ search: id ? { open: id } : {} });

  return (
    <>
      <PageHeader
        title="Policy Briefing"
        desc="Create, review and approve governance policies within assigned authority. Every step is recorded against the version it was taken on."
        actions={
          <>
            {canReport && (
              <Button
                variant="outline"
                onClick={() =>
                  downloadGovernanceReport("policy", "pdf").catch((e: unknown) =>
                    toast.error(errorMessage(e)),
                  )
                }
              >
                Export dossier
              </Button>
            )}
            {canAuthor && <Button onClick={() => setEditing("new")}>New policy</Button>}
          </>
        }
      />
      <Panel>
        {policies.isPending ? (
          <Loading />
        ) : policies.error ? (
          <LoadError error={policies.error} />
        ) : (
          <DataTable
            cols={["Reference", "Title", "Domain", "Owner", "Version", "Review date", "Status"]}
            empty="No policies yet."
            rows={policies.data.map((p) => [
              <span className="font-mono text-xs">{p.reference}</span>,
              <button
                className="text-left font-medium hover:text-primary"
                onClick={() => setOpen(p.id)}
              >
                {p.title}
              </button>,
              p.domain,
              p.owner_detail.name,
              p.version,
              formatDate(p.review_date),
              <StatusBadge value={p.status} label={p.status_label} />,
            ])}
          />
        )}
      </Panel>
      <PolicySheet
        id={open ?? null}
        onClose={() => setOpen(null)}
        onEdit={(p) => {
          setOpen(null);
          setEditing(p);
        }}
        canAuthor={canAuthor}
      />
      <PolicyForm
        key={editing === "new" ? "new" : (editing?.id ?? "closed")}
        policy={editing}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

function PolicySheet({
  id,
  onClose,
  onEdit,
  canAuthor,
}: {
  id: string | null;
  onClose: () => void;
  onEdit: (policy: GovernancePolicy) => void;
  canAuthor: boolean;
}) {
  const { data: policy, isPending, error } = useGovernancePolicy(id);
  const transition = useTransitionGovernancePolicy();
  const [comment, setComment] = useState("");

  const act = (action: GovernancePolicyAction) => {
    if (!policy) return;
    if (NEEDS_COMMENT.has(action) && !comment.trim()) {
      toast.error("Add a comment explaining this decision first.");
      return;
    }
    transition.mutate(
      { id: policy.id, action, comment },
      {
        onSuccess: (updated) => {
          toast.success(`${ACTION_LABEL[action]}: ${updated.status_label}, ${updated.version}`);
          setComment("");
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    );
  };

  const editable = policy && ["draft", "revision_requested"].includes(policy.status) && canAuthor;

  return (
    <Sheet open={Boolean(id)} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {isPending ? (
          <Loading />
        ) : error ? (
          <div className="p-4">
            <LoadError error={error} />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="font-display text-2xl">{policy.title}</SheetTitle>
              <SheetDescription className="font-mono text-xs">
                {policy.reference} · {policy.version} · Owner {policy.owner_detail.name}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-8 text-sm">
              <div>
                <div className="mb-2 font-medium">Approval workflow</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ...FLOW,
                    ...(policy.status === "rejected"
                      ? [{ value: "rejected", label: "Rejected" }]
                      : []),
                  ].map((f) => (
                    <span
                      key={f.value}
                      className={`rounded-full border px-2.5 py-1 text-xs ${f.value === policy.status ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Domain</dt>
                  <dd>{policy.domain}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sector</dt>
                  <dd>{GOVERNANCE_SECTORS.find((s) => s.value === policy.sector)?.label}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Jurisdiction</dt>
                  <dd>{policy.jurisdiction || "Not set"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Review date</dt>
                  <dd>{formatDate(policy.review_date) || "Not set"}</dd>
                </div>
              </dl>
              {(
                [
                  ["Executive summary", policy.executive_summary],
                  ["Strategic context", policy.strategic_context],
                  ["Policy objectives", policy.objectives],
                  ["Stakeholders", policy.stakeholders],
                  ["Applicable regulatory instruments", policy.regulatory_instruments],
                  ["Expected outcomes", policy.expected_outcomes],
                ] as const
              )
                .filter(([, text]) => text)
                .map(([label, text]) => (
                  <div key={label}>
                    <div className="font-medium">{label}</div>
                    <p className="mt-1 whitespace-pre-line text-muted-foreground">{text}</p>
                  </div>
                ))}
              <div>
                <div className="mb-1 font-medium">History</div>
                <ul className="space-y-2 text-xs">
                  {(policy.events ?? []).map((e) => (
                    <li key={e.id} className="border-l-2 border-border pl-3">
                      <div>
                        <span className="font-medium">{humanise(e.action)}</span> · {e.version} ·{" "}
                        {e.actor.name}
                      </div>
                      <div className="text-muted-foreground">{formatDateTime(e.created_at)}</div>
                      {e.comment && <div className="mt-0.5 italic">“{e.comment}”</div>}
                    </li>
                  ))}
                </ul>
              </div>
              {policy.allowed_actions.length > 0 && (
                <div className="space-y-2">
                  <label htmlFor="policy-comment" className="font-medium">
                    Reviewer comment
                  </label>
                  <Textarea
                    id="policy-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Required for a revision request, rejection or archive"
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {editable && (
                  <Button variant="outline" onClick={() => onEdit(policy)}>
                    Edit
                  </Button>
                )}
                {policy.allowed_actions.map((action) => (
                  <Button
                    key={action}
                    variant={
                      action === "reject"
                        ? "destructive"
                        : action === "request_revision" || action === "archive"
                          ? "outline"
                          : "default"
                    }
                    disabled={transition.isPending}
                    onClick={() => act(action)}
                  >
                    {ACTION_LABEL[action]}
                  </Button>
                ))}
              </div>
              {policy.allowed_actions.length === 0 && !editable && (
                <p className="text-xs text-muted-foreground">
                  No action is open to your role at this stage.
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

const TEXT_FIELDS: [keyof GovernancePolicyInput, string][] = [
  ["executive_summary", "Executive summary"],
  ["strategic_context", "Strategic context"],
  ["objectives", "Policy objectives"],
  ["stakeholders", "Stakeholders"],
  ["regulatory_instruments", "Applicable regulatory instruments"],
  ["expected_outcomes", "Expected outcomes"],
];

function PolicyForm({
  policy,
  onClose,
}: {
  policy: GovernancePolicy | "new" | null;
  onClose: () => void;
}) {
  const people = useGovernancePeople();
  const create = useCreateGovernancePolicy();
  const update = useUpdateGovernancePolicy();
  const existing = policy && policy !== "new" ? policy : null;
  const [form, setForm] = useState<GovernancePolicyInput>(() =>
    existing
      ? {
          title: existing.title,
          domain: existing.domain,
          sector: existing.sector,
          responsible_organisation: existing.responsible_organisation,
          jurisdiction: existing.jurisdiction,
          owner: existing.owner,
          review_date: existing.review_date,
          executive_summary: existing.executive_summary,
          strategic_context: existing.strategic_context,
          objectives: existing.objectives,
          stakeholders: existing.stakeholders,
          regulatory_instruments: existing.regulatory_instruments,
          expected_outcomes: existing.expected_outcomes,
        }
      : { sector: "all", responsible_organisation: "Beldium Inc.", jurisdiction: "Nigeria" },
  );
  const set = <K extends keyof GovernancePolicyInput>(key: K, value: GovernancePolicyInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const busy = create.isPending || update.isPending;

  const save = () => {
    const body = { ...form, review_date: form.review_date || null };
    const done = {
      onSuccess: () => {
        toast.success(
          existing ? "Policy saved" : "Draft created. Submit it for review when ready.",
        );
        onClose();
      },
      onError: (e: unknown) => toast.error(errorMessage(e)),
    };
    if (existing) update.mutate({ id: existing.id, body }, done);
    else create.mutate(body, done);
  };

  return (
    <Sheet open={policy !== null} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">
            {existing ? `Edit ${existing.reference}` : "New policy"}
          </SheetTitle>
          <SheetDescription>
            Saved as a draft. Nothing is reviewed until you submit it.
          </SheetDescription>
        </SheetHeader>
        <form
          className="space-y-3 px-4 pb-8"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field label="Policy title" htmlFor="p-title">
            <Input
              id="p-title"
              required
              value={form.title ?? ""}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Policy domain" htmlFor="p-domain">
              <Input
                id="p-domain"
                required
                value={form.domain ?? ""}
                onChange={(e) => set("domain", e.target.value)}
              />
            </Field>
            <Field label="Sector" htmlFor="p-sector">
              <select
                id="p-sector"
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
            <Field label="Responsible organisation" htmlFor="p-org">
              <Input
                id="p-org"
                value={form.responsible_organisation ?? ""}
                onChange={(e) => set("responsible_organisation", e.target.value)}
              />
            </Field>
            <Field label="Jurisdiction" htmlFor="p-jur">
              <Input
                id="p-jur"
                value={form.jurisdiction ?? ""}
                onChange={(e) => set("jurisdiction", e.target.value)}
              />
            </Field>
            <Field label="Policy owner" htmlFor="p-owner">
              <select
                id="p-owner"
                required
                className={selectClass}
                value={form.owner ?? ""}
                onChange={(e) => set("owner", e.target.value)}
              >
                <option value="">Choose…</option>
                {(people.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role_label})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Review date" htmlFor="p-review">
              <Input
                id="p-review"
                type="date"
                value={form.review_date ?? ""}
                onChange={(e) => set("review_date", e.target.value)}
              />
            </Field>
          </div>
          {TEXT_FIELDS.map(([key, label]) => (
            <Field key={key} label={label} htmlFor={`p-${key}`}>
              <Textarea
                id={`p-${key}`}
                rows={2}
                value={(form[key] as string | undefined) ?? ""}
                onChange={(e) => set(key, e.target.value)}
              />
            </Field>
          ))}
          <p className="text-xs text-muted-foreground">
            Attach supporting evidence on Documents &amp; Reports after saving.
          </p>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save draft"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
