import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, StateChip } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiError,
  MEMBERSHIP_ROLE_LABELS,
  ORGANISATION_TYPE_LABELS,
  lookupJoinCode,
  useCreateJoinRequest,
  useMyJoinRequests,
  type JoinCodeLookup,
  type MembershipRole,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useOnboarding } from "@/lib/onboarding/store";

export const Route = createFileRoute("/onboarding/join")({
  // The link an administrator shares is /onboarding/join?code=XXXXXXXX.
  validateSearch: (search: Record<string, unknown>): { code?: string } => {
    const code = search["code"];
    return typeof code === "string" && code.trim() ? { code: code.trim() } : {};
  },
  component: JoinPage,
});

// The API rejects both owner and administrator on a join request
// (`validate_requested_role`), so neither is offered here.
const REQUESTABLE_ROLES: MembershipRole[] = [
  "reviewer",
  "inspector",
  "member",
  "compliance_manager",
  "analyst",
  "read_only",
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting for the administrator",
  approved: "Accepted",
  rejected: "Declined",
  cancelled: "Cancelled",
};

// Someone who opens a join link before they have an account goes through
// signup first. The code is kept here so it is still filled in when they
// come back to this page.
const PENDING_CODE_KEY = "beldium.pendingJoinCode";

function readPendingCode(): string {
  try {
    return window.localStorage.getItem(PENDING_CODE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writePendingCode(code: string | null) {
  try {
    if (code) window.localStorage.setItem(PENDING_CODE_KEY, code);
    else window.localStorage.removeItem(PENDING_CODE_KEY);
  } catch {
    // Storage can be blocked; the person can still type the code in.
  }
}

/** Show the code the way it is printed: two groups of four. */
function formatCode(value: string): string {
  const clean = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

function JoinPage() {
  const { verification } = useOnboarding();
  const { status: authStatus } = useAuth();
  const navigate = useNavigate();
  const { code: linkCode } = Route.useSearch();

  const [code, setCode] = useState(() => formatCode(linkCode ?? ""));
  const [found, setFound] = useState<JoinCodeLookup | null>(null);
  const [checking, setChecking] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [role, setRole] = useState<MembershipRole>("member");
  const [justification, setJustification] = useState("");

  const signedIn = authStatus === "authenticated";
  const myRequests = useMyJoinRequests({ enabled: signedIn });
  const createRequest = useCreateJoinRequest();

  // Remember a code that arrived by link, and fall back to one remembered
  // from an earlier visit.
  useEffect(() => {
    if (linkCode) writePendingCode(linkCode);
    else if (!code) setCode(formatCode(readPendingCode()));
    // Only on arrival; typing must not be overwritten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkCode]);

  const check = async (value: string) => {
    const clean = value.replace(/[^A-Za-z0-9]/g, "");
    if (clean.length < 8) {
      setCodeError("Enter the full 8 character code.");
      return;
    }
    setChecking(true);
    setCodeError(null);
    setFound(null);
    try {
      setFound(await lookupJoinCode(clean));
    } catch (error) {
      setCodeError(error instanceof ApiError ? error.message : "That code could not be checked.");
    } finally {
      setChecking(false);
    }
  };

  // A code that came with the link is checked straight away.
  const autoChecked = useRef(false);
  useEffect(() => {
    if (!signedIn || autoChecked.current || !code) return;
    autoChecked.current = true;
    void check(code);
  }, [signedIn, code]);

  const send = async () => {
    if (!found) return;
    if (justification.trim().length < 10) {
      toast.error("Add a short note for the administrator.");
      return;
    }
    try {
      await createRequest.mutateAsync({
        join_code: code.replace(/[^A-Za-z0-9]/g, ""),
        requested_role: role,
        justification: justification.trim(),
      });
      writePendingCode(null);
      toast.success(
        `Request sent to ${found.organisation_name}. We will email you when they accept or decline.`,
      );
      setFound({ ...found, pending_request: true });
      setJustification("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not send the request.");
    }
  };

  if (!signedIn) {
    return (
      <AuthShell
        title="Join your organisation"
        description={
          linkCode
            ? "You opened a join link. Sign in, or create your account first, and the code will be waiting for you here."
            : "Sign in, or create your account first. You will then enter the join code your organisation shared with you."
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={() => navigate({ to: "/signin" })}>
            {authStatus === "loading" ? "Checking your session…" : "Sign in"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate({ to: "/onboarding/sector" })}
          >
            Create an account
          </Button>
          <Button size="lg" variant="ghost" onClick={() => navigate({ to: "/onboarding/verify" })}>
            Verify your email
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Step 5 of 5"
      title="Join an existing organisation"
      description="Enter the join code your organisation shared with you, or open the join link they sent. An owner or administrator of the organisation then accepts or declines your request, and we email you either way."
      width="lg"
    >
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          void check(code);
        }}
      >
        <Label htmlFor="joincode">Organisation join code</Label>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="joincode"
              className="pl-9 font-mono tracking-[0.2em] uppercase"
              value={code}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                setCode(formatCode(e.target.value));
                setFound(null);
                setCodeError(null);
              }}
              placeholder="ABCD-2345"
            />
          </div>
          <Button type="submit" variant="outline" disabled={checking}>
            {checking ? "Checking…" : "Check code"}
          </Button>
        </div>
        {codeError && <p className="text-sm text-danger">{codeError}</p>}
        <p className="text-xs text-muted-foreground">
          Do not have a code? Ask an owner or administrator of your organisation to share it from
          their access requests page.
        </p>
      </form>

      {found && (
        <div className="mt-5 rounded-[18px] border border-success/50 bg-success/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
            <div>
              <p className="font-display text-sm font-semibold">{found.organisation_name}</p>
              <p className="text-xs text-muted-foreground">
                {ORGANISATION_TYPE_LABELS[found.organisation_type]}
              </p>
            </div>
          </div>
        </div>
      )}

      {found?.already_member && (
        <p className="mt-4 text-sm text-muted-foreground">
          You are already a member of {found.organisation_name}.{" "}
          <button
            className="font-medium text-brand underline"
            onClick={() => navigate({ to: "/onboarding/dashboard" })}
          >
            Go to your workspace
          </button>
        </p>
      )}

      {found?.pending_request && !found.already_member && (
        <p className="mt-4 rounded-[14px] border border-warning/50 bg-warning/10 px-4 py-3 text-sm">
          Your request to join {found.organisation_name} is waiting for an administrator. We will
          email you as soon as they accept or decline it.
        </p>
      )}

      {found && !found.already_member && !found.pending_request && (
        <>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="jrole">Requested role in the organisation</Label>
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
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="just">Note for the administrator</Label>
              <Textarea
                id="just"
                rows={3}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Your position and why you need access."
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => void send()} disabled={createRequest.isPending}>
              {createRequest.isPending ? "Sending…" : "Send request to join"}
            </Button>
          </div>
        </>
      )}

      <div className="mt-6">
        <Button variant="ghost" onClick={() => navigate({ to: "/onboarding/dashboard" })}>
          Back to the onboarding workspace
        </Button>
      </div>

      {(myRequests.data?.results.length ?? 0) > 0 && (
        <div className="mt-8 rounded-[18px] border border-border bg-muted/40 p-5">
          <p className="font-display text-sm font-semibold">Your requests</p>
          <div className="mt-3 space-y-2">
            {myRequests.data?.results.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-surface px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{request.organisation_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {MEMBERSHIP_ROLE_LABELS[request.requested_role]} · sent{" "}
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                  {request.decision_notes && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Note: {request.decision_notes}
                    </p>
                  )}
                </div>
                <span className="text-xs font-medium">
                  {STATUS_LABELS[request.status] ?? request.status}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Current account status: <StateChip state={verification} />
          </p>
        </div>
      )}
    </AuthShell>
  );
}
