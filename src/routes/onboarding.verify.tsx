import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { pendingInvitation } from "@/lib/onboarding/invite";
import { useEffect, useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, ProgressHeader } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AuthenticatorSetup } from "@/components/security/TwoStepSettings";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { joinsWithCode } from "@/lib/onboarding/data";
import { useOnboarding } from "@/lib/onboarding/store";

export const Route = createFileRoute("/onboarding/verify")({
  // The sign-in page sends people here when their account exists but has never
  // been verified, so the address can arrive in the URL rather than the store.
  validateSearch: (search: Record<string, unknown>): { email?: string } => {
    const email = search["email"];
    return typeof email === "string" && email.trim() ? { email: email.trim() } : {};
  },
  component: VerifyPage,
});

const RESEND_COOLDOWN_SECONDS = 45;

function ChannelShell({
  icon,
  title,
  target,
  verified,
  dimmed,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  target: string;
  verified: boolean;
  dimmed?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={
        dimmed
          ? "rounded-[18px] border border-border bg-surface/40 p-5 opacity-60"
          : "rounded-[18px] border border-border bg-surface p-5"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-[12px] bg-brand-soft text-brand">
            {icon}
          </span>
          <div>
            <p className="font-display text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{target || "Not provided"}</p>
          </div>
        </div>
        {dimmed ? (
          <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            Unavailable
          </span>
        ) : verified ? (
          <span className="rounded-full border border-success/50 bg-success/30 px-2.5 py-1 text-xs font-medium">
            Verified
          </span>
        ) : null}
      </div>
      {!verified && children}
    </div>
  );
}

function EmailChannel({
  email,
  verified,
  onVerified,
}: {
  email: string;
  verified: boolean;
  onVerified: () => void;
}) {
  const { confirmEmail, resendCode } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_COOLDOWN_SECONDS);
  // A code can fail because the address was already verified, in another tab,
  // or on an earlier visit. The API cannot say which without letting anyone
  // enumerate accounts, so after a failure we offer the way out.
  const [offerSignIn, setOfferSignIn] = useState(false);

  useEffect(() => {
    if (verified || seconds === 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, verified]);

  const check = async (value: string) => {
    if (checking) return;
    setChecking(true);
    try {
      // A correct code also returns a token pair, so this signs the account in.
      await confirmEmail({ email, code: value });
      setError(null);
      setOfferSignIn(false);
      onVerified();
      toast.success("Email address confirmed.");
    } catch (cause) {
      setCode("");
      setError(
        cause instanceof ApiError
          ? cause.message
          : "That code could not be checked. Please try again.",
      );
      if (cause instanceof ApiError && cause.code === "invalid_verification_code") {
        setOfferSignIn(true);
      }
    } finally {
      setChecking(false);
    }
  };

  const onChange = (value: string) => {
    setCode(value);
    if (error) setError(null);
    if (value.length === 6) void check(value);
  };

  const resend = async () => {
    if (resending || seconds > 0) return;
    setResending(true);
    try {
      const { message } = await resendCode(email);
      toast.info(message);
      setSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (cause) {
      // The API throttles this to five requests per 10 minutes and says when
      // the next one is allowed.
      toast.error(cause instanceof ApiError ? cause.message : "Could not send another code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <ChannelShell
      icon={<Mail className="size-4" />}
      title="Email address"
      target={email}
      verified={verified}
    >
      <div className="mt-4 space-y-3">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={onChange}
          disabled={checking}
          containerClassName="justify-start"
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        {checking && <p className="text-xs text-muted-foreground">Checking your code…</p>}
        {error && <p className="text-xs text-danger">{error}</p>}
        {offerSignIn && (
          <p className="text-xs text-muted-foreground">
            Already verified this address?{" "}
            <Link to="/signin" className="font-medium text-brand underline">
              Sign in instead
            </Link>
            .
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>The code expires 10 minutes after it is sent.</span>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            disabled={seconds > 0 || resending}
            onClick={() => void resend()}
          >
            {seconds > 0 ? `Resend code in ${seconds}s` : resending ? "Sending…" : "Resend code"}
          </Button>
        </div>
      </div>
    </ChannelShell>
  );
}

/**
 * Two-step sign-in with an authenticator app, in place of the old SMS step.
 * Setting up needs a signed-in account, and the token pair only arrives when
 * the email code is consumed, so this stays locked until then.
 */
function AuthenticatorChannel({
  email,
  enabled,
  emailVerified,
  later,
  onLater,
  onEnabled,
}: {
  email: string;
  enabled: boolean;
  emailVerified: boolean;
  later: boolean;
  onLater: () => void;
  onEnabled: () => void;
}) {
  return (
    <ChannelShell
      icon={<KeyRound className="size-4" />}
      title="Authenticator app"
      target="Google Authenticator, Microsoft Authenticator, Authy or similar"
      verified={enabled}
      dimmed={!emailVerified}
    >
      <div className="mt-4 space-y-3">
        {!emailVerified ? (
          <p className="text-xs text-muted-foreground">
            Confirm your email address first. Setting up the app needs a signed-in account.
          </p>
        ) : enabled ? (
          <p className="text-xs text-muted-foreground">
            Two-step sign-in is on. Sign-in will ask for a code from the app after your password.
          </p>
        ) : later ? (
          <p className="text-xs text-muted-foreground">
            You can turn it on any time from the Security page of your dashboard.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              After your password, sign-in will ask for a 6-digit code from the app on your phone,
              so a stolen password alone cannot get into your account.
            </p>
            <AuthenticatorSetup email={email} onDone={onEnabled} />
            <button
              type="button"
              className="block text-xs text-muted-foreground underline-offset-4 hover:underline"
              onClick={onLater}
            >
              Set it up later from the Security page
            </button>
          </>
        )}
      </div>
    </ChannelShell>
  );
}

function VerifyPage() {
  const { account, updateAccount, verifyChannel, role, orgPath, sector } = useOnboarding();
  const joining = orgPath === "existing" && joinsWithCode(sector, role);
  const { user, refetchUser } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const email = (search.email ?? account.email).trim();

  // The API is the authority on what has been verified; the onboarding store is
  // a local draft and can disagree with it after a reload, a second tab, or a
  // visit from a different device.
  const emailVerified = user ? Boolean(user.email_verified_at) : account.emailVerified;
  const mfaEnabled = Boolean(user?.mfa_enabled);
  // Two-step sign-in can be set up later from the Security page.
  const [setUpLater, setSetUpLater] = useState(false);
  const readyToContinue = emailVerified && (mfaEnabled || setUpLater);

  // Keep the local draft in step, so the rest of the flow reads one answer.
  useEffect(() => {
    if (emailVerified && !account.emailVerified) verifyChannel("email");
  }, [emailVerified, account.emailVerified, verifyChannel]);

  // Arriving from sign-in carries the address in the URL; adopt it so the rest
  // of the flow reads the same value.
  useEffect(() => {
    if (search.email && search.email !== account.email) updateAccount({ email: search.email });
  }, [search.email, account.email, updateAccount]);

  const next = () => {
    const invitation = pendingInvitation();
    if (invitation) {
      navigate({ to: "/onboarding/invite", search: { token: invitation } });
      return;
    }
    // A Q&C officer finds their organisation as the first step of their own
    // application, rather than on the separate join page.
    const appliesAsIndividual =
      role === "independent" || (sector === "quality" && role === "compliance-officer");
    if (appliesAsIndividual) navigate({ to: "/onboarding/application" });
    else if (orgPath === "existing") navigate({ to: "/onboarding/join" });
    else navigate({ to: "/onboarding/application" });
  };

  if (!email) {
    return (
      <AuthShell
        title="Verify your email"
        description="We don't have an address to verify. Go back and create your account first."
      >
        <Button size="lg" onClick={() => navigate({ to: "/onboarding/account" })}>
          Back to account details
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Verify your email address"
      description="We sent a six-digit code to your email. Confirming it activates your account and signs you in. Then protect your account with an authenticator app."
    >
      <ProgressHeader
        step={joining ? 6 : 5}
        total={joining ? 7 : 6}
        onBack={() => navigate({ to: "/onboarding/account" })}
      />

      <div className="space-y-4">
        <EmailChannel
          email={email}
          verified={emailVerified}
          onVerified={() => {
            verifyChannel("email");
            // The token pair has just arrived; pick up the verified account.
            void refetchUser();
          }}
        />
        <AuthenticatorChannel
          email={email}
          enabled={mfaEnabled}
          emailVerified={emailVerified}
          later={setUpLater}
          onLater={() => setSetUpLater(true)}
          onEnabled={() => void refetchUser()}
        />
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button size="lg" disabled={!readyToContinue} onClick={next}>
          {!emailVerified
            ? "Verify your email to continue"
            : readyToContinue
              ? "Continue"
              : "Set up your authenticator app to continue"}
        </Button>
        <Button size="lg" variant="ghost" onClick={() => navigate({ to: "/onboarding/account" })}>
          Change details
        </Button>
      </div>
    </AuthShell>
  );
}
