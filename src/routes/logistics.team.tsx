import { createFileRoute } from "@tanstack/react-router";
import { TeamWorkspace } from "@/components/team/TeamWorkspace";
import { useSession } from "@/lib/session";
import { AppShell } from "@/verticals/logistics/AppShell";
import type { Role } from "@/verticals/logistics/mock-data";

export const Route = createFileRoute("/logistics/team")({ component: TeamPage });

function TeamPage() {
  const { session } = useSession();
  const role = (session?.vertical === "logistics" ? session.role : "operator") as Role;
  return (
    <AppShell role={role} breadcrumbs={[{ label: "Team" }]}>
      <TeamWorkspace />
    </AppShell>
  );
}
