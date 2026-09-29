import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import {
  Field,
  FilterSelect,
  FormDialog,
  PillTabs,
  ResourceTable,
  SearchBox,
  errorMessage,
  fieldCls,
  fmtDate,
  pretty,
  useListQuery,
  type Column,
} from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createVehicle, listVehicles, updateVehicle, type Vehicle } from "@/lib/api/logistics";
import { useOpsList, useOpsMutation } from "@/lib/api/operations-queries";
import { isEditable, useWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/portal/vehicles")({
  head: () => ({ meta: [{ title: "Vehicles - Beldium Logistics Hub" }] }),
  component: VehiclesPage,
});

const validityTone = (v: string) =>
  v === "current" ? "success" : v === "expiring" ? "warning" : "danger";

function VehiclesPage() {
  // The API only accepts fleet changes while the application is editable
  // (draft, awaiting information, rejected); approved registers are read-only.
  const editable = isEditable(useWorkspace().record?.stage);
  const list = useListQuery({ is_active: "true" });
  const vehicles = useOpsList("vehicles", listVehicles, list.query);
  const toggle = useOpsMutation((v: Vehicle) => updateVehicle(v.id, { is_active: !v.is_active }));
  const [adding, setAdding] = useState(false);

  const columns: Column<Vehicle>[] = [
    { header: "Registration", cell: (v) => <span className="font-medium">{v.registration}</span> },
    { header: "Type", cell: (v) => v.vehicle_type },
    { header: "Make / model", cell: (v) => `${v.make} ${v.model} (${v.year})` },
    { header: "Capacity", cell: (v) => `${v.capacity} ${v.capacity_unit}` },
    { header: "Insurance", cell: (v) => fmtDate(v.insurance_expiry) },
    { header: "Roadworthiness", cell: (v) => fmtDate(v.roadworthiness_expiry) },
    { header: "GPS", cell: (v) => pretty(v.gps_status) },
    {
      header: "Credentials",
      cell: (v) => (
        <StatusBadge value={pretty(v.credential_status)} tone={validityTone(v.credential_status)} />
      ),
    },
    {
      header: "",
      cell: (v) =>
        !editable ? null : (
          <Button
            size="sm"
            variant="outline"
            disabled={toggle.isPending}
            onClick={() => toggle.mutate(v, { onError: (e) => toast.error(errorMessage(e)) })}
          >
            {v.is_active ? "Deactivate" : "Reactivate"}
          </Button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Vehicles"
        description="Your registered fleet. Vehicles with expired insurance or roadworthiness can't be assigned to movements."
        actions={
          editable ? <Button onClick={() => setAdding(true)}>Add vehicle</Button> : undefined
        }
      />
      {!editable ? (
        <div className="mb-4 rounded-md border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
          Your application is approved, so this register is locked. To add, change or retire a
          vehicle, contact Beldium Logistics Compliance.
        </div>
      ) : null}
      <Panel title="Fleet register">
        <div className="space-y-4">
          <PillTabs
            tabs={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
              { value: "", label: "All" },
            ]}
            value={list.filters["is_active"] ?? ""}
            onChange={(v) => list.setFilter("is_active", v)}
          />
          <div className="flex flex-wrap gap-2">
            <SearchBox
              value={list.search}
              onChange={list.setSearch}
              placeholder="Registration, VIN, make, model"
            />
            <FilterSelect
              label="GPS"
              value={list.filters["gps_status"] ?? ""}
              options={["active", "intermittent", "inactive", "unknown"]}
              onChange={(v) => list.setFilter("gps_status", v)}
            />
          </div>
          <ResourceTable
            columns={columns}
            data={vehicles.data}
            isLoading={vehicles.isLoading}
            error={vehicles.error}
            page={list.page}
            onPage={list.setPage}
            empty="No vehicles."
          />
        </div>
      </Panel>
      {adding ? <AddVehicleDialog onClose={() => setAdding(false)} /> : null}
    </>
  );
}

function AddVehicleDialog({ onClose }: { onClose: () => void }) {
  const { record } = useWorkspace();
  const create = useOpsMutation(createVehicle);
  const [f, setF] = useState({
    registration: "",
    vin: "",
    vehicle_type: "Tipper",
    make: "",
    model: "",
    year: "",
    capacity: "",
    ownership: "owned" as Vehicle["ownership"],
    insurer: "",
    insurance_expiry: "",
    roadworthiness_expiry: "",
    gps_status: "unknown" as Vehicle["gps_status"],
  });
  const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <FormDialog
      open
      onClose={onClose}
      title="Add vehicle"
      submitLabel="Add vehicle"
      busy={create.isPending}
      error={error}
      onSubmit={() => {
        if (!record) return setError("Your company record isn't loaded yet.");
        if (
          !f.registration ||
          !f.vin ||
          !f.year ||
          !f.capacity ||
          !f.insurance_expiry ||
          !f.roadworthiness_expiry
        ) {
          return setError("Registration, VIN, year, capacity and both expiry dates are required.");
        }
        create.mutate(
          {
            ...f,
            company: record.companyId,
            year: Number(f.year),
            capacity_unit: "tonnes",
            location: "",
            is_active: true,
          },
          {
            onSuccess: (v) => {
              toast.success(`${v.registration} added`);
              onClose();
            },
            onError: (e) => setError(errorMessage(e)),
          },
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Registration">
          <Input value={f.registration} onChange={set("registration")} />
        </Field>
        <Field label="VIN / chassis">
          <Input value={f.vin} onChange={set("vin")} />
        </Field>
        <Field label="Type">
          <select className={fieldCls} value={f.vehicle_type} onChange={set("vehicle_type")}>
            {[
              "Tipper",
              "Flatbed",
              "Tanker",
              "Container truck",
              "Pickup / Van",
              "Motorcycle courier",
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Ownership">
          <select className={fieldCls} value={f.ownership} onChange={set("ownership")}>
            <option value="owned">Owned</option>
            <option value="leased">Leased</option>
            <option value="contracted">Contracted</option>
          </select>
        </Field>
        <Field label="Make">
          <Input value={f.make} onChange={set("make")} />
        </Field>
        <Field label="Model">
          <Input value={f.model} onChange={set("model")} />
        </Field>
        <Field label="Year">
          <Input inputMode="numeric" value={f.year} onChange={set("year")} />
        </Field>
        <Field label="Capacity (t)">
          <Input inputMode="decimal" value={f.capacity} onChange={set("capacity")} />
        </Field>
        <Field label="Insurer">
          <Input value={f.insurer} onChange={set("insurer")} />
        </Field>
        <Field label="GPS">
          <select className={fieldCls} value={f.gps_status} onChange={set("gps_status")}>
            {["unknown", "active", "intermittent", "inactive"].map((g) => (
              <option key={g} value={g}>
                {pretty(g)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Insurance expiry">
          <Input type="date" value={f.insurance_expiry} onChange={set("insurance_expiry")} />
        </Field>
        <Field label="Roadworthiness expiry">
          <Input
            type="date"
            value={f.roadworthiness_expiry}
            onChange={set("roadworthiness_expiry")}
          />
        </Field>
      </div>
    </FormDialog>
  );
}
