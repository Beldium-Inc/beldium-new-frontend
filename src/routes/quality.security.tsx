import { createFileRoute } from "@tanstack/react-router";
import { SecurityWorkspace } from "@/components/security/SecurityWorkspace";
import { AppShell } from "@/verticals/quality/shell";

export const Route = createFileRoute("/quality/security")({ component: SecurityPage });

function SecurityPage() {
  return (
    <AppShell>
      <SecurityWorkspace />
    </AppShell>
  );
}
