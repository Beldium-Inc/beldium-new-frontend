import { createFileRoute } from "@tanstack/react-router";
import { SecurityWorkspace } from "@/components/security/SecurityWorkspace";
import { useSession } from "@/lib/session";
import { AppShell } from "@/verticals/warehousing/app-shell";
import type { RoleId } from "@/verticals/warehousing/data";

export const Route = createFileRoute("/warehousing/security")({ component: SecurityPage });

function SecurityPage() {
  const { session } = useSession();
  const role = (session?.vertical === "warehousing" ? session.role : "operator") as RoleId;
  return (
    <AppShell role={role} title="Security" subtitle="Two-step sign-in with an authenticator app">
      <SecurityWorkspace />
    </AppShell>
  );
}
