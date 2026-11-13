// The Security page every sector dashboard mounts, next to Team: the
// signed-in person's own sign-in protection. Same for compliance partners,
// regulators, operators and every other role, since it is about the account
// and not the company.

import { KeyRound } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { TwoStepSettings } from "@/components/security/TwoStepSettings";

export function SecurityWorkspace() {
  const { user, status } = useAuth();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Your account
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user ? `Signed in as ${user.email}` : "How you sign in to Beldium."}
        </p>
      </div>
      {status === "loading" ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : user ? (
        <div className="max-w-3xl">
          <TwoStepSettings email={user.email} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sign in to manage your account security.</p>
      )}
    </div>
  );
}

export const SECURITY_ICON = KeyRound;
