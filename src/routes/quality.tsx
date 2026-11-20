import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { BeldiumProvider } from "@/verticals/quality/store";
import { goToComplianceHost, goToQcHost, isComplianceHost, isQcHost } from "@/lib/hosts";
import { useSession } from "@/lib/session";
import { useSignOut } from "@/lib/sign-out";

export const Route = createFileRoute("/quality")({
  head: () => ({
    meta: [
      { title: "Beldium Quality & Control" },
      {
        name: "description",
        content:
          "Sample custody, laboratory testing and material certificates for Nigerian mineral supply chains.",
      },
    ],
  }),
  component: QualityLayout,
});

function QualityLayout() {
  const { session, hydrated } = useSession();
  const signOut = useSignOut();
  const navigate = useNavigate();

  // The Q&C role is read from the server inside BeldiumProvider (task E9).
  // The session only says this person signed in to the Q&C workspace.
  const valid = session?.vertical === "quality";

  // Labs and Q&C staff work on the Q&C site; the regulators above them work
  // here on the compliance site. Anyone on the wrong one is sent across. The
  // session belongs to this origin, so they sign in again over there.
  const regulator = session?.role === "regulator";
  const wrongSite = valid && (isQcHost() ? regulator : isComplianceHost() && !regulator);
  useEffect(() => {
    if (!hydrated || !wrongSite) return;
    const { pathname, search, hash } = window.location;
    signOut();
    if (isQcHost()) goToComplianceHost("/signin");
    else goToQcHost(`${pathname}${search}${hash}`);
  }, [hydrated, wrongSite, signOut]);

  useEffect(() => {
    if (hydrated && !valid) navigate({ to: "/signin" });
  }, [hydrated, valid, navigate]);

  if (!hydrated || !valid || wrongSite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          {hydrated ? "Redirecting to sign in…" : "Loading workspace…"}
        </p>
      </div>
    );
  }

  return (
    // data-vertical scopes this dashboard's theme tokens (see src/styles.css).
    <div data-vertical="quality">
      <BeldiumProvider onSignOut={signOut}>
        <Outlet />
      </BeldiumProvider>
    </div>
  );
}
