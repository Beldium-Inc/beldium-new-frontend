import { createFileRoute } from "@tanstack/react-router";
import { SecurityWorkspace } from "@/components/security/SecurityWorkspace";
import { AppShell } from "@/verticals/marketplace/AppShell";

export const Route = createFileRoute("/marketplace/security")({ component: SecurityPage });

function SecurityPage() {
  return (
    <AppShell title="Security" subtitle="Two-step sign-in with an authenticator app">
      <SecurityWorkspace />
    </AppShell>
  );
}
