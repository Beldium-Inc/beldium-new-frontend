import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError, confirmPasswordReset, requestPasswordReset } from "@/lib/api";
import { siteTitle } from "@/lib/site-title";
import { useSignOut } from "@/lib/sign-out";

export const Route = createFileRoute("/forgot-password")({
  // Shares the host checks in AuthShell, so it renders in the browser only.
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { email?: string } => {
    const email = search["email"];
    return typeof email === "string" && email.trim() ? { email: email.trim() } : {};
  },
  head: () => ({
    meta: [
      { title: siteTitle("Reset your password | Beldium Compliance") },
      { name: "description", content: "Reset the password on your Beldium account." },
    ],
  }),
  component: ForgotPasswordPage,
});

/**
 * Password reset by emailed code. Step one asks for the address; step two
 * takes the six-digit code from the email and the new password. The server
 * replies the same way whether or not the address has an account, so this page
 * never says which it was.
 */
function ForgotPasswordPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState(search.email ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sendCode = async () => {
    const address = email.trim();
    if (!address.includes("@")) {
      setErrors({ email: "Enter the email address you sign in with." });
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      await requestPasswordReset(address);
      setStep("reset");
      toast.success("If an account uses that address, we've emailed it a reset code.");
    } catch (error) {
      toast.error(
        error instanceof ApiError && error.status === 429
          ? "Too many attempts. Wait a few minutes and try again."
          : "We couldn't send a reset code. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    const next: Record<string, string> = {};
    if (code.length !== 6) next["code"] = "Enter the six-digit code from the email.";
    if (password.length < 8) next["new_password"] = "Use at least 8 characters.";
    if (password !== confirm) next["confirm_password"] = "The passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await confirmPasswordReset({
        email: email.trim(),
        code,
        new_password: password,
        confirm_password: confirm,
      });
      // The server has signed the account out everywhere. Drop any session
      // this browser still holds so sign-in asks for the new password.
      signOut();
      toast.success("Password changed. Sign in with your new password.");
      navigate({ to: "/signin" });
    } catch (error) {
      if (error instanceof ApiError) {
        const fields = error.fieldErrors();
        if (error.code === "invalid_verification_code") {
          setErrors({
            code: "That code is wrong or has expired. Check the email or send a new one.",
          });
        } else if (Object.keys(fields).length) {
          setErrors(fields);
        } else if (error.status === 429) {
          toast.error("Too many attempts. Wait a few minutes and try again.");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("We couldn't reset your password. Try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      width="sm"
      eyebrow="Account recovery"
      title="Reset your password"
      description={
        step === "email"
          ? "Enter the email address you sign in with. We'll email you a six-digit code."
          : `Enter the code we emailed to ${email.trim()} and choose a new password.`
      }
    >
      {step === "email" ? (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void sendCode();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            {errors["email"] && <p className="text-xs text-danger">{errors["email"]}</p>}
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Sending…" : "Email me a reset code"}
          </Button>
        </form>
      ) : (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void resetPassword();
          }}
        >
          <div className="space-y-1.5">
            <Label>Reset code</Label>
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(v) => setCode(v.replace(/\D/g, ""))}
              disabled={busy}
              containerClassName="justify-start"
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            {errors["code"] && <p className="text-xs text-danger">{errors["code"]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors["new_password"] && (
              <p className="text-xs text-danger">{errors["new_password"]}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {errors["confirm_password"] && (
              <p className="text-xs text-danger">{errors["confirm_password"]}</p>
            )}
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Saving…" : "Set new password"}
          </Button>
          <p className="text-xs text-muted-foreground">
            No email?{" "}
            <button
              type="button"
              className="font-medium text-brand underline"
              disabled={busy}
              onClick={() => void sendCode()}
            >
              Send a new code
            </button>{" "}
            or{" "}
            <button
              type="button"
              className="font-medium text-brand underline"
              onClick={() => {
                setStep("email");
                setCode("");
                setErrors({});
              }}
            >
              use a different address
            </button>
            . Signing in again is needed on every device afterwards.
          </p>
        </form>
      )}

      <p className="mt-7 text-center text-xs text-muted-foreground">
        Remembered it?{" "}
        <Link to="/signin" className="font-medium text-brand underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
