import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Panel, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { useDemo } from "@/verticals/warehousing/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { WarehousingIncidentCategory, WarehousingIncidentSeverity } from "@/lib/api/warehousing";
import { useWarehousingApplicationRequests } from "@/lib/api/warehousing-queries";

export const Route = createFileRoute("/warehousing/operator/incidents")({
  head: () => ({
    meta: [
      { title: "Incidents | Beldium Warehouse Operator" },
      { name: "description", content: "Report and track safety, environmental, security and stock-integrity incidents; respond to reviewer information requests." },
    ],
  }),
  component: IncidentsPage,
});

const CATEGORIES: WarehousingIncidentCategory[] = ["safety", "environmental", "security", "stock_integrity"];
const SEVERITIES: WarehousingIncidentSeverity[] = ["low", "medium", "high"];

function IncidentsPage() {
  const { state, myWarehouse, myApplication, reportIncident, closeIncident, respondToRequest } = useDemo();
  const requests = useWarehousingApplicationRequests(myApplication?.id ?? null);
  const [message, setMessage] = useState<Record<string, string>>({});

  const incidents = state.incidents.filter((i) => i.warehouse === myWarehouse?.id);
  const facilities = state.facilities.filter((f) => f.warehouse === myWarehouse?.id);

  const [form, setForm] = useState({
    title: "",
    category: "safety" as WarehousingIncidentCategory,
    severity: "medium" as WarehousingIncidentSeverity,
    facility: facilities[0]?.id ?? "",
    occurred_on: new Date().toISOString().slice(0, 10),
    location: "",
    description: "",
  });

  return (
    <AppShell role="operator" title="Incidents" subtitle="Report site incidents and respond to reviewer information requests">
      <Panel title="Report an incident" description="Safety, environmental, security and stock-integrity events on site.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Incident title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Input
            placeholder="Location (e.g. Bay A-02, Dock 3)"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />
          <select
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as WarehousingIncidentCategory }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace("_", " ")}</option>
            ))}
          </select>
          <select
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            value={form.severity}
            onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as WarehousingIncidentSeverity }))}
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            value={form.facility}
            onChange={(e) => setForm((f) => ({ ...f, facility: e.target.value }))}
          >
            <option value="">Select facility</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <Input
            type="date"
            value={form.occurred_on}
            onChange={(e) => setForm((f) => ({ ...f, occurred_on: e.target.value }))}
          />
        </div>
        <Textarea
          className="mt-3"
          rows={2}
          placeholder="What happened?"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <Button
          className="mt-3"
          disabled={!form.title.trim() || !form.facility || !myWarehouse}
          onClick={() => {
            reportIncident({
              warehouse: myWarehouse!.id,
              facility: form.facility,
              lot: null,
              title: form.title,
              category: form.category,
              severity: form.severity,
              occurred_on: form.occurred_on,
              location: form.location,
              description: form.description,
            });
            setForm((f) => ({ ...f, title: "", location: "", description: "" }));
            toast.success("Incident reported");
          }}
        >
          Report incident
        </Button>
      </Panel>

      <Panel title="Incident register" className="mt-6">
        <div className="space-y-3">
          {incidents.map((i) => (
            <div key={i.id} className="rounded-xl border border-border/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{i.title}</p>
                <div className="flex gap-2">
                  <StatusPill tone={toneForStatus(i.severity)}>{i.severity}</StatusPill>
                  <StatusPill tone={toneForStatus(i.status)}>{i.status.replace("_", " ")}</StatusPill>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {i.category.replace("_", " ")} · {i.location || "-"} · {i.occurred_on}
              </p>
              {i.description && <p className="mt-1 text-sm text-muted-foreground">{i.description}</p>}
              {i.status !== "closed" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    closeIncident(i.id, "Resolved");
                    toast.success(`${i.title} closed`);
                  }}
                >
                  Close incident
                </Button>
              )}
            </div>
          ))}
          {incidents.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No incidents reported.</p>
          )}
        </div>
      </Panel>

      <Panel title="Information requests" description="Respond with a message; the reviewer decides whether to accept it." className="mt-6">
        <div className="space-y-3">
          {(requests.data ?? []).map((r) => (
            <div key={r.id} className="rounded-xl border border-border/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{r.reason}</p>
                <StatusPill tone={toneForStatus(r.status)}>{r.status}</StatusPill>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{r.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">Due {r.due_date} · items: {r.items.join(", ")}</p>
              {r.status === "open" && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    className="h-9 flex-1 min-w-48 rounded-lg border border-input bg-background px-3 text-sm"
                    placeholder="Your response"
                    value={message[r.id] ?? ""}
                    onChange={(e) => setMessage((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  />
                  <Button
                    className="h-9 rounded-lg bg-link text-xs text-link-foreground hover:bg-link/90"
                    onClick={() => {
                      if (!message[r.id]?.trim()) {
                        toast.error("Write a response first");
                        return;
                      }
                      respondToRequest(r.id, message[r.id]!, []);
                      toast.success("Response submitted");
                    }}
                  >
                    Respond
                  </Button>
                </div>
              )}
            </div>
          ))}
          {(requests.data ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No information requests.</p>
          )}
        </div>
      </Panel>
    </AppShell>
  );
}
