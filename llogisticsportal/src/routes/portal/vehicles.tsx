import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Btn, FormField, IdLink, Modal, QueueView, fieldCls, tabSearch } from "@/components/beldium/ops-ui";
import { addVehicle, docState, useOps, vehicleAvailability, type Vehicle } from "@/lib/ops-store";

export const Route = createFileRoute("/portal/vehicles")({
  validateSearch: tabSearch,
  head: () => ({
    meta: [
      { title: "Vehicles - Beldium Logistics Hub" },
      { name: "description", content: "Vehicle register with insurance, roadworthiness and compliance documents per vehicle." },
      { property: "og:title", content: "Vehicles - Beldium Logistics Hub" },
      { property: "og:description", content: "Register and review every vehicle in the Beldium fleet." },
    ],
  }),
  component: Page,
});

const types = ["Tipper", "Flatbed", "Container Truck", "Sample Van"] as const;

function Page() {
  const s = useOps();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const [add, setAdd] = useState(false);
  const [f, setF] = useState({ registration: "", type: "Tipper" as Vehicle["type"], make: "", capacity: "30", year: "2022" });
  const docOf = (v: Vehicle, type: string) => {
    const d = s.documents.find((x) => x.relatedKind === "Vehicle" && x.relatedId === v.id && x.type === type);
    return d ? docState(d) : "Missing";
  };
  return (
    <>
      <PageHeader title="Vehicles">
        <Btn onClick={() => setAdd(true)}>Add Vehicle</Btn>
      </PageHeader>
      <Panel title="Vehicle Register">
        <QueueView
          rows={s.vehicles}
          getKey={(v) => v.id}
          initialTab={tab ?? "All"}
          tabs={[{ label: "All", test: () => true }, ...types.map((t) => ({ label: t, test: (v: Vehicle) => v.type === t }))]}
          columns={[
            { key: "id", header: "Vehicle", render: (v) => <IdLink kind="vehicle" id={v.id} />, sort: (v) => v.id },
            { key: "reg", header: "Registration", render: (v) => v.registration, sort: (v) => v.registration },
            { key: "make", header: "Make", render: (v) => `${v.make} (${v.year})`, sort: (v) => v.year },
            { key: "cap", header: "Capacity", render: (v) => `${v.capacity} t`, sort: (v) => v.capacity },
            { key: "ins", header: "Insurance", render: (v) => <StatusBadge value={docOf(v, "Insurance")} /> },
            { key: "rw", header: "Roadworthiness", render: (v) => <StatusBadge value={docOf(v, "Roadworthiness")} /> },
            { key: "comp", header: "Compliance", render: (v) => <StatusBadge value={v.compliance} />, sort: (v) => v.compliance },
            { key: "av", header: "Availability", render: (v) => <StatusBadge value={vehicleAvailability(v, s)} /> },
          ]}
          searchText={(v) => `${v.id} ${v.registration} ${v.make}`}
          filters={[{ label: "Compliance", get: (v) => v.compliance }]}
          onOpen={(v) => navigate({ to: "/portal/vehicles/$vehicleId", params: { vehicleId: v.id } })}
        />
      </Panel>
      <Modal
        open={add}
        onClose={() => setAdd(false)}
        title="Add Vehicle"
        footer={
          <>
            <Btn variant="outline" onClick={() => setAdd(false)}>
              Cancel
            </Btn>
            <Btn
              disabled={!f.registration.trim() || !f.make.trim()}
              onClick={() => {
                const id = addVehicle({ registration: f.registration.trim().toUpperCase(), type: f.type, make: f.make.trim(), capacity: Number(f.capacity), year: Number(f.year) });
                toast.success(`${id} submitted for Vehicle Compliance Review`);
                setAdd(false);
                navigate({ to: "/portal/vehicles/$vehicleId", params: { vehicleId: id } });
              }}
            >
              Submit Vehicle
            </Btn>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Registration">
            <input value={f.registration} onChange={(e) => setF({ ...f, registration: e.target.value })} className={fieldCls} placeholder="KDU-000-XX" />
          </FormField>
          <FormField label="Type">
            <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as Vehicle["type"] })} className={fieldCls}>
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Make / model">
            <input value={f.make} onChange={(e) => setF({ ...f, make: e.target.value })} className={fieldCls} />
          </FormField>
          <FormField label="Capacity (t)">
            <input type="number" value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} className={fieldCls} />
          </FormField>
          <FormField label="Year">
            <input type="number" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} className={fieldCls} />
          </FormField>
        </div>
      </Modal>
    </>
  );
}
