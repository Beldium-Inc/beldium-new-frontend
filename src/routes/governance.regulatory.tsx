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
import { useAuth } from "@/lib/auth";
import {
  GOVERNANCE_SECTORS,
  useCloseGovernanceFinding,
  useCreateGovernanceFinding,
  useEscalateGovernanceFinding,
  useGovernanceCan,
  useGovernanceFindings,
  useVerifyGovernanceFinding,
  type GovernanceFinding,
  type GovernanceFindingInput,
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
  selectClass,
} from "@/verticals/governance/ui";

export const Route = createFileRoute("/governance/regulatory")({ component: Regulatory });

type Acting = { finding: GovernanceFinding; kind: "verify" | "escalate" | "close" };

function Regulatory() {
  const findings = useGovernanceFindings();
  const { user } = useAuth();
  const canAuthor = useGovernanceCan("author");
  const canReview = useGovernanceCan("review");
  const [creating, setCreating] = useState(false);
  const [acting, setActing] = useState<Acting | null>(null);

  return (
    <>
      <PageHeader
        title="Regulatory Analysis & Review"
        desc="Each finding records its source, who recorded it, who verified it and when. A finding is verified by someone other than the person who recorded it."
        actions={
          canAuthor && <Button onClick={() => setCreating(true)}>Register requirement</Button>
        }
      />
      <Panel>
        {findings.isPending ? (
          <Loading />
        ) : findings.error ? (
          <LoadError error={findings.error} />
        ) : (
          <DataTable
            cols={[
              "Ref",
              "Requirement",
              "Authority",
              "Gap / finding",
              "Recorded by",
              "Verified by",
              "Date",
              "Status",
              "",
            ]}
            empty="No regulatory requirements registered."
            rows={findings.data.map((f) => [
              <span className="font-mono text-xs">{f.reference}</span>,
              <div>
                <div className="font-medium">{f.requirement}</div>
                {f.instrument && (
                  <div className="text-xs text-muted-foreground">{f.instrument}</div>
                )}
              </div>,
              f.authority,
              <div className="max-w-xs">
                {f.gap || <span className="text-muted-foreground">None identified</span>}
                {f.resolution && (
                  <div className="mt-1 text-xs text-success">Resolved: {f.resolution}</div>
                )}
              </div>,
              f.recorded_by.name,
              f.verified_by?.name ?? "",
              formatDate(f.created_at),
              <StatusBadge value={f.status} label={f.status_label} />,
              <div className="flex gap-1">
                {canReview &&
                  f.status === "pending_verification" &&
                  f.recorded_by.id !== user?.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActing({ finding: f, kind: "verify" })}
                    >
                      Verify
                    </Button>
                  )}
                {(canReview || canAuthor) && !["escalated", "closed"].includes(f.status) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setActing({ finding: f, kind: "escalate" })}
                  >
                    Escalate
                  </Button>
                )}
                {canReview && ["verified", "escalated"].includes(f.status) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setActing({ finding: f, kind: "close" })}
                  >
                    Close
                  </Button>
                )}
              </div>,
            ])}
          />
        )}
      </Panel>
      {creating && <FindingForm onClose={() => setCreating(false)} />}
      {acting && (
        <FindingAction
          key={`${acting.finding.id}-${acting.kind}`}
          acting={acting}
          onClose={() => setActing(null)}
        />
      )}
    </>
  );
}

function FindingAction({ acting, onClose }: { acting: Acting; onClose: () => void }) {
  const verify = useVerifyGovernanceFinding();
  const escalate = useEscalateGovernanceFinding();
  const close = useCloseGovernanceFinding();
  const [text, setText] = useState("");
  const { finding, kind } = acting;
  const title = { verify: "Verify finding", escalate: "Escalate finding", close: "Close finding" }[
    kind
  ];
  const required = kind !== "verify";
  const done = {
    onSuccess: () => {
      toast.success(`${finding.reference}: ${title.toLowerCase()} recorded`);
      onClose();
    },
    onError: (e: unknown) => toast.error(errorMessage(e)),
  };
  const submit = () => {
    if (kind === "verify") verify.mutate({ id: finding.id, comment: text }, done);
    else if (kind === "escalate") escalate.mutate({ id: finding.id, comment: text }, done);
    else close.mutate({ id: finding.id, resolution: text }, done);
  };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {finding.reference} · {finding.requirement}
          </DialogDescription>
        </DialogHeader>
        <Field
          label={
            kind === "close"
              ? "How the gap was resolved (required)"
              : kind === "escalate"
                ? "Reason (required)"
                : "Verification note"
          }
          htmlFor="finding-text"
        >
          <Textarea id="finding-text" value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={
              (required && !text.trim()) ||
              verify.isPending ||
              escalate.isPending ||
              close.isPending
            }
            onClick={submit}
          >
            {title}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FindingForm({ onClose }: { onClose: () => void }) {
  const create = useCreateGovernanceFinding();
  const [form, setForm] = useState<GovernanceFindingInput>({ sector: "all" });
  const set = <K extends keyof GovernanceFindingInput>(key: K, value: GovernanceFindingInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Register requirement</DialogTitle>
          <DialogDescription>
            Record the requirement, its authority and any gap found. It stays pending until another
            reviewer verifies it.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(form, {
              onSuccess: (f) => {
                toast.success(`${f.reference} registered`);
                onClose();
              },
              onError: (err) => toast.error(errorMessage(err)),
            });
          }}
        >
          <Field label="Requirement" htmlFor="f-req">
            <Input
              id="f-req"
              required
              value={form.requirement ?? ""}
              onChange={(e) => set("requirement", e.target.value)}
              placeholder="Mining Act s.42: Community Development Agreement"
            />
          </Field>
          <Field label="Instrument" htmlFor="f-inst">
            <Input
              id="f-inst"
              value={form.instrument ?? ""}
              onChange={(e) => set("instrument", e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Authority" htmlFor="f-auth">
              <Input
                id="f-auth"
                required
                value={form.authority ?? ""}
                onChange={(e) => set("authority", e.target.value)}
              />
            </Field>
            <Field label="Sector" htmlFor="f-sector">
              <select
                id="f-sector"
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
          </div>
          <Field label="Gap or finding" htmlFor="f-gap">
            <Textarea
              id="f-gap"
              rows={2}
              value={form.gap ?? ""}
              onChange={(e) => set("gap", e.target.value)}
            />
          </Field>
          <Field
            label="Source"
            htmlFor="f-src"
            hint="Where the requirement or gap was found: a document, link or meeting."
          >
            <Input
              id="f-src"
              value={form.source ?? ""}
              onChange={(e) => set("source", e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Register
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
