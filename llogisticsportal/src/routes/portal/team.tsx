import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Field, FormDialog, errorMessage, fieldCls, pretty } from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getCompany, listDrivers } from "@/lib/api/logistics";
import { useOpsList } from "@/lib/api/operations-queries";
import {
  useDecideJoinRequest,
  useOrganisationJoinRequests,
  useOrganisationMembers,
} from "@/lib/api/queries";
import { fullName, type JoinRequest } from "@/lib/api/types";
import {
  JOIN_STATUS_LABELS,
  MEMBER_ROLE_LABELS,
  decodeDecision,
  decodeJustification,
  encodeDecision,
} from "@/lib/membership";
import { useWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/portal/team")({
  head: () => ({
    meta: [
      { title: "Team - Beldium Logistics Hub" },
      {
        name: "description",
        content:
          "Organisation members and join requests. The organisation representative approves or declines.",
      },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { record } = useWorkspace();
  const company = useQuery({
    queryKey: ["logistics", "company", record?.companyId ?? "none"],
    queryFn: () => getCompany(record!.companyId),
    enabled: Boolean(record?.companyId),
  });
  const organisationId = company.data?.organisation ?? null;
  const members = useOrganisationMembers(organisationId);
  const requests = useOrganisationJoinRequests(organisationId);
  const [deciding, setDeciding] = useState<{ request: JoinRequest; approve: boolean } | null>(null);

  if (!record) return <p className="text-sm text-muted-foreground">Loading your organisation…</p>;

  const all = requests.data ?? [];
  const pending = all.filter((r) => r.status === "pending");
  const decided = all.filter((r) => r.status !== "pending");
  const notAdmin = requests.isError;

  return (
    <>
      <PageHeader
        title="Team"
        description="People with access to your organisation's workspace. Membership is an access decision, never a compliance decision."
      />
      <div className="space-y-4">
        <Panel
          title={`Join requests${pending.length ? ` · ${pending.length} pending` : ""}`}
          description="Only your organisation's representative or administrators can approve. A driver must be linked to a driver on your register."
        >
          {notAdmin ? (
            <p className="text-sm text-muted-foreground">
              {errorMessage(
                requests.error,
                "Only organisation administrators can see join requests.",
              )}
            </p>
          ) : requests.isLoading || company.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !pending.length ? (
            <p className="text-sm text-muted-foreground">No pending requests.</p>
          ) : (
            <ul className="divide-y divide-border">
              {pending.map((r) => {
                const { role, message } = decodeJustification(r.justification);
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {fullName(r.requester)}{" "}
                        <span className="text-muted-foreground">· {r.requester.email}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {role ? MEMBER_ROLE_LABELS[role] : pretty(r.requested_role)} · requested{" "}
                        {new Date(r.created_at).toLocaleDateString("en-GB")}
                      </p>
                      {message ? <p className="mt-2 max-w-xl text-sm">{message}</p> : null}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setDeciding({ request: r, approve: true })}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeciding({ request: r, approve: false })}
                      >
                        Decline
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Members">
          {members.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <ul className="divide-y divide-border">
              {(members.data ?? []).map((m) => {
                // The linked driver lives on the approved join request's decision notes.
                const joined = decided.find(
                  (r) => r.requester.id === m.user.id && r.status === "approved",
                );
                const { role } = joined
                  ? decodeJustification(joined.justification)
                  : { role: null };
                const { driver } = joined
                  ? decodeDecision(joined.decision_notes)
                  : { driver: null };
                return (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{fullName(m.user)}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.user.email} ·{" "}
                        {role ? MEMBER_ROLE_LABELS[role] : m.title || pretty(m.role)}
                        {driver ? ` · driver ${driver.name}` : ""}
                      </p>
                    </div>
                    <StatusBadge value={m.is_active ? "Active" : "Suspended"} />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {decided.length ? (
          <Panel title="Decided requests">
            <ul className="divide-y divide-border">
              {decided.map((r) => {
                const { role } = decodeJustification(r.justification);
                const { driver, notes } = decodeDecision(r.decision_notes);
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{fullName(r.requester)}</p>
                      <p className="text-xs text-muted-foreground">
                        {role ? MEMBER_ROLE_LABELS[role] : pretty(r.requested_role)}
                        {driver ? ` · linked to ${driver.name}` : ""}
                        {r.decided_at
                          ? ` · ${new Date(r.decided_at).toLocaleDateString("en-GB")}`
                          : ""}
                        {notes ? ` · ${notes}` : ""}
                      </p>
                    </div>
                    <StatusBadge value={JOIN_STATUS_LABELS[r.status]} />
                  </li>
                );
              })}
            </ul>
          </Panel>
        ) : null}
      </div>
      {deciding ? <DecisionDialog {...deciding} onClose={() => setDeciding(null)} /> : null}
    </>
  );
}

function DecisionDialog({
  request,
  approve,
  onClose,
}: {
  request: JoinRequest;
  approve: boolean;
  onClose: () => void;
}) {
  const decide = useDecideJoinRequest();
  const { role } = decodeJustification(request.justification);
  const needsDriver = approve && role === "driver";
  const { record } = useWorkspace();
  // Only this company's register; an admin may own several companies.
  const drivers = useOpsList(
    "drivers",
    listDrivers,
    { is_active: "true", company: record?.companyId, page_size: 100 },
    { enabled: needsDriver && Boolean(record?.companyId) },
  );
  const [driverId, setDriverId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  return (
    <FormDialog
      open
      onClose={onClose}
      title={`${approve ? "Approve" : "Decline"} ${fullName(request.requester)}`}
      submitLabel={approve ? "Approve request" : "Decline request"}
      busy={decide.isPending}
      error={error}
      onSubmit={() => {
        const driver = drivers.data?.results.find((d) => d.id === driverId);
        if (needsDriver && !driver)
          return setError("Link this person to a registered driver before approving.");
        if (!approve && !notes.trim()) return setError("Say why the request is declined.");
        decide.mutate(
          {
            id: request.id,
            decision: approve ? "approved" : "rejected",
            notes: encodeDecision(driver ? { id: driver.id, name: driver.full_name } : null, notes),
          },
          {
            onSuccess: () => {
              toast.success(`${fullName(request.requester)}: ${approve ? "approved" : "declined"}`);
              onClose();
            },
            onError: (cause) => setError(errorMessage(cause, "Could not record the decision.")),
          },
        );
      }}
    >
      <p className="text-sm text-muted-foreground">
        {role ? MEMBER_ROLE_LABELS[role] : "Member"} · {request.requester.email}
      </p>
      {needsDriver ? (
        <Field label="Registered driver">
          <select
            className={fieldCls}
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
          >
            <option value="">
              {drivers.isLoading ? "Loading drivers…" : "Select a driver on your register"}
            </option>
            {(drivers.data?.results ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name} · licence {d.licence_number}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      {needsDriver && drivers.data && !drivers.data.results.length ? (
        <p className="text-sm text-destructive">
          Your register has no active drivers. Add the driver under Drivers first.
        </p>
      ) : null}
      <Field label={approve ? "Notes (optional)" : "Reason"}>
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </FormDialog>
  );
}
