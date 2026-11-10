import { createFileRoute } from "@tanstack/react-router";
import { TeamWorkspace } from "@/components/team/TeamWorkspace";

export const Route = createFileRoute("/processing/team")({ component: TeamPage });

function TeamPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <TeamWorkspace />
    </div>
  );
}
