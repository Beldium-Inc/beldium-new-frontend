import { createFileRoute } from "@tanstack/react-router";
import { TeamWorkspace } from "@/components/team/TeamWorkspace";

export const Route = createFileRoute("/mining/team")({ component: TeamWorkspace });
