import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useMiner } from "@/verticals/miner/store";
import { PageHeader, Panel, Field } from "@/verticals/miner/components/primitives";

export const Route = createFileRoute("/miner/settings")({ component: SettingsPage });

function SettingsPage() {
  const { user, orgName, logout } = useMiner();
  return (
    <>
      <PageHeader title="Settings" description="Your account and workspace preferences." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Account">
          <div className="grid gap-4">
            <Field label="Name" value={user?.name ?? "—"} />
            <Field label="Role" value={user?.title ?? "—"} />
            <Field label="Organisation" value={orgName} />
          </div>
        </Panel>
        <Panel title="Session">
          <p className="mb-4 text-sm text-muted-foreground">
            Sign out of this workspace on this device.
          </p>
          <Button variant="outline" size="sm" onClick={logout}>
            Sign out
          </Button>
        </Panel>
      </div>
    </>
  );
}
