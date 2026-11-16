import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Send, UserPlus, X } from "lucide-react";

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
  useCreateGovernanceInvitation,
  useDecideGovernanceMember,
  useGovernanceAudit,
  useGovernanceInvitations,
  useGovernanceMe,
  useGovernanceMembers,
  useResendGovernanceInvitation,
  useRevokeGovernanceInvitation,
  type GovernanceInvitation,
  type GovernanceMember,
  type GovernanceRole,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
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

export const Route = createFileRoute("/governance/admin")({ component: Admin });

const ROLE_SCOPE: Record<GovernanceRole, string> = {
  super_admin: "Users, invitations and access configuration. No authoring or approval.",
  executive: "Oversight and policy approval; reads the audit trail.",
  analyst: "Research, policy drafting and impact analysis.",
  risk_officer: "Risks, controls and policy development; escalates risks.",
  reviewer: "Independent review of policies and verification of findings.",
  viewer: "Read only visibility of internal records.",
};

const inviteLink = (token: string) =>
  `${window.location.origin}/governance/invitation?token=${encodeURIComponent(token)}`;

function Admin() {
  const me = useGovernanceMe();
  const allowed = Boolean(me.data?.capabilities.manage_access);
  const canAudit = Boolean(me.data?.capabilities.view_audit);
  const members = useGovernanceMembers(allowed);
  const invitations = useGovernanceInvitations(allowed);
  const audit = useGovernanceAudit(canAudit);
  const [inviting, setInviting] = useState(false);
  const [deciding, setDeciding] = useState<GovernanceMember | null>(null);

  if (me.data && !allowed) {
    return <LoadError error={new Error("Administration is open to Super Administrators only.")} />;
  }

  const pending = (members.data ?? []).filter((m) => m.status === "pending");
  const others = (members.data ?? []).filter((m) => m.status !== "pending");

  return (
    <>
      <PageHeader
        title="Administration"
        desc="Who has access to the governance workspace, in what role. Every change is written to the audit trail."
        actions={
          <Button onClick={() => setInviting(true)}>
            <UserPlus /> Invite user
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        {pending.length > 0 && (
          <Panel title={`Access requests (${pending.length})`} className="lg:col-span-3">
            <DataTable
              cols={["Person", "Organisation", "Requested role", "Scope", "Requested", ""]}
              rows={pending.map((m) => [
                <div>
                  <div className="font-medium">{m.user.name}</div>
                  <div className="text-xs text-muted-foreground">{m.user.email}</div>
                </div>,
                <div>
                  <div>{m.organisation}</div>
                  <div className="text-xs text-muted-foreground">{m.job_title}</div>
                </div>,
                m.role_label,
                <span className="text-xs">{m.scope.join(", ")}</span>,
                formatDate(m.created_at),
                <Button size="sm" onClick={() => setDeciding(m)}>
                  Review
                </Button>,
              ])}
            />
          </Panel>
        )}
        <Panel title="Users" className="lg:col-span-2">
          {members.isPending ? (
            <Loading />
          ) : members.error ? (
            <LoadError error={members.error} />
          ) : (
            <DataTable
              cols={["Name", "Role", "Organisation", "Status", ""]}
              empty="No members yet."
              rows={others.map((m) => [
                <div>
                  <div className="font-medium">{m.user.name}</div>
                  <div className="text-xs text-muted-foreground">{m.user.email}</div>
                </div>,
                m.role_label,
                m.organisation,
                <StatusBadge value={m.status} label={m.status_label} />,
                m.status === "declined" ? null : (
                  <Button size="sm" variant="outline" onClick={() => setDeciding(m)}>
                    Manage
                  </Button>
                ),
              ])}
            />
          )}
        </Panel>
        <Panel title="Roles & permissions">
          <ul className="space-y-3 text-sm">
            {(me.data?.roles ?? []).map((r) => (
              <li key={r.id}>
                <div className="font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground">{ROLE_SCOPE[r.id]}</div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Invitations" className="lg:col-span-3">
          {invitations.isPending ? (
            <Loading />
          ) : invitations.error ? (
            <LoadError error={invitations.error} />
          ) : (
            <InvitationTable rows={invitations.data} />
          )}
        </Panel>
        {canAudit && (
          <Panel title="Audit log" className="lg:col-span-3">
            {audit.isPending ? (
              <Loading />
            ) : audit.error ? (
              <LoadError error={audit.error} />
            ) : audit.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No governance activity yet.</p>
            ) : (
              <ul className="max-h-96 space-y-1.5 overflow-y-auto font-mono text-xs break-words text-muted-foreground">
                {audit.data.map((a) => (
                  <li key={a.id}>
                    {formatDateTime(a.created_at)} · {a.actor} · {humanise(a.event)}
                    {a.metadata["reference"] ? ` · ${a.metadata["reference"]}` : ""}
                    {a.metadata["email"] ? ` · ${a.metadata["email"]}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
      {inviting && <InviteDialog onClose={() => setInviting(false)} roles={me.data?.roles ?? []} />}
      {deciding && (
        <DecideDialog
          key={deciding.id}
          member={deciding}
          roles={me.data?.roles ?? []}
          onClose={() => setDeciding(null)}
        />
      )}
    </>
  );
}

function InvitationTable({ rows }: { rows: GovernanceInvitation[] }) {
  const resend = useResendGovernanceInvitation();
  const revoke = useRevokeGovernanceInvitation();
  const [link, setLink] = useState<{ email: string; url: string } | null>(null);
  return (
    <>
      <DataTable
        cols={["Recipient", "Role", "Organisation", "Status", "Sent", "Expires", ""]}
        empty="No invitations yet."
        rows={rows.map((i) => [
          <div>
            <div className="font-medium">{i.name}</div>
            <div className="text-xs text-muted-foreground">{i.email}</div>
          </div>,
          i.role_label,
          i.organisation,
          <StatusBadge value={i.status} label={i.status_label} />,
          `${i.sent_count}×, ${formatDate(i.last_sent_at)}`,
          formatDate(i.expires_at),
          i.status === "pending" ? (
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                title="Resend with a fresh link"
                aria-label={`Resend invitation to ${i.name}`}
                disabled={resend.isPending}
                onClick={() =>
                  resend.mutate(i.id, {
                    onSuccess: (r) => {
                      toast.success(`Invitation resent to ${r.email}`);
                      if (r.token) setLink({ email: r.email, url: inviteLink(r.token) });
                    },
                    onError: (e) => toast.error(errorMessage(e)),
                  })
                }
              >
                <Send />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                title="Revoke invitation"
                aria-label={`Revoke invitation for ${i.name}`}
                disabled={revoke.isPending}
                onClick={() =>
                  revoke.mutate(i.id, {
                    onSuccess: () => toast.success("Invitation revoked"),
                    onError: (e) => toast.error(errorMessage(e)),
                  })
                }
              >
                <X />
              </Button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              {i.status === "accepted" ? `Accepted ${formatDate(i.accepted_at)}` : ""}
            </span>
          ),
        ])}
      />
      {link && <LinkDialog email={link.email} url={link.url} onClose={() => setLink(null)} />}
    </>
  );
}

function LinkDialog({ email, url, onClose }: { email: string; url: string; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100%_-_2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invitation sent</DialogTitle>
          <DialogDescription>
            An email is on its way to {email}. This link is shown once; any earlier link no longer
            works.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            readOnly
            value={url}
            aria-label="Invitation link"
            onFocus={(e) => e.currentTarget.select()}
          />
          <Button
            variant="outline"
            onClick={() =>
              navigator.clipboard.writeText(url).then(
                () => toast.success("Link copied"),
                () => toast.error("Copy failed. Select the link and copy it."),
              )
            }
          >
            <Copy /> Copy
          </Button>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InviteDialog({
  onClose,
  roles,
}: {
  onClose: () => void;
  roles: { id: GovernanceRole; label: string }[];
}) {
  const create = useCreateGovernanceInvitation();
  const [role, setRole] = useState<GovernanceRole>("analyst");
  const [sent, setSent] = useState<{ email: string; url: string } | null>(null);
  if (sent) return <LinkDialog email={sent.email} url={sent.url} onClose={onClose} />;
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>
            The invitee signs in or creates a Beldium account with this exact email address, then
            accepts. The link expires in 14 days.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            create.mutate(
              {
                name: String(data.get("name") ?? "").trim(),
                email: String(data.get("email") ?? "").trim(),
                organisation: String(data.get("org") ?? "").trim(),
                role,
              },
              {
                onSuccess: (i) => setSent({ email: i.email, url: inviteLink(i.token ?? "") }),
                onError: (err) => toast.error(errorMessage(err)),
              },
            );
          }}
        >
          <Field label="Full name" htmlFor="invite-name">
            <Input id="invite-name" name="name" required pattern=".*\S.*" />
          </Field>
          <Field label="Work email" htmlFor="invite-email">
            <Input id="invite-email" name="email" type="email" required />
          </Field>
          <Field label="Organisation" htmlFor="invite-org">
            <Input
              id="invite-org"
              name="org"
              required
              defaultValue="Beldium Internal"
              pattern=".*\S.*"
            />
          </Field>
          <Field label="Role" htmlFor="invite-role" hint={ROLE_SCOPE[role]}>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as GovernanceRole)}
              className={selectClass}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              <Send /> Send invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DecideDialog({
  member,
  roles,
  onClose,
}: {
  member: GovernanceMember;
  roles: { id: GovernanceRole; label: string }[];
  onClose: () => void;
}) {
  const decide = useDecideGovernanceMember();
  const { user } = useAuth();
  const [role, setRole] = useState<GovernanceRole>(member.role);
  const [notes, setNotes] = useState("");
  const self = user?.id === member.user.id;
  const run = (status: GovernanceMember["status"], withRole = false) =>
    decide.mutate(
      { id: member.id, status, notes, ...(withRole ? { role } : {}) },
      {
        onSuccess: (m) => {
          toast.success(`${m.user.name}: ${m.status_label}, ${m.role_label}`);
          onClose();
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    );
  const profile = Object.entries(member.profile).filter(
    ([k, v]) => k !== "declarations" && typeof v === "string" && v,
  );

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{member.user.name}</DialogTitle>
          <DialogDescription>
            {member.user.email} · {member.status_label}
          </DialogDescription>
        </DialogHeader>
        {profile.length > 0 && (
          <dl className="grid grid-cols-2 gap-2 rounded-md border p-3 text-xs">
            {profile.map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted-foreground">{humanise(k)}</dt>
                <dd>{String(v)}</dd>
              </div>
            ))}
          </dl>
        )}
        {self ? (
          <p className="text-sm text-muted-foreground">
            You cannot change your own access. Ask another Super Administrator.
          </p>
        ) : (
          <div className="space-y-3">
            <Field label="Role" htmlFor="decide-role">
              <select
                id="decide-role"
                className={selectClass}
                value={role}
                onChange={(e) => setRole(e.target.value as GovernanceRole)}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Notes"
              htmlFor="decide-notes"
              hint={member.status === "pending" ? "Required when declining." : undefined}
            >
              <Textarea
                id="decide-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
            <div className="flex flex-wrap justify-end gap-2">
              {member.status === "pending" && (
                <>
                  <Button
                    variant="destructive"
                    disabled={decide.isPending || !notes.trim()}
                    onClick={() => run("declined")}
                  >
                    Decline
                  </Button>
                  <Button disabled={decide.isPending} onClick={() => run("active", true)}>
                    Approve as {roles.find((r) => r.id === role)?.label}
                  </Button>
                </>
              )}
              {member.status === "active" && (
                <>
                  <Button
                    variant="destructive"
                    disabled={decide.isPending}
                    onClick={() => run("suspended")}
                  >
                    Suspend
                  </Button>
                  <Button
                    disabled={decide.isPending || role === member.role}
                    onClick={() => run("active", true)}
                  >
                    Change role
                  </Button>
                </>
              )}
              {member.status === "suspended" && (
                <Button disabled={decide.isPending} onClick={() => run("active", true)}>
                  Reactivate
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
