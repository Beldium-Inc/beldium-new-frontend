// The Team page every sector dashboard mounts: who belongs to the company,
// who is asking to join, who has been invited, and the join code.
//
// Rights follow section 2 of the backend plan: an owner or administrator
// manages everything here; staff see names and roles only. The server checks
// every action again (organisations/views.py), so this only decides what to
// show. One active company per sector (decision D7), so the first
// organisation the caller belongs to is the one shown.

import { useMemo, useState, type ReactNode } from "react";
import { Copy, Lock, MailPlus, RefreshCw, ShieldCheck, UserMinus, Users } from "lucide-react";
import { toast } from "sonner";
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
  JOIN_REQUEST_STATUS_LABELS,
  MEMBERSHIP_ROLE_LABELS,
  ORGANISATION_ADMIN_ROLES,
  fullName,
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
  type MembershipRole,
  type Organisation,
  type OrganisationMembership,
  type UUID,
} from "@/lib/api";
import { cn } from "@/lib/utils";

/** Roles an administrator can hand out. Ownership moves through its own workflow. */
const ASSIGNABLE_ROLES = (Object.keys(MEMBERSHIP_ROLE_LABELS) as MembershipRole[]).filter(
  (r) => r !== "owner",
);

const INVITE_DAYS = 14;

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : "Please try again.";
}

function fmt(value: string | null | undefined): string {
  if (!value) return "—";
  const t = Date.parse(value);
  return Number.isNaN(t)
    ? value
    : new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** The company the signed-in user belongs to, and whether they administer it. */
export function useMyCompany(): {
  organisation: Organisation | null;
  isAdmin: boolean;
  loading: boolean;
} {
  const organisations = useMyOrganisations();
  const organisation = (organisations.data?.results ?? []).find((o) => o.my_role) ?? null;
  return {
    organisation,
    isAdmin: ORGANISATION_ADMIN_ROLES.includes(organisation?.my_role ?? "other"),
    loading: organisations.isPending,
  };
}

/**
 * Shown wherever a staff member reaches something only an administrator may
 * do: "Only your company admin can do this", naming the admins.
 */
export function AdminOnlyNotice({ action = "do this" }: { action?: string }) {
  const { organisation } = useMyCompany();
  const members = useOrganisationMembers(organisation?.id ?? null);
  const admins = (members.data ?? [])
    .filter((m) => m.is_active && ORGANISATION_ADMIN_ROLES.includes(m.role))
    .map((m) => fullName(m.user));
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm">
      <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span>
        Only your company admin can {action}.{admins.length > 0 && <> Ask {admins.join(" or ")}.</>}
      </span>
    </div>
  );
}

function Card({
  title,
  description,
  actions,
  children,
  bodyClass,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  bodyClass?: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div>
          <h2 className="font-display text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      <div className={cn("p-5", bodyClass)}>{children}</div>
    </section>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "muted" | "brand";
  children: ReactNode;
}) {
  const cls = {
    ok: "border-success/60 bg-success/30 text-success-foreground",
    warn: "border-warning/60 bg-warning/25 text-warning-foreground",
    muted: "border-border bg-muted text-muted-foreground",
    brand: "border-brand/30 bg-brand-soft text-brand",
  }[tone];
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium", cls)}>
      {children}
    </span>
  );
}

export function TeamWorkspace() {
  const { organisation, isAdmin, loading } = useMyCompany();

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading your team…</p>;
  }
  if (!organisation) {
    return (
      <Card title="Team">
        <p className="text-sm text-muted-foreground">
          Your account is not linked to a company yet. Register your company or join one with the
          code your administrator shared, from the onboarding screen.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Company
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {organisation.name}
            {organisation.beldium_id ? ` · ${organisation.beldium_id}` : ""} · you are{" "}
            {MEMBERSHIP_ROLE_LABELS[organisation.my_role ?? "other"]}
          </p>
        </div>
      </div>
      {isAdmin ? (
        <AdminTeam organisation={organisation} />
      ) : (
        <StaffTeam organisation={organisation} />
      )}
    </div>
  );
}

function StaffTeam({ organisation }: { organisation: Organisation }) {
  const members = useOrganisationMembers(organisation.id);
  const active = (members.data ?? []).filter((m) => m.is_active);
  return (
    <>
      <AdminOnlyNotice action="invite people, approve join requests or change roles" />
      <Card title={`Members (${active.length})`} bodyClass="p-0">
        <ul className="divide-y divide-border">
          {active.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <span className="text-sm font-medium">{fullName(m.user)}</span>
              <Badge tone={ORGANISATION_ADMIN_ROLES.includes(m.role) ? "brand" : "muted"}>
                {MEMBERSHIP_ROLE_LABELS[m.role]}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function AdminTeam({ organisation }: { organisation: Organisation }) {
  const joinRequests = useOrganisationJoinRequests(organisation.id);
  const pending = (joinRequests.data ?? []).filter((r) => r.status === "pending").length;
  return (
    <Tabs defaultValue={pending > 0 ? "requests" : "members"}>
      <TabsList className="flex-wrap">
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="requests">
          Join requests
          {pending > 0 && (
            <span className="ml-1.5 rounded-full bg-warning px-1.5 text-[11px] font-semibold text-warning-foreground">
              {pending}
            </span>
          )}
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

  /** The last administrator cannot be demoted, suspended or removed (BE-O7). */
  const isLastAdmin = (m: OrganisationMembership) =>
    m.is_active && ORGANISATION_ADMIN_ROLES.includes(m.role) && activeAdmins.length <= 1;

  return (
    <Card
      title={`Members (${rows.filter((m) => m.is_active).length} active)`}
      description="Change a role, suspend access for a while, or remove someone from the company."
      bodyClass="p-0"
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
                      <p className="font-medium">
                        {fullName(m.user)}
                        {isMe && (
                          <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.user.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      {locked ? (
                        <Badge tone="brand">{MEMBERSHIP_ROLE_LABELS[m.role]}</Badge>
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
                        <Badge tone="ok">Active</Badge>
                      ) : (
                        <Badge tone="warn">Suspended</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs">{fmt(m.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      {locked ? (
                        <span className="text-xs text-muted-foreground">
                          {isOwner ? "Company owner" : "Last administrator"}
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
                            <UserMinus className="size-4" />
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
      description="People who used your join code. They see nothing of the company until you approve them, and join as Member unless you change their role afterwards."
      bodyClass="p-0"
    >
      {requests.isPending ? (
        <p className="p-5 text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">No one has asked to join yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="space-y-2 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{fullName(r.requester)}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.requester.email} · asked {fmt(r.created_at)} · as{" "}
                    {MEMBERSHIP_ROLE_LABELS[r.requested_role]}
                  </p>
                </div>
                <Badge
                  tone={r.status === "pending" ? "warn" : r.status === "approved" ? "ok" : "muted"}
                >
                  {JOIN_REQUEST_STATUS_LABELS[r.status]}
                </Badge>
              </div>
              {r.justification && (
                <p className="text-sm text-muted-foreground">“{r.justification}”</p>
              )}
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
              ) : (
                r.decision_notes && (
                  <p className="text-xs text-muted-foreground">Note: {r.decision_notes}</p>
                )
              )}
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
              placeholder="name@company.com"
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
            <MailPlus className="size-4" /> Send invitation
          </Button>
        </div>
      </Card>
      <Card title="Sent invitations" bodyClass="p-0">
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
                    <p className="text-sm font-medium">{i.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {MEMBERSHIP_ROLE_LABELS[i.role]} · sent {fmt(i.created_at)} · expires{" "}
                      {fmt(i.expires_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={state === "Accepted" ? "ok" : state === "Waiting" ? "warn" : "muted"}
                    >
                      {state}
                    </Badge>
                    {state === "Waiting" && (
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
                    )}
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
      actions={<ShieldCheck className="size-4 text-muted-foreground" />}
    >
      {code.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !code.data ? (
        <p className="text-sm text-muted-foreground">The join code could not be loaded.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md border border-border bg-muted px-4 py-2 font-mono text-lg tracking-widest">
              {code.data.join_code}
            </span>
            <Button size="sm" variant="outline" onClick={() => copy(code.data!.join_code, "Code")}>
              <Copy className="size-4" /> Copy code
            </Button>
            <Button size="sm" variant="outline" onClick={() => copy(code.data!.join_url, "Link")}>
              <Copy className="size-4" /> Copy link
            </Button>
          </div>
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
              <RefreshCw className="size-4" /> Issue a new code
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

export const TEAM_ICON = Users;
