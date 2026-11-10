import { createFileRoute } from "@tanstack/react-router";
import { TeamWorkspace } from "@/components/team/TeamWorkspace";
import { useSession } from "@/lib/session";
import { AppShell } from "@/verticals/warehousing/app-shell";
import type { RoleId } from "@/verticals/warehousing/data";

export const Route = createFileRoute("/warehousing/team")({ component: TeamPage });

function TeamPage() {
  const { session } = useSession();
  const role = (session?.vertical === "warehousing" ? session.role : "operator") as RoleId;
  return (
    <AppShell role={role} title="Team" subtitle="Members, join requests, invitations and join code">
      <TeamWorkspace />
    </AppShell>
  );
}
