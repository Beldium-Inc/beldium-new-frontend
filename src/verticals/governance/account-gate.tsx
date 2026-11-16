import { Link } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordGuide, passwordProblem } from "@/components/ui/password-guide";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, errorMessage } from "./ui";

/**
 * Governance pages reached from outside the workspace need a signed-in Beldium
 * account. Someone who already has one goes through the shared sign-in;
 * someone who does not creates one here, without the sector onboarding,
 * because governance seats come from an invitation or an approved request,
 * never from an organisation application.
 */
export function AccountGate({
  email: fixedEmail,
  onSignInClick,
  children,
}: {
  /** Lock the address, for an invitation sent to one. */
  email?: string;
  /** Called before leaving for the sign-in page, to park any state. */
  onSignInClick?: () => void;
  children: React.ReactNode;
}) {
  const { status } = useAuth();
  if (status === "loading")
    return <p className="text-sm text-muted-foreground">Checking your sign-in…</p>;
  if (status === "authenticated") return <>{children}</>;
  return <CreateAccount fixedEmail={fixedEmail} onSignInClick={onSignInClick} />;
}

function CreateAccount({
  fixedEmail,
  onSignInClick,
}: {
  fixedEmail?: string | undefined;
  onSignInClick?: (() => void) | undefined;
}) {
  const { signUp, confirmEmail, resendCode } = useAuth();
  const [stage, setStage] = React.useState<"choose" | "register" | "verify">("choose");
  const [email, setEmail] = React.useState(fixedEmail ?? "");
  const [first, setFirst] = React.useState("");
  const [last, setLast] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [terms, setTerms] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  if (stage === "choose") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Sign in with your Beldium account{fixedEmail ? ` for ${fixedEmail}` : ""}, or create one
          to continue.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild onClick={onSignInClick}>
            <Link to="/signin">I have an account</Link>
          </Button>
          <Button variant="outline" onClick={() => setStage("register")}>
            Create an account
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "verify") {
    return (
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await confirmEmail({ email, code: code.trim() });
            toast.success("Email verified");
          } catch (error) {
            toast.error(errorMessage(error));
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="text-sm text-muted-foreground">
          We sent a six digit code to {email}. Enter it to finish creating your account.
        </p>
        <Field label="Verification code" htmlFor="gate-code">
          <Input
            id="gate-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="font-mono tracking-[0.35em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy || code.length !== 6}>
            {busy ? "Checking…" : "Verify email"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              resendCode(email).then(
                () => toast.success("A new code is on its way"),
                (error: unknown) => toast.error(errorMessage(error)),
              )
            }
          >
            Send a new code
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const problem = passwordProblem(password);
        if (problem) {
          toast.error(problem);
          return;
        }
        if (password !== confirm) {
          toast.error("The passwords do not match.");
          return;
        }
        setBusy(true);
        try {
          await signUp({
            email: email.trim(),
            password,
            confirm_password: confirm,
            agreed_terms: terms,
            first_name: first.trim(),
            last_name: last.trim(),
          });
          setStage("verify");
        } catch (error) {
          if (error instanceof ApiError && error.isNetworkError)
            toast.error("The Beldium service could not be reached.");
          else toast.error(errorMessage(error));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First name" htmlFor="gate-first">
          <Input
            id="gate-first"
            required
            autoComplete="given-name"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
          />
        </Field>
        <Field label="Last name" htmlFor="gate-last">
          <Input
            id="gate-last"
            required
            autoComplete="family-name"
            value={last}
            onChange={(e) => setLast(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Work email" htmlFor="gate-email">
        <Input
          id="gate-email"
          type="email"
          required
          autoComplete="email"
          readOnly={Boolean(fixedEmail)}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Password" htmlFor="gate-password">
        <PasswordInput
          id="gate-password"
          required
          autoComplete="new-password"
          value={password}
          aria-describedby="gate-password-guide"
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <PasswordGuide id="gate-password-guide" password={password} identity={[first, last, email]} />
      <Field label="Confirm password" htmlFor="gate-confirm">
        <PasswordInput
          id="gate-confirm"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>
      <label className="flex items-start gap-2 text-sm">
        <Checkbox
          className="mt-0.5"
          checked={terms}
          onCheckedChange={(v) => setTerms(Boolean(v))}
        />{" "}
        I accept the Beldium terms and privacy notice.
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy || !terms}>
          {busy ? "Creating…" : "Create account"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setStage("choose")}>
          Back
        </Button>
      </div>
    </form>
  );
}
