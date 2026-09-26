import { createFileRoute } from "@tanstack/react-router";

import {
  DemoComplianceControls,
  InformationRequests,
} from "@/components/beldium/application-status";
import { PageHeader } from "@/components/beldium/shell";
import { useWorkspace } from "@/lib/workspace";

const title = "Information requests - Beldium Logistics Hub";

export const Route = createFileRoute("/portal/requests")({
  head: () => ({
    meta: [
      { title },
      {
        name: "description",
        content: "Respond to information requests from Beldium Logistics Compliance.",
      },
    ],
  }),
  component: RequestsPage,
});

function RequestsPage() {
  const workspace = useWorkspace();
  return (
    <>
      <PageHeader
        title="Information requests"
        description="Beldium Logistics Compliance raises these when it needs more evidence on your organisation, fleet or drivers."
      />
      {workspace.loading ? (
        <p className="text-sm text-muted-foreground">Loading requests…</p>
      ) : (
        <InformationRequests workspace={workspace} />
      )}
      <DemoComplianceControls />
    </>
  );
}
