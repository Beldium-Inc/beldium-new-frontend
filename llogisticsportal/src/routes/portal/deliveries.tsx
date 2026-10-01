import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import {
  Field,
  FormDialog,
  PillTabs,
  ResourceTable,
  SearchBox,
  errorMessage,
  fmtDateTime,
  pretty,
  useListQuery,
  type Column,
} from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listDeliveries, type Delivery } from "@/lib/api/operations";
import { useCompleteDelivery, useOpsList } from "@/lib/api/operations-queries";

export const Route = createFileRoute("/portal/deliveries")({
  head: () => ({ meta: [{ title: "Deliveries - Beldium Logistics Hub" }] }),
  component: DeliveriesPage,
});

function DeliveriesPage() {
  const list = useListQuery();
  const deliveries = useOpsList("deliveries", listDeliveries, list.query);
  const [completing, setCompleting] = useState<Delivery | null>(null);

  const columns: Column<Delivery>[] = [
    { header: "Delivery", cell: (d) => <span className="font-medium">{d.reference}</span> },
    {
      header: "Movement",
      cell: (d) => (
        <Link
          to="/portal/movements/$movementId"
          params={{ movementId: d.movement }}
          className="text-primary hover:underline"
        >
          {d.movement_reference}
        </Link>
      ),
    },
    { header: "Destination", cell: (d) => `${d.destination} (${pretty(d.destination_type)})` },
    { header: "Expected", cell: (d) => `${d.expected_quantity} ${d.quantity_unit}` },
    {
      header: "Received",
      cell: (d) => (d.received_quantity ? `${d.received_quantity} ${d.quantity_unit}` : "-"),
    },
    {
      header: "Variance",
      cell: (d) =>
        d.variance === null ? (
          "-"
        ) : (
          <span className={Number(d.variance) < 0 ? "text-destructive" : ""}>{d.variance}</span>
        ),
    },
    { header: "Arrived", cell: (d) => fmtDateTime(d.arrived_at) },
    { header: "Status", cell: (d) => <StatusBadge value={pretty(d.status)} /> },
    {
      header: "",
      cell: (d) =>
        d.status === "pending" || d.status === "in_transit" || d.status === "arrived" ? (
          <Button size="sm" variant="outline" onClick={() => setCompleting(d)}>
            Confirm handover
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Deliveries"
        description="Arrivals at laboratories, warehouses, processors and ports. Confirm the received quantity to complete custody transfer."
      />
      <Panel title="Delivery register">
        <div className="space-y-4">
          <PillTabs
            tabs={[
              { value: "", label: "All" },
              { value: "pending", label: "Pending" },
              { value: "in_transit", label: "In transit" },
              { value: "arrived", label: "Arrived" },
              { value: "completed", label: "Completed" },
              { value: "variance_flagged", label: "Variance flagged" },
            ]}
            value={list.filters["status"] ?? ""}
            onChange={(v) => list.setFilter("status", v)}
          />
          <SearchBox
            value={list.search}
            onChange={list.setSearch}
            placeholder="Delivery, movement, transaction, receipt"
          />
          <ResourceTable
            columns={columns}
            data={deliveries.data}
            isLoading={deliveries.isLoading}
            error={deliveries.error}
            page={list.page}
            onPage={list.setPage}
            empty="No deliveries yet."
          />
        </div>
      </Panel>
      {completing ? (
        <CompleteDialog delivery={completing} onClose={() => setCompleting(null)} />
      ) : null}
    </>
  );
}

function CompleteDialog({ delivery, onClose }: { delivery: Delivery; onClose: () => void }) {
  const complete = useCompleteDelivery();
  const [received, setReceived] = useState(delivery.expected_quantity);
  const [receipt, setReceipt] = useState(delivery.receipt_reference);
  const [error, setError] = useState("");

  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Confirm handover · ${delivery.reference}`}
      submitLabel="Complete delivery"
      busy={complete.isPending}
      error={error}
      onSubmit={() => {
        if (!(Number(received) >= 0) || received === "")
          return setError("Enter the received quantity.");
        complete.mutate(
          { id: delivery.id, received_quantity: received, receipt_reference: receipt || undefined },
          {
            onSuccess: (result) => {
              if (result.status === "variance_flagged") {
                toast.warning(
                  `${delivery.reference}: received ${result.received_quantity} ${result.quantity_unit}, expected ${result.expected_quantity}. Variance flagged for review.`,
                );
              } else {
                toast.success(`${delivery.reference} completed`);
              }
              onClose();
            },
            onError: (e) => setError(errorMessage(e)),
          },
        );
      }}
    >
      <p className="text-sm text-muted-foreground">
        Expected {delivery.expected_quantity} {delivery.quantity_unit} at {delivery.destination}.
      </p>
      <Field label={`Received quantity (${delivery.quantity_unit})`}>
        <Input
          type="number"
          step="0.001"
          min="0"
          value={received}
          onChange={(e) => setReceived(e.target.value)}
        />
      </Field>
      <Field label="Receipt / weighbridge reference">
        <Input value={receipt} onChange={(e) => setReceipt(e.target.value)} />
      </Field>
    </FormDialog>
  );
}
