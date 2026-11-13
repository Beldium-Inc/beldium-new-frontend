import { createFileRoute } from "@tanstack/react-router";
import { SecurityWorkspace } from "@/components/security/SecurityWorkspace";

export const Route = createFileRoute("/processing/security")({ component: SecurityPage });

function SecurityPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <SecurityWorkspace />
    </div>
  );
}
