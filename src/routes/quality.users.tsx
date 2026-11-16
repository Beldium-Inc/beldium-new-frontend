import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/errors";
import type { QualityRoleCode } from "@/lib/api/quality";
import type { RoleAssignment, RoleAssignmentStatus } from "@/lib/api/quality-admin";
import {
  useCreateRoleAssignment,
  useDecideRoleAssignment,
  useEndRoleAssignment,
  useQualityRoles,
  useRoleAssignments,
} from "@/lib/api/quality-admin-queries";
import { useOrganisationDirectory } from "@/lib/api/queries";
import { ServerPager } from "@/components/shared/server-pager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppShell } from "@/verticals/quality/shell";
import { ReasonDialog } from "@/verticals/quality/reason-dialog";
import { useBeldium } from "@/verticals/quality/store";
import {
  EmptyState,
  PageHeader,
  Pill,
  SectionTitle,
  StatusPill,
  Surface,
} from "@/verticals/quality/ui";

export const Route = createFileRoute("/quality/users")({
  head: () => ({ meta: [{ title: "Users and roles | Beldium Quality & Control" }] }),
  component: () => (
    <AppShell>
      <UsersPage />
    </AppShell>
  ),
});

// Roles that always belong to an outside organisation (backend quality/roles.py).
const ORGANISATION_ROLES: QualityRoleCode[] = ["SUP", "SMP", "INS", "LAB", "LOG", "EXP", "BYR"];

const STATUS_FILTERS: { value: RoleAssignmentStatus | ""; label: string }[] = [
  { value: "pending_approval", label: "Waiting for approval" },
  { value: "active", label: "Active" },
  { value: "ended", label: "Ended" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All" },
];

function message(error: unknown): string {
  return error instanceof ApiError ? error.message : "That did not go through. Please try again.";
}

function UsersPage() {
  const { canDo } = useBeldium();
  const canRead = canDo("users_and_roles", "read");
  const [status, setStatus] = React.useState<RoleAssignmentStatus | "">("pending_approval");
  const [page, setPage] = React.useState(1);
  const assignments = useRoleAssignments({ status, page }, canRead);
  const roles = useQualityRoles(canRead);

  if (!canRead) {
    return (
      <Surface>
        <EmptyState
          title="Your role does not manage users and roles"
          hint="Beldium Admin gives roles, the Q&C Partner approves them and the Technical Lead ends them."
        />
      </Surface>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Access"
        title="Users and roles"
        description="A role gives no access until the Q&C Partner approves it. Assignments are never deleted: ending one removes access at once and keeps the record."
      />

      {canDo("users_and_roles", "create") ? <GiveRoleForm /> : null}

      <Surface className="mt-6">
        <SectionTitle
          title="Role assignments"
          action={
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((filter) => (
                <Button
                  key={filter.label}
                  size="sm"
                  variant={status === filter.value ? "default" : "outline"}
                  onClick={() => {
                    setStatus(filter.value);
                    setPage(1);
                  }}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          }
        />
        {assignments.isPending ? (
          <EmptyState title="Loading…" />
        ) : assignments.isError ? (
          <EmptyState title={message(assignments.error)} />
        ) : assignments.data.results.length === 0 ? (
          <EmptyState title="No assignments here" />
        ) : (
          <div className="divide-y divide-border">
            {assignments.data.results.map((row) => (
              <AssignmentRow key={row.id} row={row} />
            ))}
          </div>
        )}
        {assignments.data ? (
          <ServerPager
            page={page}
            count={assignments.data.count}
            hasNext={Boolean(assignments.data.next)}
            busy={assignments.isFetching}
            onPage={setPage}
          />
        ) : null}
      </Surface>

      <Surface className="mt-6">
        <SectionTitle
          title="The 12 roles"
          hint="From the access grid in the Build Pack (Figure 5). C create, R read, U update, A approve. * restricted view."
        />
        {roles.data ? (
          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            {roles.data.map((role) => (
              <div key={role.role_code} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-navy">
                    {role.role_code} · {role.role_name}
                  </p>
                  <Pill tone={role.is_internal ? "navy" : "info"}>
                    {role.is_internal ? "Beldium" : "Outside"}
                  </Pill>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {Object.entries(role.grid).map(([record, actions]) => (
                    <li key={record} className="flex justify-between gap-3">
                      <span>{record.replace(/_/g, " ")}</span>
                      <span className="font-mono text-navy">
                        {(actions ?? []).map((a) => a[0]!.toUpperCase()).join("")}
                        {role.restricted.includes(record as (typeof role.restricted)[number])
                          ? "*"
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={roles.isError ? message(roles.error) : "Loading…"} />
        )}
      </Surface>
    </>
  );
}

function AssignmentRow({ row }: { row: RoleAssignment }) {
  const { canDo } = useBeldium();
  const decide = useDecideRoleAssignment();
  const end = useEndRoleAssignment();
  const [dialog, setDialog] = React.useState<"reject" | "end" | null>(null);

  const approve = async () => {
    try {
      await decide.mutateAsync({ id: row.id, decision: "approve" });
      toast.success(`${row.role_code} approved for ${row.user_email}.`);
    } catch (error) {
      toast.error(message(error));
    }
  };

  const run = async (reason: string) => {
    try {
      if (dialog === "reject") {
        await decide.mutateAsync({ id: row.id, decision: "reject", reason });
        toast.success("Assignment rejected.");
      } else {
        await end.mutateAsync({ id: row.id, reason });
        toast.success("Assignment ended. Access is removed.");
      }
      return true;
    } catch (error) {
      toast.error(message(error));
      return false;
    }
  };

  const pending = row.status === "pending_approval";
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-navy">{row.user_name || row.user_email}</p>
          <Pill tone="navy">{row.role_code}</Pill>
          <StatusPill value={row.status} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {row.user_email}
          {row.organisation_name ? ` · ${row.organisation_name}` : ""} · from {row.valid_from}
          {row.valid_to ? ` to ${row.valid_to}` : ""}
        </p>
        {row.decision_reason || row.end_reason ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Reason: {row.end_reason || row.decision_reason}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2">
        {pending && canDo("users_and_roles", "approve") ? (
          <>
            <Button size="sm" onClick={() => void approve()} disabled={decide.isPending}>
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDialog("reject")}>
              Reject
            </Button>
          </>
        ) : null}
        {row.status === "active" && canDo("users_and_roles", "update") ? (
          <Button size="sm" variant="outline" onClick={() => setDialog("end")}>
            End
          </Button>
        ) : null}
      </div>
      <ReasonDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog === "reject" ? "Reject this role" : "End this role"}
        description={
          dialog === "reject"
            ? "The person gets no access from this request."
            : "Access ends on the person's next request. The record is kept."
        }
        confirmLabel={dialog === "reject" ? "Reject" : "End role"}
        busy={decide.isPending || end.isPending}
        onConfirm={run}
      />
    </div>
  );
}

function GiveRoleForm() {
  const create = useCreateRoleAssignment();
  const roles = useQualityRoles();
  const [email, setEmail] = React.useState("");
  const [roleCode, setRoleCode] = React.useState<QualityRoleCode | "">("");
  const [organisationId, setOrganisationId] = React.useState("");
  const [validFrom, setValidFrom] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [validTo, setValidTo] = React.useState("");
  const needsOrganisation = roleCode !== "" && ORGANISATION_ROLES.includes(roleCode);
  const directory = useOrganisationDirectory({}, { enabled: needsOrganisation });

  const submit = async () => {
    if (!email.trim() || !roleCode) return;
    try {
      await create.mutateAsync({
        user_email: email.trim(),
        role_code: roleCode,
        organisation_id: needsOrganisation ? organisationId || null : null,
        valid_from: validFrom,
        valid_to: validTo || null,
      });
      toast.success("Role requested. The Q&C Partner must approve it before it gives access.");
      setEmail("");
      setRoleCode("");
      setOrganisationId("");
      setValidTo("");
    } catch (error) {
      toast.error(message(error));
    }
  };

  return (
    <Surface>
      <SectionTitle title="Give a role" hint="Beldium Admin only. It waits for the Q&C Partner." />
      <form
        className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="space-y-1.5 xl:col-span-2">
          <Label htmlFor="role-email">Person's email</Label>
          <Input
            id="role-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role-code">Role</Label>
          <select
            id="role-code"
            value={roleCode}
            onChange={(e) => setRoleCode(e.target.value as QualityRoleCode | "")}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Choose…</option>
            {(roles.data ?? []).map((role) => (
              <option key={role.role_code} value={role.role_code}>
                {role.role_code} · {role.role_name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role-from">From</Label>
          <Input
            id="role-from"
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role-to">To (optional)</Label>
          <Input
            id="role-to"
            type="date"
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
          />
        </div>
        {needsOrganisation ? (
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="role-org">
              Organisation (must be verified, and the person a member)
            </Label>
            <select
              id="role-org"
              value={organisationId}
              onChange={(e) => setOrganisationId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Choose…</option>
              {(directory.data?.results ?? []).map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="flex items-end xl:col-span-5">
          <Button
            type="submit"
            disabled={
              create.isPending ||
              !email.trim() ||
              !roleCode ||
              (needsOrganisation && !organisationId)
            }
          >
            {create.isPending ? "Sending…" : "Request role"}
          </Button>
        </div>
      </form>
    </Surface>
  );
}
