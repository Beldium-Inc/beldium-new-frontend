import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, ProgressHeader } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ApiError } from "@/lib/api";
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

/** The phone channel has no backend yet; this stands in until it does. */
const DEMO_PHONE_CODE = "224466";

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
      onVerified();
      toast.success("Email address confirmed.");
    } catch (cause) {
      setCode("");
      setError(
        cause instanceof ApiError
          ? cause.message
          : "That code could not be checked. Please try again.",
      );
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

function PhoneChannel({
  phone,
  verified,
  onVerified,
}: {
  phone: string;
  verified: boolean;
  onVerified: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const check = (value: string) => {
    setCode(value);
    if (value.length < 6) return;
    if (value === DEMO_PHONE_CODE) {
      setError(false);
      onVerified();
      toast.success("Mobile number confirmed");
    } else {
      setError(true);
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
        <InputOTP maxLength={6} value={code} onChange={check} containerClassName="justify-start">
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        {error && <p className="text-xs text-danger">That code is not correct.</p>}
        <p className="text-xs text-muted-foreground">
          SMS verification is not connected yet, so this step is simulated. Demo code:{" "}
          <span className="font-medium text-foreground">{DEMO_PHONE_CODE}</span>
        </p>
      </div>
    </ChannelShell>
  );
}

function VerifyPage() {
  const { account, updateAccount, verifyChannel, role, orgPath } = useOnboarding();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const email = (search.email ?? account.email).trim();

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
          verified={account.emailVerified}
          onVerified={() => verifyChannel("email")}
        />
        <PhoneChannel
          phone={account.phone}
          verified={account.phoneVerified}
          onVerified={() => verifyChannel("phone")}
        />
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button size="lg" disabled={!account.emailVerified} onClick={next}>
          {account.emailVerified ? "Continue" : "Verify your email to continue"}
        </Button>
        <Button size="lg" variant="ghost" onClick={() => navigate({ to: "/onboarding/account" })}>
          Change details
        </Button>
      </div>
    </AuthShell>
  );
}
