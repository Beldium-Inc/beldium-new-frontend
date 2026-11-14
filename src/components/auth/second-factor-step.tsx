import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";
import {
  confirmSecondFactorEnrolment,
  fetchCurrentUser,
  startSecondFactorEnrolment,
  type SecondFactorChallenge,
  type SecondFactorEnrolment,
} from "@/lib/api/auth";
import { queryKeys } from "@/lib/api/queries";
import type { User } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Stage = "code" | "setup" | "recovery";

/**
 * The step after a correct password for internal and partner accounts: a code
 * from an authenticator app, or a recovery code. An account with no app yet
 * links one here first, then sees its recovery codes once.
 */
export function SecondFactorStep({
  challenge,
  onDone,
  onCancel,
}: {
  challenge: SecondFactorChallenge;
  onDone: (user: User) => void | Promise<void>;
  onCancel: () => void;
}) {
  const { finishSecondFactor } = useAuth();
  const queryClient = useQueryClient();
  const [stage, setStage] = React.useState<Stage>(challenge.enrolment_required ? "setup" : "code");
  const [enrolment, setEnrolment] = React.useState<SecondFactorEnrolment | null>(null);
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([]);
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fail = (cause: unknown) => {
    if (
      cause instanceof ApiError &&
      (cause.code === "challenge_expired" || cause.code === "second_factor_locked")
    ) {
      toast.error(cause.message);
      onCancel();
      return;
    }
    setError(
      cause instanceof ApiError ? cause.message : "That could not be checked. Please try again.",
    );
  };

  const loadUser = () =>
    queryClient.fetchQuery({
      queryKey: queryKeys.currentUser,
      queryFn: ({ signal }) => fetchCurrentUser(signal),
    });

  const beginSetup = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      setEnrolment(await startSecondFactorEnrolment(challenge.challenge_token));
    } catch (cause) {
      fail(cause);
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async () => {
    const value = code.trim();
    if (!value || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (stage === "setup") {
        const codes = await confirmSecondFactorEnrolment({
          code: value,
          challenge_token: challenge.challenge_token,
        });
        setRecoveryCodes(codes);
        setStage("recovery");
      } else {
        await onDone(
          await finishSecondFactor({ challenge_token: challenge.challenge_token, code: value }),
        );
      }
    } catch (cause) {
      setCode("");
      fail(cause);
    } finally {
      setBusy(false);
    }
  };

  const finishRecovery = async () => {
    setBusy(true);
    try {
      await onDone(await loadUser());
    } catch (cause) {
      fail(cause);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to sign in
      </button>

      {stage === "recovery" ? (
        <div className="mt-4 space-y-4">
          <h2 className="font-display text-xl font-semibold">Save your recovery codes</h2>
          <p className="text-sm text-muted-foreground">
            Each code signs you in once if you lose your phone. They are shown only now. Keep them
            somewhere safe, away from this device.
          </p>
          <ul className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/40 p-4 font-mono text-sm">
            {recoveryCodes.map((value) => (
              <li key={value}>{value}</li>
            ))}
          </ul>
          <Button
            className="w-full"
            size="lg"
            onClick={() => void finishRecovery()}
            disabled={busy}
          >
            {busy ? "Opening…" : "I have saved them, continue"}
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              {stage === "setup" ? (
                <KeyRound className="size-5" />
              ) : (
                <ShieldCheck className="size-5" />
              )}
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold">
                {stage === "setup" ? "Set up your authenticator app" : "Enter your sign in code"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {stage === "setup"
                  ? "Your account needs a second step at sign in."
                  : "Open your authenticator app and type the 6 digit code, or use a recovery code."}
              </p>
            </div>
          </div>

          {stage === "setup" && !enrolment ? (
            <Button className="w-full" size="lg" onClick={() => void beginSetup()} disabled={busy}>
              {busy ? "Preparing…" : "Start set up"}
            </Button>
          ) : null}

          {stage === "setup" && enrolment ? (
            <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <p>
                In Google Authenticator, Microsoft Authenticator or a similar app, add an account
                and enter this key, or{" "}
                <a href={enrolment.otpauth_uri} className="font-medium text-brand underline">
                  open it on this phone
                </a>
                .
              </p>
              <p className="break-all font-mono text-base tracking-wider">
                {enrolment.secret.replace(/(.{4})/g, "$1 ").trim()}
              </p>
            </div>
          ) : null}

          {stage === "code" || enrolment ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void submitCode();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="second-factor-code">
                  {stage === "setup" ? "Code shown in the app" : "Code"}
                </Label>
                <Input
                  id="second-factor-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  autoComplete="one-time-code"
                  inputMode={stage === "setup" ? "numeric" : "text"}
                  autoFocus
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button className="w-full" size="lg" type="submit" disabled={busy || !code.trim()}>
                {busy ? "Checking…" : stage === "setup" ? "Confirm and continue" : "Sign in"}
              </Button>
            </form>
          ) : null}
        </div>
      )}
    </div>
  );
}
