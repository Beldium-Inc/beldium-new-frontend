import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, DemoNote } from "@/verticals/mining/components/primitives";

export const Route = createFileRoute("/mining/nonconformities")({ component: Page });

function Page() {
  return (
    <>
      <PageHeader title="Non-Conformities" description="Prototype screen. Data is seeded locally for the Beldium demo." />
      <div className="mb-5"><DemoNote>Demo screen: the primary interactive workflow lives in the mine review at Sites &rarr; NL-024.</DemoNote></div>
      <Panel title="Non-Conformities">
        <p className="text-sm text-muted-foreground">This section of the prototype is stubbed. Use the Dashboard and the NL-024 mine review for the full workflow.</p>
      </Panel>
    </>
  );
}
