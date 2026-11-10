import { createFileRoute } from "@tanstack/react-router";
import { TeamWorkspace } from "@/components/team/TeamWorkspace";
import { AppShell } from "@/verticals/export/AppShell";

export const Route = createFileRoute("/export/team")({ component: TeamPage });

function TeamPage() {
  return (
    <AppShell title="Team" subtitle="Members, join requests, invitations and join code">
      <TeamWorkspace />
    </AppShell>
  );
}
