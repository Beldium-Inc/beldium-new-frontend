import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  CircleDashed,
  Flag,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import {
  DisclaimerNote,
  DocStatusPill,
  FieldGrid,
  Panel,
  Pill,
  RiskPill,
  ShipmentStatusPill,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  SECTION_KEYS,
  SECTION_LABELS,
  type DocStatus,
  type SectionKey,
  type Shipment,
} from "@/lib/mock-data";

export const Route = createFileRoute("/shipments/$id")({
  head: () => ({
    meta: [
      { title: "Shipment Review — Beldium Export Compliance" },
      {
        name: "description",
        content:
          "Section-by-section compliance review of a Nigerian mineral export consignment: documents, readiness checklist, risk reasoning and final decision.",
      },
      { property: "og:title", content: "Shipment Review — Beldium Export Compliance" },
      {
        property: "og:description",
        content: "Section-by-section compliance review of a mineral export consignment.",
      },
    ],
  }),
  component: ShipmentDetail,
});

const DOC_ACTIONS: { status: DocStatus; label: string; action: string }[] = [
  { status: "verified", label: "Verify", action: "Document verified" },
  { status: "rejected", label: "Reject", action: "Document rejected" },
  { status: "replacement_requested", label: "Request replacement", action: "Replacement requested" },
  { status: "clarification_requested", label: "Request clarification", action: "Clarification requested" },
];

function ShipmentDetail() {
  const { id } = Route.useParams();
  const { state, user, documentAction, toggleChecklist, raiseNonConformity, updateNonConformity, claimShipment, decide, regulatorAction } =
    useStore();
  const shipment = state.shipments.find((s) => s.id === id);
  const [section, setSection] = React.useState<SectionKey>("overview");
  const [activeDoc, setActiveDoc] = React.useState<string | null>(null);
  const [comment, setComment] = React.useState("");
  const [ncTitle, setNcTitle] = React.useState("");
  const [ncDetail, setNcDetail] = React.useState("");
  const [ncSeverity, setNcSeverity] = React.useState<"minor" | "major" | "critical">("major");
  const [rationale, setRationale] = React.useState("");
  const [conditions, setConditions] = React.useState("");

  if (!shipment) {
    return (
      <AppShell title="Shipment not found">
        <Panel>
          <p className="text-sm text-muted-foreground">This consignment is not in the demo data.</p>
          <Button className="mt-4" asChild>
            <Link to="/shipments">Back to consignments</Link>
          </Button>
        </Panel>
      </AppShell>
    );
  }

  const isOperator = user?.role === "operator";
  const isRegulator = user?.role === "regulator";
  const exporter = state.exporters.find((e) => e.id === shipment.exporterId);
  const verified = shipment.documents.filter((d) => d.status === "verified").length;
  const openNc = shipment.nonConformities.filter((n) => n.status !== "closed");
  const blocking = shipment.checklist.filter((c) => c.state === "fail");
  const readiness = Math.round(
    (shipment.checklist.filter((c) => c.state === "pass").length / shipment.checklist.length) * 100,
  );

  const doAction = (docId: string, s: DocStatus, action: string) => {
    documentAction(shipment.id, docId, s, action, comment);
    toast.success(action);
    setComment("");
    setActiveDoc(null);
  };

  return (
    <AppShell
      title={shipment.reference}
      subtitle={`${shipment.mineral} · ${shipment.quantity} · ${exporter?.name}`}
      actions={
        <div className="flex items-center gap-2">
          <ShipmentStatusPill status={shipment.status} />
          <RiskPill score={shipment.riskScore} band={shipment.riskBand} />
        </div>
      }
    >
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to={isOperator ? "/queue" : "/shipments"}>
            <ArrowLeft className="size-4" /> Back
          </Link>
        </Button>
        {isOperator && shipment.status === "submitted" && (
          <Button
            size="sm"
            onClick={() => {
              claimShipment(shipment.id);
              toast.success("Review started — consignment assigned to you");
            }}
          >
            Claim review
          </Button>
        )}
        {isRegulator && (
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Request information", icon: MessageSquare, action: "Information requested" },
              { label: "Send reminder", icon: Bell, action: "Reminder sent" },
              { label: "Flag consignment", icon: Flag, action: "Shipment flagged" },
              { label: "Acknowledge", icon: CheckCircle2, action: "Acknowledged" },
            ].map((a) => (
              <Button
                key={a.action}
                size="sm"
                variant="outline"
                onClick={() => {
                  regulatorAction(shipment.id, a.action, `Oversight desk: ${a.label.toLowerCase()}.`);
                  toast.success(a.action);
                }}
              >
                <a.icon className="size-4" /> {a.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {isRegulator && (
        <p className="rounded-lg border border-border bg-accent/40 px-4 py-2 text-xs text-accent-foreground">
          Oversight access is read-only. You may request information, send reminders, flag or
          acknowledge — records cannot be edited from this role.
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.45fr]">
        <div className="space-y-4">
          <div className="card-surface overflow-x-auto">
            <div className="flex min-w-max">
              {SECTION_KEYS.map((k) => {
                const active = section === k;
                const sectionBlocked = shipment.checklist.some(
                  (c) => c.section === k && c.state === "fail",
                );
                return (
                  <button
                    key={k}
                    onClick={() => setSection(k)}
                    className={cn(
                      "relative flex items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors",
                      active
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {SECTION_LABELS[k]}
                    {sectionBlocked && <span className="size-1.5 rounded-full bg-destructive" />}
                  </button>
                );
              })}
            </div>
          </div>

          {section === "documents" ? (
            <Panel
              title="Document verification"
              description={`${verified} of ${shipment.documents.length} documents verified.`}
              bodyClassName="p-0"
            >
              <div className="divide-y divide-border">
                {shipment.documents.map((d) => (
                  <div key={d.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{d.name}</p>
                          <DocStatusPill status={d.status} />
                          {d.mandatory ? (
                            <Pill tone="neutral">Mandatory</Pill>
                          ) : (
                            <Pill tone="neutral">Optional</Pill>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {d.category} · {d.issuer} · ref {d.reference} · issued {d.issued}
                          {d.expires ? ` · expires ${d.expires}` : ""}
                        </p>
                        {d.notes.length > 0 && (
                          <ul className="mt-2 space-y-1 border-l-2 border-border pl-3">
                            {d.notes.map((n, i) => (
                              <li key={i} className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">{n.action}</span> ·{" "}
                                {n.by} · {n.at}
                                {n.comment ? ` — ${n.comment}` : ""}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {isOperator && (
                        <Button
                          size="sm"
                          variant={activeDoc === d.id ? "secondary" : "outline"}
                          onClick={() => setActiveDoc(activeDoc === d.id ? null : d.id)}
                        >
                          {activeDoc === d.id ? "Close" : "Review"}
                        </Button>
                      )}
                    </div>
                    {isOperator && activeDoc === d.id && (
                      <div className="mt-3 space-y-3 rounded-lg border border-border bg-secondary/60 p-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Reviewer comment</Label>
                          <Textarea
                            rows={2}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Explain the basis of your decision on this document"
                            className="bg-card"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {DOC_ACTIONS.map((a) => (
                            <Button
                              key={a.status}
                              size="sm"
                              variant={a.status === "verified" ? "default" : "outline"}
                              onClick={() => doAction(d.id, a.status, a.action)}
                            >
                              {a.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          ) : section === "audit" ? (
            <Panel title="Audit trail" description="Every action recorded against this consignment.">
              <ol className="space-y-4">
                {[...shipment.audit].reverse().map((a, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm font-medium">{a.action}</p>
                      <p className="text-xs text-muted-foreground">{a.detail}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {a.actor} · {a.role} · {a.at}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          ) : (
            <Panel
              title={SECTION_LABELS[section]}
              description={`Section evidence for ${shipment.reference}.`}
            >
              {shipment.sections[section]?.length ? (
                <FieldGrid fields={shipment.sections[section]!} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No structured data captured for this section yet.
                </p>
              )}
              {shipment.checklist.filter((c) => c.section === section).length > 0 && (
                <div className="mt-5 space-y-2 border-t border-border pt-4">
                  {shipment.checklist
                    .filter((c) => c.section === section)
                    .map((c) => (
                      <p key={c.id} className="text-xs text-muted-foreground">
                        <span
                          className={cn(
                            "font-medium",
                            c.state === "fail" && "text-destructive",
                            c.state === "pass" && "text-success",
                            c.state === "open" && "text-warning",
                          )}
                        >
                          {c.label}:
                        </span>{" "}
                        {c.detail}
                      </p>
                    ))}
                </div>
              )}
            </Panel>
          )}

          <Panel
            title="Non-conformities"
            description="Findings raised against this consignment and the exporter's responses."
          >
            <div className="space-y-3">
              {shipment.nonConformities.map((n) => (
                <div key={n.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    <Pill
                      tone={
                        n.severity === "critical" ? "danger" : n.severity === "major" ? "warning" : "neutral"
                      }
                    >
                      {n.severity}
                    </Pill>
                    <Pill tone={n.status === "closed" ? "success" : "info"}>{n.status}</Pill>
                    <span className="text-[11px] text-muted-foreground">
                      {n.id} · {SECTION_LABELS[n.section]} · {n.raisedBy} · {n.raisedAt}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{n.detail}</p>
                  {n.response && (
                    <p className="mt-2 rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Exporter response:</span>{" "}
                      {n.response}
                    </p>
                  )}
                  {isOperator && n.status !== "closed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => {
                        updateNonConformity(shipment.id, n.id, { status: "closed" });
                        toast.success(`${n.id} closed`);
                      }}
                    >
                      Close finding
                    </Button>
                  )}
                  {user?.role === "exporter" && n.status === "open" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => {
                        updateNonConformity(shipment.id, n.id, {
                          status: "responded",
                          response: "Exporter acknowledged the finding and is preparing evidence.",
                        });
                        toast.success("Response submitted to Beldium");
                      }}
                    >
                      Respond to finding
                    </Button>
                  )}
                </div>
              ))}
              {shipment.nonConformities.length === 0 && (
                <p className="text-sm text-muted-foreground">No non-conformities recorded.</p>
              )}
            </div>

            {isOperator && (
              <div className="mt-4 space-y-3 rounded-lg border border-dashed border-border p-3">
                <p className="text-xs font-medium">Raise a new non-conformity</p>
                <input
                  className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                  placeholder="Finding title"
                  value={ncTitle}
                  onChange={(e) => setNcTitle(e.target.value)}
                />
                <Textarea
                  rows={2}
                  placeholder="What is wrong, and what must the exporter do?"
                  value={ncDetail}
                  onChange={(e) => setNcDetail(e.target.value)}
                />
                <div className="flex flex-wrap items-center gap-2">
                  {(["minor", "major", "critical"] as const).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setNcSeverity(sev)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        ncSeverity === sev
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {sev}
                    </button>
                  ))}
                  <Button
                    size="sm"
                    className="ml-auto"
                    disabled={!ncTitle.trim()}
                    onClick={() => {
                      raiseNonConformity(shipment.id, {
                        title: ncTitle,
                        detail: ncDetail,
                        severity: ncSeverity,
                        section,
                      });
                      setNcTitle("");
                      setNcDetail("");
                      toast.success("Non-conformity raised");
                    }}
                  >
                    Raise finding
                  </Button>
                </div>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Readiness checklist" description={`${readiness}% of checks passed.`}>
            <div className="space-y-3">
              {shipment.checklist.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  {c.state === "pass" ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : c.state === "fail" ? (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  ) : (
                    <CircleDashed className="mt-0.5 size-4 shrink-0 text-warning" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{c.label}</p>
                    <p className="text-[11px] text-muted-foreground">{c.detail}</p>
                    {isOperator && (
                      <div className="mt-1 flex gap-1.5">
                        {(["pass", "open", "fail"] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => toggleChecklist(shipment.id, c.id, st)}
                            className={cn(
                              "rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase",
                              c.state === st
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-muted-foreground",
                            )}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Risk reasoning" description={`Score ${shipment.riskScore} · ${shipment.riskBand} band.`}>
            <ul className="space-y-3">
              {shipment.riskFactors.map((f) => (
                <li key={f.label}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium">{f.label}</p>
                    <span className="text-xs text-muted-foreground">+{f.weight}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${f.weight * 3}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{f.note}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Compliance decision">
            {shipment.decision ? (
              <div className="space-y-2">
                <Pill tone={shipment.decision.outcome === "declined" ? "danger" : shipment.decision.outcome === "cleared" ? "success" : "warning"}>
                  {shipment.decision.outcome.replace(/_/g, " ")}
                </Pill>
                <p className="text-xs text-muted-foreground">
                  {shipment.decision.by} · {shipment.decision.at}
                </p>
                <p className="text-xs leading-relaxed">{shipment.decision.rationale}</p>
                {shipment.decision.conditions && (
                  <p className="rounded-md bg-warning-soft px-3 py-2 text-xs text-warning">
                    Condition: {shipment.decision.conditions}
                  </p>
                )}
              </div>
            ) : isOperator ? (
              <div className="space-y-3">
                {(blocking.length > 0 || openNc.length > 0) && (
                  <p className="flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2 text-xs text-destructive">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    {blocking.length} blocking check(s) and {openNc.length} open non-conformity(ies)
                    must be resolved before clearance.
                  </p>
                )}
                <Textarea
                  rows={3}
                  placeholder="Decision rationale"
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                />
                <Textarea
                  rows={2}
                  placeholder="Conditions (optional)"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                />
                <div className="grid gap-2">
                  <Button
                    disabled={!rationale.trim() || blocking.length > 0 || openNc.length > 0}
                    onClick={() => {
                      decide(shipment.id, "cleared", rationale);
                      toast.success("Compliance record issued");
                    }}
                  >
                    Clear consignment
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!rationale.trim()}
                    onClick={() => {
                      decide(shipment.id, "conditionally_cleared", rationale, conditions);
                      toast.success("Conditional compliance record issued");
                    }}
                  >
                    Clear with conditions
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!rationale.trim()}
                    className="text-destructive"
                    onClick={() => {
                      decide(shipment.id, "declined", rationale);
                      toast.error("Consignment declined");
                    }}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No decision has been issued yet. Beldium will publish the outcome here once the
                review closes.
              </p>
            )}
            <DisclaimerNote className="mt-4" />
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

export type { Shipment };
