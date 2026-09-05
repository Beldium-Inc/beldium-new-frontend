import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, ProgressHeader } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useOnboarding } from "@/lib/onboarding/store";

export const Route = createFileRoute("/onboarding/verify")({ component: VerifyPage });

const DEMO_CODE = "224466";

function Channel({
  icon,
  title,
  target,
  verified,
  onVerified,
}: {
  icon: React.ReactNode;
  title: string;
  target: string;
  verified: boolean;
  onVerified: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [seconds, setSeconds] = useState(45);

  useEffect(() => {
    if (verified || seconds === 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, verified]);

  const check = (value: string) => {
    setCode(value);
    if (value.length < 6) return;
    if (value === DEMO_CODE) {
      setError(false);
      onVerified();
      toast.success(`${title} confirmed`);
    } else {
      setError(true);
    }
  };

  return (
    <div className="rounded-[18px] border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-[12px] bg-brand-soft text-brand">{icon}</span>
          <div>
            <p className="font-display text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{target || "Not provided"}</p>
          </div>
        </div>
        {verified && (
          <span className="rounded-full border border-success/50 bg-success/30 px-2.5 py-1 text-xs font-medium">Verified</span>
        )}
      </div>

      {!verified && (
        <div className="mt-4 space-y-3">
          <InputOTP maxLength={6} value={code} onChange={check} containerClassName="justify-start">
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {error && <p className="text-xs text-danger">That code is not correct. Demo code is {DEMO_CODE}.</p>}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Demo code: <span className="font-medium text-foreground">{DEMO_CODE}</span></span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              disabled={seconds > 0}
              onClick={() => {
                setSeconds(45);
                toast.info("A new one-time code has been sent (simulated).");
              }}
            >
              {seconds > 0 ? `Resend code in ${seconds}s` : "Resend code"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function VerifyPage() {
  const { account, verifyChannel, role, orgPath } = useOnboarding();
  const navigate = useNavigate();
  const both = account.emailVerified && account.phoneVerified;

  const next = () => {
    if (role === "independent") navigate({ to: "/onboarding/application" });
    else if (orgPath === "existing") navigate({ to: "/onboarding/join" });
    else navigate({ to: "/onboarding/application" });
  };

  return (
    <AuthShell
      title="Verify your email and phone"
      description="We sent a six-digit code to each channel. Both must be confirmed before you can submit compliance information."
    >
      <ProgressHeader step={5} total={6} onBack={() => navigate({ to: "/onboarding/account" })} />

      <div className="space-y-4">
        <Channel
          icon={<Mail className="size-4" />}
          title="Email address"
          target={account.email}
          verified={account.emailVerified}
          onVerified={() => verifyChannel("email")}
        />
        <Channel
          icon={<Smartphone className="size-4" />}
          title="Mobile number"
          target={account.phone}
          verified={account.phoneVerified}
          onVerified={() => verifyChannel("phone")}
        />
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button size="lg" disabled={!both} onClick={next}>
          {both ? "Continue" : "Verify both channels to continue"}
        </Button>
        <Button size="lg" variant="ghost" onClick={() => navigate({ to: "/onboarding/account" })}>
          Change details
        </Button>
      </div>
    </AuthShell>
  );
}
