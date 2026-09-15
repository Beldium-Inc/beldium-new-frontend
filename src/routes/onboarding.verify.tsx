import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, ProgressHeader } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ApiError } from "@/lib/api";
import { confirmPhoneVerification, requestPhoneVerification } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
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
  children,
}: {
  icon: React.ReactNode;
  title: string;
  target: string;
  verified: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-border bg-surface p-5">
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
        {verified && (
          <span className="rounded-full border border-success/50 bg-success/30 px-2.5 py-1 text-xs font-medium">
            Verified
          </span>
        )}
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
 * The phone channel is a real OTP, but both of its endpoints need a signed-in
 * account, and the token pair only arrives when the email code is consumed.
 * So this stays locked until the email is verified, rather than pretending the
 * two are independent.
 */
function PhoneChannel({
  phone,
  verified,
  emailVerified,
  onVerified,
}: {
  phone: string;
  verified: boolean;
  emailVerified: boolean;
  onVerified: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const { message } = await requestPhoneVerification(phone);
      setSent(true);
      toast.info(message);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not send a code to that number.");
    } finally {
      setSending(false);
    }
  };

  const check = async (value: string) => {
    setCode(value);
    if (value.length < 6 || checking) return;
    setChecking(true);
    try {
      await confirmPhoneVerification({ phone_number: phone, code: value });
      setError(null);
      onVerified();
      toast.success("Mobile number confirmed.");
    } catch (cause) {
      setCode("");
      setError(cause instanceof ApiError ? cause.message : "That code could not be checked.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <ChannelShell
      icon={<Smartphone className="size-4" />}
      title="Mobile number"
      target={phone}
      verified={verified}
    >
      <div className="mt-4 space-y-3">
        {!emailVerified ? (
          <p className="text-xs text-muted-foreground">
            Confirm your email address first. Verifying your number needs a signed-in account.
          </p>
        ) : !sent ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="secondary" disabled={sending} onClick={() => void send()}>
              {sending ? "Sending…" : "Send code by SMS"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Optional. You can confirm your number later from your profile.
            </span>
          </div>
        ) : (
          <>
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => void check(value)}
              disabled={checking}
              containerClassName="justify-start"
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              disabled={sending}
              onClick={() => void send()}
            >
              Send another code
            </Button>
          </>
        )}
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </ChannelShell>
  );
}

function VerifyPage() {
  const { account, updateAccount, verifyChannel, role, orgPath } = useOnboarding();
  const { user, refetchUser } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const email = (search.email ?? account.email).trim();

  // The API is the authority on what has been verified; the onboarding store is
  // a local draft and can disagree with it after a reload, a second tab, or a
  // visit from a different device.
  const emailVerified = user ? Boolean(user.email_verified_at) : account.emailVerified;
  const phoneVerified = user ? Boolean(user.phone_verified_at) : account.phoneVerified;
  const phone = user?.phone_number || account.phone;

  // Keep the local draft in step, so the rest of the flow reads one answer.
  useEffect(() => {
    if (emailVerified && !account.emailVerified) verifyChannel("email");
    if (phoneVerified && !account.phoneVerified) verifyChannel("phone");
  }, [emailVerified, phoneVerified, account.emailVerified, account.phoneVerified, verifyChannel]);

  // Arriving from sign-in carries the address in the URL; adopt it so the rest
  // of the flow reads the same value.
  useEffect(() => {
    if (search.email && search.email !== account.email) updateAccount({ email: search.email });
  }, [search.email, account.email, updateAccount]);

  const next = () => {
    if (role === "independent") navigate({ to: "/onboarding/application" });
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
      description="We sent a six-digit code to your email. Confirming it activates your account and signs you in."
    >
      <ProgressHeader step={5} total={6} onBack={() => navigate({ to: "/onboarding/account" })} />

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
        <PhoneChannel
          phone={phone}
          verified={phoneVerified}
          emailVerified={emailVerified}
          onVerified={() => {
            verifyChannel("phone");
            void refetchUser();
          }}
        />
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button size="lg" disabled={!emailVerified} onClick={next}>
          {emailVerified ? "Continue" : "Verify your email to continue"}
        </Button>
        <Button size="lg" variant="ghost" onClick={() => navigate({ to: "/onboarding/account" })}>
          Change details
        </Button>
      </div>
    </AuthShell>
  );
}
