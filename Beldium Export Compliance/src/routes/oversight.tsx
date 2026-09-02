import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bell, Flag, MessageSquare, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { DisclaimerNote, Panel, Pill, RiskPill, ShipmentStatusPill, Stat } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/oversight")({
  head: () => ({
    meta: [
      { title: "Regulatory Oversight — Beldium Export Compliance" },
      {
        name: "description",
        content:
          "Read-only oversight of Nigerian mineral export compliance activity with request-information, reminder, flag and acknowledge actions.",
      },
      { property: "og:title", content: "Regulatory Oversight — Beldium Export Compliance" },
      { property: "og:description", content: "Read-only oversight of mineral export compliance activity." },
    ],
  }),
  component: OversightPage,
});

function OversightPage() {
  const { state, regulatorAction } = useStore();
  const cleared = state.shipments.filter((s) => s.status === "cleared" || s.status === "conditionally_cleared");
  const highRisk = state.shipments.filter((s) => s.riskBand === "high");
  const openNc = state.shipments.flatMap((s) => s.nonConformities.filter((n) => n.status !== "closed"));

  return (
    <AppShell title="Regulatory oversight" subtitle="Read-only visibility across Beldium compliance activity">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Consignments monitored" value={state.shipments.length} hint="All exporters" />
        <Stat label="Records issued" value={cleared.length} tone="success" hint="Cleared or conditional" />
        <Stat label="High risk" value={highRisk.length} tone="danger" hint="Escalated by Beldium" />
        <Stat label="Open findings" value={openNc.length} tone="warning" hint="Across all consignments" />
      </div>

      <Panel
        title="Consignment register"
        description="Oversight users can view records and request action, but cannot edit them."
        bodyClassName="p-0"
      >
        <div className="divide-y divide-border">
          {state.shipments.map((s) => {
            const exporter = state.exporters.find((e) => e.id === s.exporterId);
            return (
              <div key={s.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to="/shipments/$id" params={{ id: s.id }} className="font-display text-sm font-semibold hover:underline">
                      {s.reference}
                    </Link>
                    <ShipmentStatusPill status={s.status} />
                    <RiskPill score={s.riskScore} band={s.riskBand} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {exporter?.name} · {s.mineral} · {s.quantity} · {s.destination} · ETD {s.etd}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Request info", icon: MessageSquare, action: "Information requested" },
                    { label: "Reminder", icon: Bell, action: "Reminder sent" },
                    { label: "Flag", icon: Flag, action: "Shipment flagged" },
                    { label: "Acknowledge", icon: ShieldCheck, action: "Acknowledged" },
                  ].map((a) => (
                    <Button
                      key={a.action}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        regulatorAction(s.id, a.action, `Oversight desk: ${a.label.toLowerCase()}.`);
                        toast.success(`${a.action} — ${s.reference}`);
                      }}
                    >
                      <a.icon className="size-3.5" /> {a.label}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Open findings raised by Beldium">
          <ul className="space-y-3">
            {openNc.map((n) => (
              <li key={n.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  <Pill tone={n.severity === "critical" ? "danger" : n.severity === "major" ? "warning" : "neutral"}>
                    {n.severity}
                  </Pill>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{n.detail}</p>
              </li>
            ))}
            {openNc.length === 0 && <li className="text-sm text-muted-foreground">No open findings.</li>}
          </ul>
        </Panel>
        <Panel title="Scope of this view">
          <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <li>View compliance records, evidence sections and audit trails.</li>
            <li>Request information, send reminders, flag consignments and acknowledge records.</li>
            <li>No editing of exporter records, documents, checklists or decisions.</li>
          </ul>
          <DisclaimerNote className="mt-4" />
        </Panel>
      </div>
    </AppShell>
  );
}
