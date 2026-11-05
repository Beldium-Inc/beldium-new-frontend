import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout, Btn, CodeInput, FieldError, Label, inputClass } from "@/components/beldium/auth";
import { useAccounts } from "@/lib/beldium/accounts";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Beldium" },
      { name: "description", content: "Reset the password for your Beldium Quality & Control account." },
      { property: "og:title", content: "Reset password — Beldium" },
      { property: "og:description", content: "Recover access to your Beldium account in three steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const { findByEmail, resetPassword } = useAccounts();
  const navigate = useNavigate();
  const [step, setStep] = React.useState<"email" | "code" | "password" | "done">("email");
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState("");
  const [code, setCode] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [err, setErr] = React.useState("");

  const send = () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr("Enter a valid email address.");
    if (!findByEmail(email)) return setErr("No Beldium account uses this email address.");
    const c = String(Math.floor(100000 + Math.random() * 900000));
    setSent(c);
    setErr("");
    setCode("");
    setStep("code");
    toast.success(`Reset code sent to ${email} (demo code ${c})`);
  };

  return (
    <AuthLayout>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-link">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
      <h2 className="mt-4 font-display text-2xl font-semibold text-navy">Reset your password</h2>

      {step === "email" ? (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-muted-foreground">Enter your account email and we'll send a 6-digit reset code.</p>
          <div>
            <Label htmlFor="fe">Email</Label>
            <input id="fe" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} aria-invalid={!!err} />
            <FieldError>{err}</FieldError>
          </div>
          <Btn className="w-full" onClick={send}>Send reset code</Btn>
        </div>
      ) : null}

      {step === "code" ? (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter the code sent to <span className="font-semibold text-navy">{email}</span>.
          </p>
          <p className="rounded-xl bg-pale px-3 py-2 text-xs text-navy">Demo code: <span className="font-mono font-semibold">{sent}</span></p>
          <CodeInput value={code} onChange={setCode} />
          <FieldError>{err}</FieldError>
          <div className="flex gap-2">
            <Btn variant="outline" onClick={send}>Resend</Btn>
            <Btn className="flex-1" onClick={() => (code === sent ? (setErr(""), setStep("password")) : setErr("That code is incorrect."))}>
              Verify code
            </Btn>
          </div>
        </div>
      ) : null}

      {step === "password" ? (
        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="p1">New password</Label>
            <input id="p1" type="password" value={pw} onChange={(e) => setPw(e.target.value)} className={inputClass} />
          </div>
          <div>
            <Label htmlFor="p2">Confirm new password</Label>
            <input id="p2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} className={inputClass} />
            <FieldError>{err}</FieldError>
          </div>
          <Btn
            className="w-full"
            onClick={() => {
              if (pw.length < 8 || !/\d/.test(pw)) return setErr("Use at least 8 characters including a number.");
              if (pw !== pw2) return setErr("Passwords do not match.");
              resetPassword(email, pw);
              setStep("done");
            }}
          >
            Update password
          </Btn>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="mt-6 text-center">
          <CheckCircle2 className="mx-auto size-12 text-success-foreground" />
          <p className="mt-3 font-display text-lg font-semibold text-navy">Password updated</p>
          <p className="mt-1 text-sm text-muted-foreground">You can now sign in with your new password.</p>
          <Btn className="mt-5 w-full" onClick={() => navigate({ to: "/" })}>Go to Sign In</Btn>
        </div>
      ) : null}
    </AuthLayout>
  );
}
