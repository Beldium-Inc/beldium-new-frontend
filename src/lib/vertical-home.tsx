import { useNavigate } from "@tanstack/react-router";
import * as React from "react";

import { useSession } from "./session";
import { type VerticalSlug, homeFor } from "./verticals";

/**
 * Landing route for a vertical whose roles do not share one home page.
 *
 * The session is only readable after client hydration, so this cannot be a
 * static `beforeLoad` redirect the way it can for verticals where every role
 * lands on the same page (see `mining.index.tsx`).
 */
export function VerticalHome({ slug }: { slug: VerticalSlug }) {
  const { session, hydrated } = useSession();
  const navigate = useNavigate();

  const role = session?.vertical === slug ? session.role : null;

  React.useEffect(() => {
    if (!hydrated) return;
    navigate({ to: role ? homeFor(slug, role) : "/", replace: true });
  }, [hydrated, role, slug, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Opening your workspace…</p>
    </div>
  );
}
