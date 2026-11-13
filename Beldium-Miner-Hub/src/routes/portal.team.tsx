// The Miner Hub's Team page, matching the compliance app's: who belongs to
// the organisation, who is asking to join, who has been invited, and the join
// code. An owner or administrator manages everything here; everyone else sees
// names and roles. The API checks every action again, so this only decides
// what to show.

import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Lock, MailPlus, RefreshCw, ShieldCheck, UserMinus } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/miner-shell";
import { StatusChip, type ChipTone } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useActivateMember,
  useCreateInvitation,
  useCurrentUser,
  useDecideJoinRequest,
  useJoinCode,
  useMyOrganisations,
  useOrganisationInvitations,
  useOrganisationJoinRequests,
  useOrganisationMembers,
  useRemoveMember,
  useRevokeInvitation,
  useRotateJoinCode,
  useSuspendMember,
  useUpdateMember,
} from "@/lib/api/queries";
import {
  JOIN_REQUEST_STATUS_LABELS,
  MEMBERSHIP_ROLE_LABELS,
  ORGANISATION_ADMIN_ROLES,
  fullName,
  type MembershipRole,
  type Organisation,
  type OrganisationMembership,
  type UUID,
} from "@/lib/api/types";
import { formatJoinCode, minerJoinLink } from "@/lib/join-code";

const title = "Team - Beldium Miner Hub";
const description = "Members, join requests, invitations and the join code for your organisation.";

export const Route = createFileRoute("/portal/team")({
  head: () => ({
    meta: [{ title }, { name: "description", content: description }],
  }),
  component: TeamPage,
});

/** Roles an administrator can hand out. Ownership moves through its own workflow. */
const ASSIGNABLE_ROLES = (Object.keys(MEMBERSHIP_ROLE_LABELS) as MembershipRole[]).filter(
  (r) => r !== "owner",
);

const INVITE_DAYS = 14;

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : "Please try again.";
}

function fmt(value: string | null | undefined): string {
  if (!value) return "-";
  const t = Date.parse(value);
  return Number.isNaN(t)
    ? value
    : new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** The organisation the signed-in user belongs to, and whether they administer it. */
function useMyOrganisation() {
  const organisations = useMyOrganisations();
  const rows = organisations.data?.results ?? [];
  const organisation = rows.find((o) => o.my_role) ?? rows[0] ?? null;
  return {
    organisation,
    isAdmin: ORGANISATION_ADMIN_ROLES.includes(organisation?.my_role ?? "other"),
    loading: organisations.isPending,
  };
}

function Card({
  title,
  description,
  actions,
  children,
  flush = false,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
}) {
  return (
    <section className="rounded-md border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-card-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions}
      </header>
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

function TeamPage() {
  const { organisation, isAdmin, loading } = useMyOrganisation();

  if (loading) return <p className="text-sm text-muted-foreground">Loading your team…</p>;

  if (!organisation) {
    return (
      <>
        <PageHeader title="Team" />
        <Card title="Not linked to an organisation">
          <p className="text-sm text-muted-foreground">
            Your account is not part of a mining organisation yet. Register yours, or ask to join
            one with the code its administrator shared.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/join">Join with a code</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/application">Register an organisation</Link>
            </Button>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Team"
        description={`${organisation.name}${organisation.beldium_id ? ` · ${organisation.beldium_id}` : ""} · you are ${MEMBERSHIP_ROLE_LABELS[organisation.my_role ?? "other"]}`}
      />
      {isAdmin ? (
        <AdminTeam organisation={organisation} />
      ) : (
        <StaffTeam organisation={organisation} />
      )}
    </>
  );
}

function StaffTeam({ organisation }: { organisation: Organisation }) {
  const members = useOrganisationMembers(organisation.id);
  const rows = members.data ?? [];
  const active = rows.filter((m) => m.is_active);
  const admins = active
    .filter((m) => ORGANISATION_ADMIN_ROLES.includes(m.role))
    .map((m) => fullName(m.user));

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted/60 px-4 py-3 text-sm">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <span>
          Only your organisation's owner or administrator can invite people, approve join requests
          or change roles.{admins.length > 0 ? ` Ask ${admins.join(" or ")}.` : ""}
        </span>
      </div>
      <Card title={`Members (${active.length})`} flush>
        <ul className="divide-y divide-border">
          {active.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <span className="text-sm font-medium text-card-foreground">{fullName(m.user)}</span>
              <StatusChip tone={ORGANISATION_ADMIN_ROLES.includes(m.role) ? "info" : "neutral"}>
                {MEMBERSHIP_ROLE_LABELS[m.role]}
              </StatusChip>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function AdminTeam({ organisation }: { organisation: Organisation }) {
  const joinRequests = useOrganisationJoinRequests(organisation.id);
  const pending = (joinRequests.data ?? []).filter((r) => r.status === "pending").length;
  // Open on the requests tab when someone is waiting, decided once the list
  // first loads, so approving the last request does not move the admin away.
  const [tab, setTab] = useState<string | null>(null);
  useEffect(() => {
    if (tab === null && joinRequests.data) setTab(pending > 0 ? "requests" : "members");
  }, [tab, joinRequests.data, pending]);

  return (
    <Tabs value={tab ?? "members"} onValueChange={setTab}>
      <TabsList className="flex-wrap">
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="requests">
          Join requests
          {pending > 0 ? (
            <span className="ml-1.5 rounded-full bg-warning px-1.5 text-[11px] font-semibold text-warning-foreground">
              {pending}
            </span>
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="invites">Invitations</TabsTrigger>
        <TabsTrigger value="code">Join code</TabsTrigger>
      </TabsList>
      <TabsContent value="members" className="mt-4">
        <MembersPanel organisation={organisation} />
      </TabsContent>
      <TabsContent value="requests" className="mt-4">
        <JoinRequestsPanel organisationId={organisation.id} />
      </TabsContent>
      <TabsContent value="invites" className="mt-4">
        <InvitationsPanel organisationId={organisation.id} />
      </TabsContent>
      <TabsContent value="code" className="mt-4">
        <JoinCodePanel organisationId={organisation.id} />
      </TabsContent>
    </Tabs>
  );
}

function MembersPanel({ organisation }: { organisation: Organisation }) {
  const me = useCurrentUser();
  const members = useOrganisationMembers(organisation.id);
  const update = useUpdateMember(organisation.id);
  const suspend = useSuspendMember(organisation.id);
  const activate = useActivateMember(organisation.id);
  const remove = useRemoveMember(organisation.id);
  const rows = members.data ?? [];
  const activeAdmins = rows.filter((m) => m.is_active && ORGANISATION_ADMIN_ROLES.includes(m.role));

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      toast.success(done);
    } catch (err) {
      toast.error("That change was not saved", { description: errorText(err) });
    }
  };

  /** The last administrator cannot be demoted, suspended or removed. */
  const isLastAdmin = (m: OrganisationMembership) =>
    m.is_active && ORGANISATION_ADMIN_ROLES.includes(m.role) && activeAdmins.length <= 1;

  return (
    <Card
      title={`Members (${rows.filter((m) => m.is_active).length} active)`}
      description="Change a role, suspend access for a while, or remove someone from the organisation."
      flush
    >
      {members.isPending ? (
        <p className="p-5 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 font-medium">Person</th>
                <th className="px-5 py-2.5 font-medium">Role</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Since</th>
                <th className="px-5 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((m) => {
                const isOwner = m.role === "owner";
                const isMe = me.data?.id === m.user.id;
                const locked = isOwner || isLastAdmin(m);
                return (
                  <tr key={m.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-card-foreground">
                        {fullName(m.user)}
                        {isMe ? (
                          <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.user.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      {locked ? (
                        <StatusChip tone="info">{MEMBERSHIP_ROLE_LABELS[m.role]}</StatusChip>
                      ) : (
                        <Select
                          value={m.role}
                          onValueChange={(role) =>
                            run(
                              () =>
                                update.mutateAsync({
                                  membershipId: m.id,
                                  role: role as MembershipRole,
                                }),
                              `${fullName(m.user)} is now ${MEMBERSHIP_ROLE_LABELS[role as MembershipRole]}`,
                            )
                          }
                        >
                          <SelectTrigger
                            className="h-8 w-52"
                            aria-label={`Role of ${fullName(m.user)}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ASSIGNABLE_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {MEMBERSHIP_ROLE_LABELS[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {m.is_active ? (
                        <StatusChip tone="success">Active</StatusChip>
                      ) : (
                        <StatusChip tone="warning">Suspended</StatusChip>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs">{fmt(m.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      {locked ? (
                        <span className="text-xs text-muted-foreground">
                          {isOwner ? "Organisation owner" : "Last administrator"}
                        </span>
                      ) : (
                        <div className="flex justify-end gap-2">
                          {m.is_active ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                run(() => suspend.mutateAsync(m.id), "Access suspended")
                              }
                            >
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                run(() => activate.mutateAsync(m.id), "Access restored")
                              }
                            >
                              Restore
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Remove ${fullName(m.user)}`}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Remove ${fullName(m.user)} from ${organisation.name}? They lose access straight away.`,
                                )
                              )
                                void run(() => remove.mutateAsync(m.id), "Member removed");
                            }}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

const REQUEST_TONES: Record<string, ChipTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
};

function JoinRequestsPanel({ organisationId }: { organisationId: UUID }) {
  const requests = useOrganisationJoinRequests(organisationId);
  const decide = useDecideJoinRequest();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const rows = useMemo(
    () =>
      [...(requests.data ?? [])].sort(
        (a, b) =>
          Number(b.status === "pending") - Number(a.status === "pending") ||
          b.created_at.localeCompare(a.created_at),
      ),
    [requests.data],
  );

  const act = async (id: UUID, decision: "approved" | "rejected") => {
    const note = (notes[id] ?? "").trim();
    if (decision === "rejected" && !note) {
      toast.error("Add a short reason", {
        description: "The person is told why they were declined.",
      });
      return;
    }
    try {
      await decide.mutateAsync({ id, decision, ...(note ? { notes: note } : {}) });
      toast.success(decision === "approved" ? "Request approved" : "Request declined");
    } catch (err) {
      toast.error("The decision was not saved", { description: errorText(err) });
    }
  };

  return (
    <Card
      title="Join requests"
      description="People who used your join code. They see nothing of the organisation until you approve them."
      flush
    >
      {requests.isPending ? (
        <p className="p-5 text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">
          No one has asked to join yet. Share your join code from the Join code tab.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="space-y-2 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    {fullName(r.requester)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.requester.email} · asked {fmt(r.created_at)} · as{" "}
                    {MEMBERSHIP_ROLE_LABELS[r.requested_role]}
                  </p>
                </div>
                <StatusChip tone={REQUEST_TONES[r.status] ?? "neutral"}>
                  {JOIN_REQUEST_STATUS_LABELS[r.status]}
                </StatusChip>
              </div>
              {r.justification ? (
                <p className="text-sm text-muted-foreground">"{r.justification}"</p>
              ) : null}
              {r.status === "pending" ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Textarea
                    rows={1}
                    className="min-h-9 sm:flex-1"
                    placeholder="Note (required to decline)"
                    value={notes[r.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    aria-label={`Note for ${fullName(r.requester)}`}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={decide.isPending}
                      onClick={() => act(r.id, "rejected")}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      disabled={decide.isPending}
                      onClick={() => act(r.id, "approved")}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ) : r.decision_notes ? (
                <p className="text-xs text-muted-foreground">Note: {r.decision_notes}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function InvitationsPanel({ organisationId }: { organisationId: UUID }) {
  const invitations = useOrganisationInvitations(organisationId);
  const create = useCreateInvitation(organisationId);
  const revoke = useRevokeInvitation(organisationId);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MembershipRole>("member");

  const send = async () => {
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      toast.error("Enter a valid email address");
      return;
    }
    const expires = new Date(Date.now() + INVITE_DAYS * 86_400_000).toISOString();
    try {
      await create.mutateAsync({ email: address, role, expires_at: expires });
      toast.success(`Invitation sent to ${address}`);
      setEmail("");
    } catch (err) {
      toast.error("The invitation was not sent", { description: errorText(err) });
    }
  };

  const rows = [...(invitations.data ?? [])].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  const stateOf = (i: (typeof rows)[number]) =>
    i.accepted_at
      ? "Accepted"
      : i.revoked_at
        ? "Revoked"
        : Date.parse(i.expires_at) < Date.now()
          ? "Expired"
          : "Waiting";

  return (
    <div className="space-y-4">
      <Card
        title="Invite someone"
        description={`They get an email with a link that works for ${INVITE_DAYS} days. Accepting it adds them with the role you pick, with no second approval.`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5 sm:flex-1">
            <Label htmlFor="invite-email">Work email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@yourmine.com"
            />
          </div>
          <div className="space-y-1.5 sm:w-56">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as MembershipRole)}>
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {MEMBERSHIP_ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button disabled={create.isPending} onClick={send}>
            <MailPlus className="mr-1.5 h-4 w-4" /> Send invitation
          </Button>
        </div>
      </Card>
      <Card title="Sent invitations" flush>
        {invitations.isPending ? (
          <p className="p-5 text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No invitations sent yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((i) => {
              const state = stateOf(i);
              return (
                <li
                  key={i.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{i.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {MEMBERSHIP_ROLE_LABELS[i.role]} · sent {fmt(i.created_at)} · expires{" "}
                      {fmt(i.expires_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip
                      tone={
                        state === "Accepted"
                          ? "success"
                          : state === "Waiting"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {state}
                    </StatusChip>
                    {state === "Waiting" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={revoke.isPending}
                        onClick={() =>
                          revoke
                            .mutateAsync(i.id)
                            .then(() => toast.success("Invitation revoked"))
                            .catch((err) =>
                              toast.error("Could not revoke", { description: errorText(err) }),
                            )
                        }
                      >
                        Revoke
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function JoinCodePanel({ organisationId }: { organisationId: UUID }) {
  const code = useJoinCode(organisationId);
  const rotate = useRotateJoinCode(organisationId);
  const copy = (text: string, what: string) =>
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${what} copied`))
      .catch(() => toast.error("Copy failed; select and copy it instead"));

  return (
    <Card
      title="Join code"
      description="Share this with colleagues so they can ask to join. Knowing it only lets someone ask; you still approve each request."
      actions={<ShieldCheck className="h-4 w-4 text-muted-foreground" />}
    >
      {code.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !code.data ? (
        <p className="text-sm text-muted-foreground">The join code could not be loaded.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md border border-border bg-muted px-4 py-2 font-mono text-lg tracking-widest">
              {formatJoinCode(code.data.join_code)}
            </span>
            <Button size="sm" variant="outline" onClick={() => copy(code.data!.join_code, "Code")}>
              <Copy className="mr-1.5 h-4 w-4" /> Copy code
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy(minerJoinLink(code.data!.join_code), "Link")}
            >
              <Copy className="mr-1.5 h-4 w-4" /> Copy link
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The link opens the Miner Hub join page: {minerJoinLink(code.data.join_code)}
          </p>
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button
              size="sm"
              variant="outline"
              disabled={rotate.isPending}
              onClick={() => {
                if (
                  !window.confirm(
                    "Make a new code? The current code and every link built from it stop working.",
                  )
                )
                  return;
                rotate
                  .mutateAsync()
                  .then(() => toast.success("New join code issued"))
                  .catch((err) =>
                    toast.error("Could not issue a new code", { description: errorText(err) }),
                  );
              }}
            >
              <RefreshCw className="mr-1.5 h-4 w-4" /> Issue a new code
            </Button>
            <span className="text-xs text-muted-foreground">
              Do this if the code reached someone it should not have.
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
