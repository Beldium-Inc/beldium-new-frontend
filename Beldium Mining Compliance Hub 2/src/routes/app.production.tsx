import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, DemoNote } from "@/components/app/primitives";

export const Route = createFileRoute("/app/production")({ component: Page });

function Page() {
  return (
    <>
      <PageHeader title="Production" description="Prototype screen. Data is seeded locally for the Beldium demo." />
      <div className="mb-5"><DemoNote>Demo screen — the primary interactive workflow lives in the mine review at Sites &rarr; NL-024.</DemoNote></div>
      <Panel title="Production">
        <p className="text-sm text-muted-foreground">This section of the prototype is stubbed. Use the Dashboard and the NL-024 mine review for the full workflow.</p>
      </Panel>
    </>
  );
}
