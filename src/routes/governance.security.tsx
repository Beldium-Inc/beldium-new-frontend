import { createFileRoute } from "@tanstack/react-router";
import { SecurityWorkspace } from "@/components/security/SecurityWorkspace";

export const Route = createFileRoute("/governance/security")({ component: SecurityWorkspace });
