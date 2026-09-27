import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { needsComplianceSetup, useAccountSetup } from "@/lib/onboarding/setup";
import { rememberOnboardingSector } from "@/lib/onboarding/store";
import { useSession } from "@/lib/session";

const COPY = {
  no_organisation: {
    title: "Your account setup isn't finished",
    body: "Register your organisation to be verified and get full access to this workspace.",
    action: "Continue setup",
  },
  draft: {
    title: "Your registration hasn't been submitted",
    body: "Complete the outstanding sections and submit your application for verification.",
    action: "Continue application",
  },
  join_pending: {
    title: "Waiting for your organisation",
    body: "Your request to join an organisation is waiting for its administrator's approval.",
    action: "View request",
  },
} as const;

/**
 * Shown at the top of a compliance workspace while the signed-in account's
 * onboarding application is incomplete, with a way back into it.
 */
export function SetupBanner() {
  const { user } = useAuth();
  const { session } = useSession();
  const applies = session ? needsComplianceSetup(session.vertical, session.role) : false;
  const setup = useAccountSetup(user, applies);

  const data = setup.data;
  if (!session || !data || data.stage === "complete") return null;
  const copy = COPY[data.stage];

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/60 bg-warning/15 px-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {copy.title}
            {data.stage === "draft" ? ` (${data.percent}% complete)` : ""}
          </p>
          <p className="text-sm text-muted-foreground">{copy.body}</p>
        </div>
      </div>
      <Button asChild size="sm">
        <Link to={data.resumeTo} onClick={() => rememberOnboardingSector(session.vertical)}>
          {copy.action} <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
