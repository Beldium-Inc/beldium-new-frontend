// Two-step sign-in with an authenticator app (Google Authenticator, Microsoft
// Authenticator, Authy, 1Password...). Pair by scanning a QR code, confirm
// with one code, save the backup codes. After that, sign-in asks for a code
// after the password.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Download, KeyRound, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  confirmMfaSetup,
  disableMfa,
  fetchMfaStatus,
  regenerateBackupCodes,
  startMfaSetup,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/api/queries";

const MFA_KEY = ["auth", "mfa"] as const;

function errorText(cause: unknown, fallback: string): string {
  return cause instanceof ApiError ? cause.message : fallback;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

function CodeInput({
  id,
  value,
  onChange,
  label = "6-digit code from the app",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        className="w-40 font-mono tracking-[0.35em]"
        placeholder="000000"
        onChange={(e) => onChange(digitsOnly(e.target.value))}
      />
    </div>
  );
}

export function TwoStepSettings({ email }: { email: string }) {
  const queryClient = useQueryClient();
  const status = useQuery({ queryKey: MFA_KEY, queryFn: fetchMfaStatus });
  const [pairing, setPairing] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: MFA_KEY });
    void queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
  };

  const start = useMutation({
    mutationFn: startMfaSetup,
    onSuccess: setPairing,
    onError: (cause) => toast.error(errorText(cause, "Could not start setup.")),
  });

  return (
    <section className="rounded-md border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-card-foreground">Two-step sign-in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            After your password, sign-in asks for a code from an authenticator app on your phone, so
            a stolen password alone cannot get into your account.
          </p>
        </div>
        {status.data ? (
          <StatusChip tone={status.data.enabled ? "success" : "neutral"}>
            {status.data.enabled ? "On" : "Off"}
          </StatusChip>
        ) : null}
      </div>

      <div className="mt-4">
        {backupCodes ? (
          <BackupCodes codes={backupCodes} email={email} onDone={() => setBackupCodes(null)} />
        ) : status.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : status.isError ? (
          <p className="text-sm text-destructive">Could not load your two-step sign-in settings.</p>
        ) : status.data.enabled ? (
          <Enabled
            confirmedAt={status.data.confirmed_at}
            remaining={status.data.backup_codes_remaining}
            onNewCodes={(codes) => {
              setBackupCodes(codes);
              refresh();
            }}
            onDisabled={refresh}
          />
        ) : pairing ? (
          <Pairing
            pairing={pairing}
            onCancel={() => setPairing(null)}
            onConfirmed={(codes) => {
              setPairing(null);
              setBackupCodes(codes);
              refresh();
            }}
          />
        ) : (
          <Button size="sm" disabled={start.isPending} onClick={() => start.mutate()}>
            <ShieldCheck className="mr-1.5 h-4 w-4" />
            {start.isPending ? "Starting…" : "Set up authenticator app"}
          </Button>
        )}
      </div>
    </section>
  );
}

function Pairing({
  pairing,
  onCancel,
  onConfirmed,
}: {
  pairing: { secret: string; otpauth_url: string };
  onCancel: () => void;
  onConfirmed: (codes: string[]) => void;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const confirm = useMutation({
    mutationFn: () => confirmMfaSetup(code),
    onSuccess: (data) => {
      toast.success("Two-step sign-in is on");
      onConfirmed(data.backup_codes);
    },
    onError: (cause) => setError(errorText(cause, "That code could not be checked.")),
  });

  useEffect(() => {
    let live = true;
    QRCode.toDataURL(pairing.otpauth_url, { margin: 1, width: 192 })
      .then((url) => live && setQr(url))
      .catch(() => live && setQr(null));
    return () => {
      live = false;
    };
  }, [pairing.otpauth_url]);

  const grouped = pairing.secret.match(/.{1,4}/g)?.join(" ") ?? pairing.secret;

  return (
    <div className="space-y-4">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>
          Install an authenticator app, such as Google Authenticator, Microsoft Authenticator or
          Authy.
        </li>
        <li>In the app, add an account and scan this QR code.</li>
        <li>Type the 6-digit code the app shows for Beldium.</li>
      </ol>
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex h-[200px] w-[200px] items-center justify-center rounded-md border border-border bg-white p-1">
          {qr ? (
            <img
              src={qr}
              alt="QR code to add Beldium to your authenticator app"
              width={192}
              height={192}
            />
          ) : (
            <span className="text-xs text-muted-foreground">Making QR code…</span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs text-muted-foreground">
            Can't scan it? Enter this key in the app instead:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-md border border-border bg-muted px-3 py-1.5 font-mono text-sm">
              {grouped}
            </code>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Copy setup key"
              onClick={() =>
                navigator.clipboard
                  .writeText(pairing.secret)
                  .then(() => toast.success("Key copied"))
                  .catch(() => toast.error("Copy failed; select and copy it instead"))
              }
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Time-based, 6 digits, every 30 seconds.</p>
        </div>
      </div>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          if (code.length !== 6) return setError("Enter the 6-digit code from the app.");
          confirm.mutate();
        }}
      >
        <CodeInput id="mfa-setup-code" value={code} onChange={setCode} />
        <Button type="submit" disabled={confirm.isPending}>
          {confirm.isPending ? "Checking…" : "Turn on"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </form>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function BackupCodes({
  codes,
  email,
  onDone,
}: {
  codes: string[];
  email: string;
  onDone: () => void;
}) {
  const text = [
    "Beldium Miner Hub backup codes",
    `Account: ${email}`,
    "Each code works once. Use one if you lose access to your authenticator app.",
    "",
    ...codes,
  ].join("\n");

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "beldium-backup-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Save these backup codes somewhere safe. Each one signs you in once if you lose your phone.
          They will not be shown again.
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/50 p-4 font-mono text-sm sm:max-w-sm">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            navigator.clipboard
              .writeText(codes.join("\n"))
              .then(() => toast.success("Backup codes copied"))
              .catch(() => toast.error("Copy failed; select and copy them instead"))
          }
        >
          <Copy className="mr-1.5 h-4 w-4" /> Copy
        </Button>
        <Button size="sm" variant="outline" onClick={download}>
          <Download className="mr-1.5 h-4 w-4" /> Download
        </Button>
        <Button size="sm" onClick={onDone}>
          I have saved them
        </Button>
      </div>
    </div>
  );
}

function Enabled({
  confirmedAt,
  remaining,
  onNewCodes,
  onDisabled,
}: {
  confirmedAt: string | null;
  remaining: number;
  onNewCodes: (codes: string[]) => void;
  onDisabled: () => void;
}) {
  const [mode, setMode] = useState<"idle" | "codes" | "disable">("idle");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setMode("idle");
    setCode("");
    setPassword("");
    setError("");
  };

  const newCodes = useMutation({
    mutationFn: () => regenerateBackupCodes(code),
    onSuccess: (data) => {
      reset();
      onNewCodes(data.backup_codes);
    },
    onError: (cause) => setError(errorText(cause, "That code could not be checked.")),
  });

  const disable = useMutation({
    mutationFn: () => disableMfa({ password, code }),
    onSuccess: () => {
      reset();
      toast.success("Two-step sign-in is off");
      onDisabled();
    },
    onError: (cause) => setError(errorText(cause, "Could not turn it off.")),
  });

  return (
    <div className="space-y-4">
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">On since</dt>
          <dd className="text-card-foreground">
            {confirmedAt ? new Date(confirmedAt).toLocaleDateString() : "-"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Backup codes left</dt>
          <dd>
            <StatusChip tone={remaining > 2 ? "neutral" : "warning"}>
              {String(remaining)}
            </StatusChip>
          </dd>
        </div>
      </dl>

      {mode === "idle" ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setMode("codes")}>
            New backup codes
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode("disable")}>
            Turn off
          </Button>
        </div>
      ) : (
        <form
          className="space-y-3 rounded-md border border-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            if (code.length !== 6)
              return setError("Enter the 6-digit code from your authenticator app.");
            if (mode === "disable") {
              if (!password) return setError("Enter your password.");
              disable.mutate();
            } else {
              newCodes.mutate();
            }
          }}
        >
          <p className="text-sm text-muted-foreground">
            {mode === "disable"
              ? "Confirm with your password and a code from the app. Sign-in will only ask for your password afterwards."
              : "Your current backup codes stop working and you get ten new ones."}
          </p>
          {mode === "disable" ? (
            <div className="max-w-xs space-y-1.5">
              <Label htmlFor="mfa-password">Password</Label>
              <PasswordInput
                id="mfa-password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          ) : null}
          <CodeInput id="mfa-manage-code" value={code} onChange={setCode} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              variant={mode === "disable" ? "destructive" : "default"}
              disabled={disable.isPending || newCodes.isPending}
            >
              {mode === "disable" ? "Turn off two-step sign-in" : "Make new codes"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={reset}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
