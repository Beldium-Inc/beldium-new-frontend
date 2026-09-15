import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import { AppShell } from "@/verticals/export/AppShell";
import { useStore } from "@/verticals/export/store";
import { ApplicationStatusPill, DisclaimerNote, FieldGrid, Panel, Pill } from "@/verticals/export/ui-kit";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  EXPORT_DOMAIN_KEYS,
  EXPORT_DOMAIN_LABELS,
  type ExportChecklistState,
  type ExportDomainKey,
  type ExportShipmentStatus,
} from "@/lib/api/export";
import {
  useCloseShipmentNonConformity,
  useCreateShipmentChecklistItem,
  useDecideShipment,
  useRaiseShipmentNonConformity,
  useRespondToShipmentNonConformity,
  useSetShipmentChecklistState,
} from "@/lib/api/export-queries";

export const Route = createFileRoute("/export/shipments/$id")({
  head: () => ({
    meta: [
      { title: "Shipment Review | Beldium Export Compliance" },
      {
        name: "description",
        content: "Compliance checklist, non-conformities and decision record for an export shipment.",
      },
    ],
  }),
  component: ShipmentDetail,
});

const STATUS_FLOW: ExportShipmentStatus[] = ["planned", "ready", "cleared", "shipped"];
const CHECKLIST_STATES: ExportChecklistState[] = ["pass", "open", "fail"];

function ShipmentDetail() {
  const { id } = Route.useParams();
  const { state, user, updateShipmentStatus } = useStore();
  const shipment = state.shipments.find((s) => s.id === id);

  const createChecklistItem = useCreateShipmentChecklistItem();
  const setChecklistState = useSetShipmentChecklistState();
  const raiseNc = useRaiseShipmentNonConformity();
  const respondNc = useRespondToShipmentNonConformity();
  const closeNc = useCloseShipmentNonConformity();
  const decide = useDecideShipment();

  const [ncTitle, setNcTitle] = React.useState("");
  const [ncDetail, setNcDetail] = React.useState("");
  const [ncSeverity, setNcSeverity] = React.useState<"minor" | "major" | "critical">("major");
  const [ncDomain, setNcDomain] = React.useState<ExportDomainKey>("shipment");
  const [checklistLabel, setChecklistLabel] = React.useState("");
  const [checklistDomain, setChecklistDomain] = React.useState<ExportDomainKey>("shipment");
  const [rationale, setRationale] = React.useState("");
  const [conditions, setConditions] = React.useState("");

  if (!shipment)
    return (
      <AppShell title="Shipment not found">
        <Panel>
          <Button asChild>
            <Link to="/export/shipments">Back to shipments</Link>
          </Button>
        </Panel>
      </AppShell>
    );

  const isOperator = user?.role === "operator";
  const exporter = state.exporters.find((e) => e.id === shipment.exporter);
  const product = state.products.find((p) => p.id === shipment.product);
  const buyer = state.buyers.find((b) => b.id === shipment.buyer);
  const application = state.applications.find((a) => a.exporter === shipment.exporter);
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(shipment.status) + 1];

  const checklist = shipment.checklist ?? [];
  const nonConformities = shipment.non_conformities ?? [];
  const blocking = checklist.filter((c) => c.state === "fail");
  const openNc = nonConformities.filter((n) => n.status !== "closed");

  return (
    <AppShell
      title={shipment.reference}
      subtitle={`${product?.name ?? ""} · ${exporter?.name ?? ""}`}
      actions={<Pill tone="neutral">{shipment.status}</Pill>}
    >
      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.45fr]">
        <div className="space-y-4">
          <Panel title="Product">
            <FieldGrid
              fields={[
                { label: "Product", value: product?.name ?? "-" },
                { label: "HS code", value: product?.hs_code ?? "-" },
                { label: "Quantity", value: `${shipment.quantity} ${shipment.unit}` },
                { label: "Estimated value", value: `${shipment.currency} ${Number(shipment.estimated_value).toLocaleString()}` },
              ]}
            />
          </Panel>

          <Panel title="Buyer & destination">
            <FieldGrid
              fields={[
                { label: "Buyer", value: buyer?.name ?? "-" },
                { label: "Buyer country", value: buyer?.country ?? "-" },
                { label: "Destination country", value: shipment.destination_country },
                { label: "Port of loading", value: shipment.port_of_loading },
                { label: "Port of discharge", value: shipment.port_of_discharge },
                { label: "Expected ship date", value: shipment.expected_ship_date },
              ]}
            />
          </Panel>

          <Panel title="Exporter admission status">
            {application ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{exporter?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Compliance score {application.risk.compliance_score} · {application.risk.risk_band} risk
                  </p>
                </div>
                <ApplicationStatusPill status={application.status} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No admission application on file for this exporter.</p>
            )}
            {exporter && (
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link to="/export/exporters/$id" params={{ id: exporter.id }}>
                  Open exporter file
                </Link>
              </Button>
            )}
          </Panel>

          <Panel
            title="Readiness checklist"
            description={
              shipment.readiness != null
                ? `${shipment.readiness}% of checks passed.`
                : "No checklist items yet."
            }
          >
            <div className="space-y-3">
              {checklist.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  {c.state === "pass" ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : c.state === "fail" ? (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  ) : (
                    <CircleDashed className="mt-0.5 size-4 shrink-0 text-warning" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">
                      {c.label} <span className="text-muted-foreground">· {EXPORT_DOMAIN_LABELS[c.domain]}</span>
                    </p>
                    {c.detail && <p className="text-[11px] text-muted-foreground">{c.detail}</p>}
                    {isOperator && (
                      <div className="mt-1 flex gap-1.5">
                        {CHECKLIST_STATES.map((st) => (
                          <button
                            key={st}
                            onClick={() =>
                              setChecklistState.mutate(
                                { shipmentId: shipment.id, itemId: c.id, state: st },
                                { onSuccess: () => toast.success(`${c.label} marked ${st}`) },
                              )
                            }
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
              {checklist.length === 0 && (
                <p className="text-sm text-muted-foreground">No checklist items recorded yet.</p>
              )}
            </div>

            {isOperator && (
              <div className="mt-4 space-y-2 rounded-lg border border-dashed border-border p-3">
                <p className="text-xs font-medium">Add a checklist item</p>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="h-9 rounded-md border border-input bg-card px-2 text-xs"
                    value={checklistDomain}
                    onChange={(e) => setChecklistDomain(e.target.value as ExportDomainKey)}
                  >
                    {EXPORT_DOMAIN_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {EXPORT_DOMAIN_LABELS[k]}
                      </option>
                    ))}
                  </select>
                  <Input
                    className="h-9 flex-1"
                    placeholder="Check label"
                    value={checklistLabel}
                    onChange={(e) => setChecklistLabel(e.target.value)}
                  />
                  <Button
                    size="sm"
                    disabled={!checklistLabel.trim()}
                    onClick={() => {
                      createChecklistItem.mutate(
                        { shipmentId: shipment.id, domain: checklistDomain, label: checklistLabel },
                        {
                          onSuccess: () => {
                            setChecklistLabel("");
                            toast.success("Checklist item added");
                          },
                        },
                      );
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </Panel>

          <Panel
            title="Non-conformities"
            description="Findings raised against this consignment and the exporter's responses."
          >
            <div className="space-y-3">
              {nonConformities.map((n) => (
                <div key={n.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    <Pill tone={n.severity === "critical" ? "danger" : n.severity === "major" ? "warning" : "neutral"}>
                      {n.severity}
                    </Pill>
                    <Pill tone={n.status === "closed" ? "success" : "info"}>{n.status}</Pill>
                    <span className="text-[11px] text-muted-foreground">{EXPORT_DOMAIN_LABELS[n.domain]}</span>
                  </div>
                  {n.detail && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{n.detail}</p>}
                  {n.response && (
                    <p className="mt-2 rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Exporter response:</span> {n.response}
                    </p>
                  )}
                  {isOperator && n.status !== "closed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => {
                        closeNc.mutate(
                          { shipmentId: shipment.id, ncId: n.id },
                          { onSuccess: () => toast.success(`Finding closed`) },
                        );
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
                        respondNc.mutate(
                          {
                            shipmentId: shipment.id,
                            ncId: n.id,
                            response: "Exporter acknowledged the finding and is preparing evidence.",
                          },
                          { onSuccess: () => toast.success("Response submitted to Beldium") },
                        );
                      }}
                    >
                      Respond to finding
                    </Button>
                  )}
                </div>
              ))}
              {nonConformities.length === 0 && (
                <p className="text-sm text-muted-foreground">No non-conformities recorded.</p>
              )}
            </div>

            {isOperator && (
              <div className="mt-4 space-y-3 rounded-lg border border-dashed border-border p-3">
                <p className="text-xs font-medium">Raise a new non-conformity</p>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="h-9 rounded-md border border-input bg-card px-2 text-xs"
                    value={ncDomain}
                    onChange={(e) => setNcDomain(e.target.value as ExportDomainKey)}
                  >
                    {EXPORT_DOMAIN_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {EXPORT_DOMAIN_LABELS[k]}
                      </option>
                    ))}
                  </select>
                  <Input
                    className="h-9 flex-1"
                    placeholder="Finding title"
                    value={ncTitle}
                    onChange={(e) => setNcTitle(e.target.value)}
                  />
                </div>
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
                      raiseNc.mutate(
                        { shipmentId: shipment.id, domain: ncDomain, title: ncTitle, detail: ncDetail, severity: ncSeverity },
                        {
                          onSuccess: () => {
                            setNcTitle("");
                            setNcDetail("");
                            toast.success("Non-conformity raised");
                          },
                        },
                      );
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
          {user?.role === "operator" && nextStatus && (
            <Panel title="Advance shipment">
              <p className="text-xs text-muted-foreground">
                Mark this shipment as <span className="font-medium text-foreground">{nextStatus}</span>.
              </p>
              <Button
                className="mt-3 w-full"
                onClick={() => {
                  updateShipmentStatus(shipment.id, nextStatus);
                  toast.success(`Shipment marked ${nextStatus}`);
                }}
              >
                Mark as {nextStatus}
              </Button>
            </Panel>
          )}

          <Panel title="Compliance decision">
            {shipment.decision_outcome ? (
              <div className="space-y-2">
                <Pill
                  tone={
                    shipment.decision_outcome === "declined"
                      ? "danger"
                      : shipment.decision_outcome === "cleared"
                        ? "success"
                        : "warning"
                  }
                >
                  {shipment.decision_outcome.replace(/_/g, " ")}
                </Pill>
                <p className="text-xs leading-relaxed">{shipment.decision_rationale}</p>
                {shipment.decision_conditions && (
                  <p className="rounded-md bg-warning-soft px-3 py-2 text-xs text-warning">
                    Condition: {shipment.decision_conditions}
                  </p>
                )}
              </div>
            ) : isOperator ? (
              <div className="space-y-3">
                {(blocking.length > 0 || openNc.length > 0) && (
                  <p className="flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2 text-xs text-destructive">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    {blocking.length} blocking check(s) and {openNc.length} open non-conformity(ies) must be
                    resolved before clearance.
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
                      decide.mutate(
                        { shipmentId: shipment.id, outcome: "cleared", rationale },
                        { onSuccess: () => toast.success("Compliance record issued") },
                      );
                    }}
                  >
                    Clear consignment
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!rationale.trim() || !conditions.trim()}
                    onClick={() => {
                      decide.mutate(
                        { shipmentId: shipment.id, outcome: "conditionally_cleared", rationale, conditions },
                        { onSuccess: () => toast.success("Conditional compliance record issued") },
                      );
                    }}
                  >
                    Clear with conditions
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!rationale.trim()}
                    className="text-destructive"
                    onClick={() => {
                      decide.mutate(
                        { shipmentId: shipment.id, outcome: "declined", rationale },
                        { onSuccess: () => toast.error("Consignment declined") },
                      );
                    }}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No decision has been issued yet. Beldium will publish the outcome here once the review closes.
              </p>
            )}
            <DisclaimerNote className="mt-4" />
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
