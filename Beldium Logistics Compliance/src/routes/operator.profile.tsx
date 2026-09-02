import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Mail, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/beldium/AppShell";
import { KeyValue, PageHeader, Panel, Pill, ScoreBar } from "@/components/beldium/bits";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/operator/profile")({
  head: () => ({
    meta: [
      { title: "My profile — Beldium Compliance Operations" },
      { name: "description", content: "Reviewer profile, permissions and personal compliance workload." },
      { property: "og:title", content: "My profile — Beldium Compliance Operations" },
      { property: "og:description", content: "Reviewer permissions and workload for Beldium compliance operators." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { session, signOut, companies, requests } = useApp();
  const navigate = useNavigate();
  const mine = companies.filter((c) => c.reviewer === session?.person);

  return (
    <AppShell role="operator" breadcrumbs={[{ label: "Compliance Operations", to: "/operator" }, { label: "My profile" }]}>
      <PageHeader title="My profile" description="Your reviewer identity, permissions and current caseload." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Reviewer" className="lg:col-span-2">
          <KeyValue
            items={[
              { label: "Name", value: session?.person ?? "" },
              { label: "Title", value: session?.title ?? "" },
              { label: "Organisation", value: session?.org ?? "" },
              { label: "Email", value: session?.email ?? "" },
              { label: "Reviewer code", value: "BLD-OPS-014" },
              { label: "Time zone", value: "Africa/Lagos (WAT)" },
            ]}
          />
          <div className="mt-5 flex flex-wrap gap-2">
            <Pill tone="success">
              <ShieldCheck className="h-3 w-3" /> Can approve applications
            </Pill>
            <Pill tone="success">Can verify documents</Pill>
            <Pill tone="success">Can raise information requests</Pill>
            <Pill tone="neutral">Cannot edit partner company data</Pill>
          </div>
          <button
            type="button"
            onClick={() => {
              signOut();
              navigate({ to: "/" });
            }}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3.5 py-2 text-xs font-medium text-white hover:bg-[var(--brand)]/90"
          >
            <LogOut className="h-3.5 w-3.5" /> Log out of Beldium
          </button>
        </Panel>

        <div className="space-y-4">
          <Panel title="My caseload">
            <div className="space-y-3">
              <ScoreBar label="Cases assigned" value={Math.min(100, mine.length * 20)} suffix={` (${mine.length})`} />
              <ScoreBar label="Open requests" value={Math.min(100, requests.filter((r) => r.status === "Open").length * 20)} suffix="" />
              <ScoreBar label="SLA adherence" value={91} />
            </div>
          </Panel>
          <Panel title="Notification preferences">
            <ul className="space-y-2 text-xs text-[var(--brand)]">
              {["Critical expiry alerts", "New application assignments", "Partner responses", "Weekly risk digest"].map((p) => (
                <li key={p} className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[var(--link)]" /> {p}
                  </span>
                  <Pill tone="success">On</Pill>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
