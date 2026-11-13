import { createFileRoute } from "@tanstack/react-router";
import { SecurityWorkspace } from "@/components/security/SecurityWorkspace";
import { AppShell } from "@/verticals/export/AppShell";

export const Route = createFileRoute("/export/security")({ component: SecurityPage });

function SecurityPage() {
  return (
    <AppShell title="Security" subtitle="Two-step sign-in with an authenticator app">
      <SecurityWorkspace />
    </AppShell>
  );
}
