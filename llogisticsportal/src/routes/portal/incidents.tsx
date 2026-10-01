import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import {
  Field,
  FilterSelect,
  FormDialog,
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
import { Textarea } from "@/components/ui/textarea";
import { listIncidents, type Incident } from "@/lib/api/operations";
import { useOpsList, useResolveIncident } from "@/lib/api/operations-queries";

export const Route = createFileRoute("/portal/incidents")({
  head: () => ({ meta: [{ title: "Incidents - Beldium Logistics Hub" }] }),
  component: IncidentsPage,
});

const isResolved = (i: Incident) => i.status === "resolved" || i.status === "closed";
const severityTone = (s: string) =>
  s === "critical" || s === "high" ? "danger" : s === "medium" ? "warning" : "default";

function IncidentsPage() {
  const list = useListQuery();
  const incidents = useOpsList("incidents", listIncidents, list.query);
  const [resolving, setResolving] = useState<Incident | null>(null);

  const columns: Column<Incident>[] = [
    { header: "Incident", cell: (i) => <span className="font-medium">{i.reference}</span> },
    {
      header: "Movement",
      cell: (i) =>
        i.movement ? (
          <Link
            to="/portal/movements/$movementId"
            params={{ movementId: i.movement }}
            className="text-primary hover:underline"
          >
            {i.movement_reference}
          </Link>
        ) : (
          "-"
        ),
    },
    { header: "Type", cell: (i) => i.incident_type },
    {
      header: "Severity",
      cell: (i) => <StatusBadge value={pretty(i.severity)} tone={severityTone(i.severity)} />,
    },
    {
      header: "Vehicle / driver",
      cell: (i) => `${i.vehicle_registration ?? "-"} / ${i.driver_name ?? "-"}`,
    },
    { header: "Location", cell: (i) => i.location || "-" },
    { header: "Occurred", cell: (i) => fmtDateTime(i.occurred_at) },
    { header: "Status", cell: (i) => <StatusBadge value={pretty(i.status)} /> },
    {
      header: "",
      cell: (i) =>
        isResolved(i) ? null : (
          <Button size="sm" variant="outline" onClick={() => setResolving(i)}>
            Resolve
          </Button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Incidents"
        description="Breakdowns, delays, losses and security events on your movements. Report new incidents from the movement page."
      />
      <Panel title="Incident register">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <SearchBox
              value={list.search}
              onChange={list.setSearch}
              placeholder="Reference, description, location, movement"
            />
            <FilterSelect
              label="Severity"
              value={list.filters["severity"] ?? ""}
              options={["low", "medium", "high", "critical"]}
              onChange={(v) => list.setFilter("severity", v)}
            />
          </div>
          <ResourceTable
            columns={columns}
            data={incidents.data}
            isLoading={incidents.isLoading}
            error={incidents.error}
            page={list.page}
            onPage={list.setPage}
            empty="No incidents recorded."
          />
        </div>
      </Panel>
      {resolving ? <ResolveDialog incident={resolving} onClose={() => setResolving(null)} /> : null}
    </>
  );
}

function ResolveDialog({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  const resolve = useResolveIncident();
  const [resolution, setResolution] = useState("");
  const [error, setError] = useState("");
  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Resolve ${incident.reference}`}
      submitLabel="Resolve incident"
      busy={resolve.isPending}
      error={error}
      onSubmit={() => {
        if (!resolution.trim()) return setError("Describe how the incident was resolved.");
        resolve.mutate(
          { id: incident.id, resolution: resolution.trim() },
          {
            onSuccess: () => {
              toast.success(`${incident.reference} resolved`);
              onClose();
            },
            onError: (e) => setError(errorMessage(e)),
          },
        );
      }}
    >
      <p className="text-sm text-muted-foreground">{incident.description}</p>
      <Field label="Resolution">
        <Textarea rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} />
      </Field>
    </FormDialog>
  );
}
