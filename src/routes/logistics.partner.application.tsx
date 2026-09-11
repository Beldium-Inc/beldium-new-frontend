import { createFileRoute } from "@tanstack/react-router";
import { Check, Circle, Loader2 } from "lucide-react";
import { AppShell } from "@/verticals/logistics/AppShell";
import { PageHeader, Panel, Pill, ScoreBar } from "@/verticals/logistics/bits";
import { useApp } from "@/verticals/logistics/store";

export const Route = createFileRoute("/logistics/partner/application")({
  head: () => ({
    meta: [
      { title: "Application progress | Beldium Logistics Partner Portal" },
      { name: "description", content: "Track each stage of your Beldium onboarding and verification application." },
      { property: "og:title", content: "Application progress | Beldium Logistics Partner Portal" },
      { property: "og:description", content: "Onboarding stages, current step and what happens next." },
    ],
  }),
  component: ApplicationPage,
});

const STAGES = [
  { name: "Company registration", detail: "CAC records, TIN and directors submitted", state: "done" },
  { name: "Document upload", detail: "18 of 20 required documents provided", state: "done" },
  { name: "Fleet & driver declaration", detail: "12 vehicles and 14 drivers registered", state: "done" },
  { name: "Compliance review", detail: "Reviewer Ngozi Adeyemi is working through 9 check domains", state: "active" },
  { name: "Additional information", detail: "Mineral transport authorisation outstanding", state: "active" },
  { name: "Decision", detail: "Approval, conditional approval or rejection issued", state: "todo" },
  { name: "Continuous monitoring", detail: "Automatic expiry and risk monitoring begins", state: "todo" },
];

function ApplicationPage() {
  const { myCompany } = useApp();
  const c = myCompany!;

  return (
    <AppShell role="partner" breadcrumbs={[{ label: "Sahel Haulage & Minerals Ltd", to: "/logistics/partner" }, { label: "Application progress" }]}>
      <PageHeader title="Application progress" description={`Submitted ${c.submitted} · reviewer ${c.reviewer} · status ${c.status}`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Onboarding stages" bodyClassName="p-5">
          <ol className="space-y-4">
            {STAGES.map((s, i) => (
              <li key={s.name} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={
                      "grid h-7 w-7 place-items-center rounded-full text-white " +
                      (s.state === "done" ? "bg-[var(--brand)]" : s.state === "active" ? "bg-[var(--link)]" : "bg-muted text-muted-foreground")
                    }
                  >
                    {s.state === "done" ? <Check className="h-3.5 w-3.5" /> : s.state === "active" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Circle className="h-3 w-3" />}
                  </span>
                  {i < STAGES.length - 1 ? <span className="mt-1 w-px flex-1 bg-border" /> : null}
                </div>
                <div className="pb-1">
                  <p className="text-sm font-medium text-[var(--brand)]">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
        <div className="space-y-4">
          <Panel title="Completion">
            <ScoreBar label="Overall application" value={78} />
            <div className="mt-3 space-y-3">
              <ScoreBar label="Documents provided" value={90} />
              <ScoreBar label="Checks cleared" value={67} />
            </div>
          </Panel>
          <Panel title="What happens next">
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>Respond to the open information request before the due date.</li>
              <li>Beldium re-runs the mineral transport check within 2 business days.</li>
              <li>A decision is issued and continuous monitoring begins.</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Pill tone="warning">Mineral haulage restricted</Pill>
              <Pill tone="success">General freight permitted</Pill>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
