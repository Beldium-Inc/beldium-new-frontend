import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import {
  Field,
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
import {
  createDriver,
  listDrivers,
  listVehicles,
  updateDriver,
  type Driver,
} from "@/lib/api/logistics";
import { useOpsList, useOpsMutation } from "@/lib/api/operations-queries";
import { isEditable, useWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/portal/drivers")({
  head: () => ({ meta: [{ title: "Drivers - Beldium Logistics Hub" }] }),
  component: DriversPage,
});

const validityTone = (v: string) =>
  v === "current" ? "success" : v === "expiring" ? "warning" : "danger";

function DriversPage() {
  // The API only accepts fleet changes while the application is editable
  // (draft, awaiting information, rejected); approved registers are read-only.
  const editable = isEditable(useWorkspace().record?.stage);
  const list = useListQuery({ is_active: "true" });
  const drivers = useOpsList("drivers", listDrivers, list.query);
  const toggle = useOpsMutation((d: Driver) => updateDriver(d.id, { is_active: !d.is_active }));
  const [adding, setAdding] = useState(false);

  const columns: Column<Driver>[] = [
    { header: "Driver", cell: (d) => <span className="font-medium">{d.full_name}</span> },
    // The API withholds licence and medical details from members without edit rights.
    {
      header: "Licence",
      cell: (d) =>
        d.licence_number ? `${d.licence_number} (${d.licence_class})` : d.licence_class,
    },
    { header: "Licence expiry", cell: (d) => fmtDate(d.licence_expiry) },
    { header: "Medical expiry", cell: (d) => fmtDate(d.medical_expiry) },
    { header: "Experience", cell: (d) => `${d.years_experience} yrs` },
    { header: "Training", cell: (d) => d.training.join(", ") || "-" },
    {
      header: "Credentials",
      cell: (d) => (
        <StatusBadge value={pretty(d.credential_status)} tone={validityTone(d.credential_status)} />
      ),
    },
    {
      header: "",
      cell: (d) =>
        !editable ? null : (
          <Button
            size="sm"
            variant="outline"
            disabled={toggle.isPending}
            onClick={() => toggle.mutate(d, { onError: (e) => toast.error(errorMessage(e)) })}
          >
            {d.is_active ? "Deactivate" : "Reactivate"}
          </Button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Drivers"
        description="Drivers cleared to move cargo for your company. Expired licences or medicals block assignment."
        actions={editable ? <Button onClick={() => setAdding(true)}>Add driver</Button> : undefined}
      />
      {!editable ? (
        <div className="mb-4 rounded-md border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
          Your application is approved, so this register is locked. To add, change or retire a
          driver, contact Beldium Logistics Compliance.
        </div>
      ) : null}
      <Panel title="Driver register">
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
          <SearchBox value={list.search} onChange={list.setSearch} placeholder="Driver name" />
          <ResourceTable
            columns={columns}
            data={drivers.data}
            isLoading={drivers.isLoading}
            error={drivers.error}
            page={list.page}
            onPage={list.setPage}
            empty="No drivers."
          />
        </div>
      </Panel>
      {adding ? <AddDriverDialog onClose={() => setAdding(false)} /> : null}
    </>
  );
}

function AddDriverDialog({ onClose }: { onClose: () => void }) {
  const { record } = useWorkspace();
  const vehicles = useOpsList("vehicles", listVehicles, { is_active: true, page_size: 100 });
  const create = useOpsMutation(createDriver);
  const [f, setF] = useState({
    full_name: "",
    licence_number: "",
    licence_class: "E",
    licence_expiry: "",
    national_id: "",
    years_experience: "",
    medical_expiry: "",
    training: "",
    assigned_vehicle: "",
  });
  const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <FormDialog
      open
      onClose={onClose}
      title="Add driver"
      submitLabel="Add driver"
      busy={create.isPending}
      error={error}
      onSubmit={() => {
        if (!record) return setError("Your company record isn't loaded yet.");
        if (!f.full_name || !f.licence_number || !f.licence_expiry || !f.medical_expiry) {
          return setError("Name, licence number, licence expiry and medical expiry are required.");
        }
        create.mutate(
          {
            company: record.companyId,
            full_name: f.full_name,
            licence_number: f.licence_number,
            licence_class: f.licence_class,
            licence_expiry: f.licence_expiry,
            national_id: f.national_id,
            years_experience: Number(f.years_experience) || 0,
            medical_expiry: f.medical_expiry,
            training: f.training
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            assigned_vehicle: f.assigned_vehicle || null,
            is_active: true,
          },
          {
            onSuccess: (d) => {
              toast.success(`${d.full_name} added`);
              onClose();
            },
            onError: (e) => setError(errorMessage(e)),
          },
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <Input value={f.full_name} onChange={set("full_name")} />
        </Field>
        <Field label="National ID (NIN)">
          <Input value={f.national_id} onChange={set("national_id")} />
        </Field>
        <Field label="Licence number">
          <Input value={f.licence_number} onChange={set("licence_number")} />
        </Field>
        <Field label="Licence class">
          <Input value={f.licence_class} onChange={set("licence_class")} />
        </Field>
        <Field label="Licence expiry">
          <Input type="date" value={f.licence_expiry} onChange={set("licence_expiry")} />
        </Field>
        <Field label="Medical expiry">
          <Input type="date" value={f.medical_expiry} onChange={set("medical_expiry")} />
        </Field>
        <Field label="Years of experience">
          <Input
            inputMode="numeric"
            value={f.years_experience}
            onChange={set("years_experience")}
          />
        </Field>
        <Field label="Assigned vehicle">
          <select
            className={fieldCls}
            value={f.assigned_vehicle}
            onChange={set("assigned_vehicle")}
          >
            <option value="">Unassigned</option>
            {(vehicles.data?.results ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.registration}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Training (comma separated)">
        <Input value={f.training} onChange={set("training")} />
      </Field>
    </FormDialog>
  );
}
