import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, KeyRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AuthLayout } from "@/components/auth-layout";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/errors";
import { lookupJoinCode, type JoinCodeLookup } from "@/lib/api/organisations";
import { useCancelJoinRequest, useCreateJoinRequest, useMyJoinRequests } from "@/lib/api/queries";
import {
  JOIN_REQUEST_STATUS_LABELS,
  MEMBERSHIP_ROLE_LABELS,
  ORGANISATION_TYPE_LABELS,
  type MembershipRole,
} from "@/lib/api/types";
import {
  cleanJoinCode,
  formatJoinCode,
  readPendingJoinCode,
  writePendingJoinCode,
} from "@/lib/join-code";

const title = "Join your organisation - Beldium Miner Hub";
const description =
  "Ask to join a mining organisation already on Beldium with the join code its administrator shared.";

export const Route = createFileRoute("/join")({
  // The link an administrator shares is /join?code=XXXXXXXX.
  validateSearch: (search: Record<string, unknown>): { code?: string } => {
    const code = search["code"];
    return typeof code === "string" && code.trim() ? { code: code.trim() } : {};
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: JoinPage,
});

// The API refuses owner and administrator on a join request
// (`validate_requested_role`), so neither is offered.
const REQUESTABLE_ROLES: MembershipRole[] = [
  "member",
  "mining_compliance_officer",
  "mining_engineer",
  "geologist",
  "environmental_specialist",
  "hse_specialist",
  "legal_regulatory_specialist",
  "analyst",
  "read_only",
];

function JoinPage() {
  const { status, user } = useAuth();
  const navigate = useNavigate();
  const { code: linkCode } = Route.useSearch();

  const [code, setCode] = useState(() => formatJoinCode(linkCode ?? ""));
  const [found, setFound] = useState<JoinCodeLookup | null>(null);
  const [checking, setChecking] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [role, setRole] = useState<MembershipRole>("member");
  const [justification, setJustification] = useState("");
  const [sendError, setSendError] = useState("");
  const [sentTo, setSentTo] = useState("");

  const signedIn = status === "authenticated";
  const emailVerified = Boolean(user?.email_verified_at);
  const myRequests = useMyJoinRequests({ enabled: signedIn });
  const createRequest = useCreateJoinRequest();
  const cancelRequest = useCancelJoinRequest();

  // Remember a code that arrived by link; otherwise fall back to one
  // remembered from before signup.
  useEffect(() => {
    if (linkCode) writePendingJoinCode(linkCode);
    else if (!code) setCode(formatJoinCode(readPendingJoinCode()));
    // Only on arrival; typing must not be overwritten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkCode]);

  async function check(value: string) {
    const clean = cleanJoinCode(value);
    if (clean.length < 8) {
      setCodeError("Enter the full 8 character code.");
      return;
    }
    setChecking(true);
    setCodeError("");
    setFound(null);
    try {
      setFound(await lookupJoinCode(clean));
    } catch (cause) {
      setCodeError(cause instanceof ApiError ? cause.message : "That code could not be checked.");
    } finally {
      setChecking(false);
    }
  }

  // A code that came with the link (or was remembered) is checked straight away.
  const autoChecked = useRef(false);
  useEffect(() => {
    if (status === "loading" || autoChecked.current || cleanJoinCode(code).length < 8) return;
    autoChecked.current = true;
    void check(code);
  }, [status, code]);

  async function send() {
    if (!found) return;
    setSendError("");
    if (justification.trim().length < 10) {
      setSendError(
        "Add a short note for the administrator: your position and why you need access.",
      );
      return;
    }
    try {
      await createRequest.mutateAsync({
        join_code: cleanJoinCode(code),
        requested_role: role,
        justification: justification.trim(),
      });
      writePendingJoinCode(null);
      setSentTo(found.organisation_name);
      setFound({ ...found, pending_request: true });
      setJustification("");
    } catch (cause) {
      setSendError(cause instanceof ApiError ? cause.message : "Could not send the request.");
    }
  }

  const codeForm = (
    <>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          void check(code);
        }}
      >
        <Label htmlFor="joincode">Organisation join code</Label>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="joincode"
              className="pl-9 font-mono tracking-[0.2em] uppercase"
              value={code}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                setCode(formatJoinCode(e.target.value));
                setFound(null);
                setCodeError("");
                setSentTo("");
              }}
              placeholder="ABCD-2345"
            />
          </div>
          <Button type="submit" variant="outline" disabled={checking}>
            {checking ? "Checking…" : "Check code"}
          </Button>
        </div>
        {codeError ? <p className="text-sm text-destructive">{codeError}</p> : null}
        <p className="text-xs text-muted-foreground">
          No code? Ask an owner or administrator of your organisation to share it from the Team page
          of their Miner Hub.
        </p>
      </form>

      {found ? (
        <div className="mt-5 flex items-start gap-3 rounded-md border border-success/30 bg-success/10 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="text-sm font-semibold text-foreground">{found.organisation_name}</p>
            <p className="text-xs text-muted-foreground">
              {ORGANISATION_TYPE_LABELS[found.organisation_type] ?? found.organisation_type}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );

  if (status === "loading") {
    return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  }

  // Signed out: check the code first, so the person knows which organisation
  // they are asking to join, then create an account or sign in. The request
  // itself is sent from this page once they are signed in and verified.
  if (!signedIn) {
    const keepCodeAndGo = (to: "/signup" | "/auth") => {
      writePendingJoinCode(cleanJoinCode(code));
      if (to === "/signup") navigate({ to: "/signup", search: { role: "org_staff" } });
      else navigate({ to: "/auth" });
    };
    return (
      <AuthLayout
        title="Join an existing organisation"
        subtitle="Enter the join code your organisation shared, or open the join link they sent. After you create your account, an owner or administrator accepts or declines your request."
      >
        {codeForm}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button disabled={!found} onClick={() => keepCodeAndGo("/signup")}>
            Create an account
          </Button>
          <Button variant="ghost" disabled={!found} onClick={() => keepCodeAndGo("/auth")}>
            I already have an account
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (!emailVerified) {
    return (
      <AuthLayout
        title="Verify your email first"
        subtitle="Confirm your email address, then come back here to send your request to join."
      >
        <Button asChild className="w-full">
          <Link to="/verify" search={{ email: user?.email, role: "org_staff" }}>
            Verify my email
          </Link>
        </Button>
      </AuthLayout>
    );
  }

  const requests = myRequests.data?.results ?? [];

  return (
    <AuthLayout
      wide
      title="Join an existing organisation"
      subtitle="Enter the join code your organisation shared. An owner or administrator then accepts or declines your request, and we email you either way."
      footer={
        <Link to="/portal" className="font-medium text-primary underline-offset-4 hover:underline">
          Go to my workspace
        </Link>
      }
    >
      {codeForm}

      {found?.already_member ? (
        <p className="mt-4 text-sm text-muted-foreground">
          You are already a member of {found.organisation_name}.{" "}
          <Link to="/portal" className="font-medium text-primary underline">
            Go to your workspace
          </Link>
        </p>
      ) : null}

      {found?.pending_request && !found.already_member ? (
        <p className="mt-4 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          {sentTo
            ? `Request sent to ${sentTo.replace(/\.$/, "")}. `
            : `Your request to join ${found.organisation_name} is waiting for an administrator. `}
          We will email you as soon as they accept or decline it.
        </p>
      ) : null}

      {found && !found.already_member && !found.pending_request ? (
        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="jrole">Role you are asking for</Label>
            <select
              id="jrole"
              value={role}
              onChange={(e) => setRole(e.target.value as MembershipRole)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {REQUESTABLE_ROLES.map((option) => (
                <option key={option} value={option}>
                  {MEMBERSHIP_ROLE_LABELS[option]}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              The administrator can change your role when they accept you.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="just">Note for the administrator</Label>
            <Textarea
              id="just"
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Your position and why you need access."
            />
          </div>
          {sendError ? <p className="text-sm text-destructive">{sendError}</p> : null}
          <Button onClick={() => void send()} disabled={createRequest.isPending}>
            {createRequest.isPending ? "Sending…" : "Send request to join"}
          </Button>
        </div>
      ) : null}

      {requests.length > 0 ? (
        <div className="mt-8 rounded-md border border-border bg-muted/40 p-4">
          <p className="text-sm font-semibold text-foreground">Your requests</p>
          <ul className="mt-3 space-y-2">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-card px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    {request.organisation_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {MEMBERSHIP_ROLE_LABELS[request.requested_role]} · sent{" "}
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                  {request.decision_notes ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Note: {request.decision_notes}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip
                    tone={
                      request.status === "approved"
                        ? "success"
                        : request.status === "pending"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {JOIN_REQUEST_STATUS_LABELS[request.status]}
                  </StatusChip>
                  {request.status === "pending" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={cancelRequest.isPending}
                      onClick={() => {
                        cancelRequest.mutate(request.id, {
                          onSuccess: () => {
                            if (found?.organisation === request.organisation) {
                              setFound({ ...found, pending_request: false });
                              setSentTo("");
                            }
                          },
                        });
                      }}
                    >
                      Withdraw
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </AuthLayout>
  );
}
