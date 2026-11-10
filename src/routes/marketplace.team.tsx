import { createFileRoute } from "@tanstack/react-router";
import { TeamWorkspace } from "@/components/team/TeamWorkspace";
import { AppShell } from "@/verticals/marketplace/AppShell";

export const Route = createFileRoute("/marketplace/team")({ component: TeamPage });

function TeamPage() {
  return (
    <AppShell title="Team" subtitle="Members, join requests, invitations and join code">
      <TeamWorkspace />
    </AppShell>
  );
}
