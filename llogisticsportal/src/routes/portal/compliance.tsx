import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import {
  Field,
  FormDialog,
  ResourceTable,
  errorMessage,
  fieldCls,
  fmtDate,
  fmtDateTime,
  pretty,
  useListQuery,
  type Column,
} from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  listConditions,
  listRestrictions,
  submitConditionEvidence,
  type ApprovalCondition,
  type LogisticsDomainKey,
  type ScopeRestriction,
} from "@/lib/api/logistics";
import { listFindings, type ComplianceFinding } from "@/lib/api/operations";
import { useOpsList, useOpsMutation, useUpdateFinding } from "@/lib/api/operations-queries";

export const Route = createFileRoute("/portal/compliance")({
  head: () => ({ meta: [{ title: "Compliance - Beldium Logistics Hub" }] }),
  component: CompliancePage,
});

function CompliancePage() {
  const list = useListQuery();
  const findings = useOpsList("compliance-findings", listFindings, list.query);
  const conditions = useOpsList("conditions", listConditions, { page_size: 100 });
  const restrictions = useOpsList("restrictions", listRestrictions, { page_size: 100 });
  const [acting, setActing] = useState<ComplianceFinding | null>(null);
  const [evidenceFor, setEvidenceFor] = useState<ApprovalCondition | null>(null);

  const findingColumns: Column<ComplianceFinding>[] = [
    { header: "Finding", cell: (f) => <span className="font-medium">{f.reference}</span> },
    { header: "Area", cell: (f) => f.area },
    { header: "Detail", cell: (f) => f.detail, className: "max-w-sm" },
    { header: "Corrective action", cell: (f) => f.action || "-", className: "max-w-xs" },
    { header: "Owner", cell: (f) => f.owner || "-" },
    { header: "Raised", cell: (f) => fmtDate(f.raised_at) },
    { header: "Status", cell: (f) => <StatusBadge value={pretty(f.status)} /> },
    {
      header: "",
      cell: (f) =>
        f.status === "cleared" || f.status === "corrective_action_submitted" ? null : (
          <Button size="sm" variant="outline" onClick={() => setActing(f)}>
            Record action
          </Button>
        ),
    },
  ];

  const conditionColumns: Column<ApprovalCondition>[] = [
    { header: "Condition", cell: (c) => <span className="font-medium">{c.title}</span> },
    { header: "Detail", cell: (c) => c.description, className: "max-w-sm" },
    { header: "Scope", cell: (c) => c.service_scope || "All services" },
    {
      header: "Due",
      cell: (c) => (
        <span className={c.is_overdue ? "text-destructive" : ""}>{fmtDate(c.due_date)}</span>
      ),
    },
    {
      header: "Status",
      cell: (c) => (
        <StatusBadge value={c.cleared_at ? "Cleared" : c.is_overdue ? "Overdue" : "Open"} />
      ),
    },
    {
      header: "",
      cell: (c) =>
        c.cleared_at ? null : (
          <Button size="sm" variant="outline" onClick={() => setEvidenceFor(c)}>
            Submit evidence
          </Button>
        ),
    },
  ];

  const restrictionColumns: Column<ScopeRestriction>[] = [
    { header: "Service", cell: (r) => <span className="font-medium">{r.service_scope}</span> },
    { header: "Reason", cell: (r) => r.reason, className: "max-w-md" },
    { header: "Applied", cell: (r) => (r.automatic ? "Automatically" : "By Beldium") },
    { header: "Since", cell: (r) => fmtDateTime(r.created_at) },
    {
      header: "Status",
      cell: (r) => <StatusBadge value={r.resolved_at ? "Resolved" : "Restricted"} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Compliance"
        description="Findings raised against your operations, conditions on your approval, and any services currently restricted."
      />
      <div className="space-y-4">
        <Panel
          title="Restricted services"
          description="While a service is restricted you can't take jobs in that scope."
        >
          <ResourceTable
            columns={restrictionColumns}
            data={restrictions.data}
            isLoading={restrictions.isLoading}
            error={restrictions.error}
            empty="No restrictions. All approved services are open."
          />
        </Panel>
        <Panel
          title="Approval conditions"
          description="Conditions attached to your approval. Upload evidence before the due date."
        >
          <ResourceTable
            columns={conditionColumns}
            data={conditions.data}
            isLoading={conditions.isLoading}
            error={conditions.error}
            empty="No conditions on your approval."
          />
        </Panel>
        <Panel title="Compliance findings">
          <ResourceTable
            columns={findingColumns}
            data={findings.data}
            isLoading={findings.isLoading}
            error={findings.error}
            page={list.page}
            onPage={list.setPage}
            empty="No findings."
          />
        </Panel>
      </div>
      {acting ? <FindingDialog finding={acting} onClose={() => setActing(null)} /> : null}
      {evidenceFor ? (
        <EvidenceDialog condition={evidenceFor} onClose={() => setEvidenceFor(null)} />
      ) : null}
    </>
  );
}

function FindingDialog({ finding, onClose }: { finding: ComplianceFinding; onClose: () => void }) {
  const update = useUpdateFinding();
  const [action, setAction] = useState(finding.action);
  const [error, setError] = useState("");
  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Corrective action · ${finding.reference}`}
      submitLabel="Submit corrective action"
      busy={update.isPending}
      error={error}
      onSubmit={() => {
        if (!action.trim()) return setError("Describe the corrective action taken.");
        update.mutate(
          { id: finding.id, action: action.trim(), status: "corrective_action_submitted" },
          {
            onSuccess: () => {
              toast.success("Corrective action submitted for review");
              onClose();
            },
            onError: (e) => setError(errorMessage(e)),
          },
        );
      }}
    >
      <p className="text-sm text-muted-foreground">{finding.detail}</p>
      <Field label="Corrective action taken">
        <Textarea rows={4} value={action} onChange={(e) => setAction(e.target.value)} />
      </Field>
    </FormDialog>
  );
}

const DOMAINS: [LogisticsDomainKey, string][] = [
  ["corporate", "Corporate"],
  ["regulatory", "Regulatory"],
  ["fleet", "Fleet"],
  ["driver", "Driver"],
  ["insurance", "Insurance"],
  ["hs", "Health & safety"],
  ["operational", "Operational"],
  ["mineral", "Mineral transport"],
  ["data", "Data & tracking"],
];

function EvidenceDialog({
  condition,
  onClose,
}: {
  condition: ApprovalCondition;
  onClose: () => void;
}) {
  const submit = useOpsMutation((input: Parameters<typeof submitConditionEvidence>[1]) =>
    submitConditionEvidence(condition.id, input),
  );
  const [domain, setDomain] = useState<LogisticsDomainKey>("regulatory");
  const [title, setTitle] = useState(condition.title);
  const [reference, setReference] = useState("");
  const [expires, setExpires] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Evidence · ${condition.title}`}
      submitLabel="Upload evidence"
      busy={submit.isPending}
      error={error}
      onSubmit={() => {
        if (!file) return setError("Choose a file.");
        submit.mutate(
          {
            domain,
            document_type: `condition_evidence:${condition.id}`,
            title,
            file,
            reference,
            expires_on: expires || null,
          },
          {
            onSuccess: () => {
              toast.success("Evidence submitted for review");
              onClose();
            },
            onError: (e) => setError(errorMessage(e)),
          },
        );
      }}
    >
      <p className="text-sm text-muted-foreground">{condition.description}</p>
      <Field label="Review domain">
        <select
          className={fieldCls}
          value={domain}
          onChange={(e) => setDomain(e.target.value as LogisticsDomainKey)}
        >
          {DOMAINS.map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Reference number">
          <Input value={reference} onChange={(e) => setReference(e.target.value)} />
        </Field>
        <Field label="Expiry date (if any)">
          <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
        </Field>
      </div>
      <Field label="File">
        <input
          type="file"
          className="text-sm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </Field>
    </FormDialog>
  );
}
