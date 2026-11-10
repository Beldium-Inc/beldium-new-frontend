import { createFileRoute } from "@tanstack/react-router";
import { TeamWorkspace } from "@/components/team/TeamWorkspace";
import { AppShell } from "@/verticals/quality/shell";

export const Route = createFileRoute("/quality/team")({ component: TeamPage });

function TeamPage() {
  return (
    <AppShell>
      <TeamWorkspace />
    </AppShell>
  );
}
