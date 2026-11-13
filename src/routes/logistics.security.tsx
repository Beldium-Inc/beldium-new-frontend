import { createFileRoute } from "@tanstack/react-router";
import { SecurityWorkspace } from "@/components/security/SecurityWorkspace";
import { useSession } from "@/lib/session";
import { AppShell } from "@/verticals/logistics/AppShell";
import type { Role } from "@/verticals/logistics/mock-data";

export const Route = createFileRoute("/logistics/security")({ component: SecurityPage });

function SecurityPage() {
  const { session } = useSession();
  const role = (session?.vertical === "logistics" ? session.role : "operator") as Role;
  return (
    <AppShell role={role} breadcrumbs={[{ label: "Security" }]}>
      <SecurityWorkspace />
    </AppShell>
  );
}
