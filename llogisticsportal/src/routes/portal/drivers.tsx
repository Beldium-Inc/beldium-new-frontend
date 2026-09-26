import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Btn, FormField, IdLink, Modal, QueueView, fieldCls, tabSearch } from "@/components/beldium/ops-ui";
import { addDriver, driverAvailability, driverBlock, fmtDate, useOps, type Driver } from "@/lib/ops-store";

export const Route = createFileRoute("/portal/drivers")({
  validateSearch: tabSearch,
  head: () => ({
    meta: [
      { title: "Drivers - Beldium Logistics Hub" },
      { name: "description", content: "Driver queues: available, assigned, on journey, off duty and compliance hold." },
      { property: "og:title", content: "Drivers - Beldium Logistics Hub" },
      { property: "og:description", content: "Driver readiness for Beldium movement assignment." },
    ],
  }),
  component: Page,
});

function Page() {
  const s = useOps();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const [add, setAdd] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", licence: "", licenceClass: "Class E (HGV)", licenceExpiry: "" });
  const av = (d: Driver) => driverAvailability(d, s);
  return (
    <>
      <PageHeader title="Drivers">
        <Btn onClick={() => setAdd(true)}>Add Driver</Btn>
      </PageHeader>
      <Panel title="Driver Queue">
        <QueueView
          rows={s.drivers}
          getKey={(d) => d.id}
          initialTab={tab ?? "Available"}
          tabs={["All", "Available", "Assigned", "On Journey", "Off Duty", "Compliance Hold"].map((l) => ({ label: l, test: (d: Driver) => l === "All" || av(d) === l }))}
          columns={[
            { key: "id", header: "Driver", render: (d) => <IdLink kind="driver" id={d.id} />, sort: (d) => d.id },
            { key: "name", header: "Name", render: (d) => d.name, sort: (d) => d.name },
            { key: "phone", header: "Phone", render: (d) => <span className="beldium-mono">{d.phone}</span> },
            { key: "lic", header: "Licence", render: (d) => `${d.licence} · ${d.licenceClass}` },
            { key: "exp", header: "Licence expiry", render: (d) => fmtDate(d.licenceExpiry), sort: (d) => d.licenceExpiry },
            { key: "job", header: "Current job", render: (d) => (d.movementId ? <IdLink kind="movement" id={d.movementId} /> : "-") },
            { key: "train", header: "Training", render: (d) => d.training.join(", ") || "-" },
            { key: "safety", header: "Safety", render: (d) => d.safetyScore, sort: (d) => d.safetyScore },
            { key: "comp", header: "Compliance", render: (d) => <StatusBadge value={driverBlock(s, d) ? "Restricted" : "Cleared"} /> },
            { key: "av", header: "Availability", render: (d) => <StatusBadge value={av(d)} />, sort: av },
          ]}
          searchText={(d) => `${d.id} ${d.name} ${d.licence} ${d.phone}`}
          filters={[{ label: "Licence class", get: (d) => d.licenceClass }]}
          onOpen={(d) => navigate({ to: "/portal/drivers/$driverId", params: { driverId: d.id } })}
        />
      </Panel>
      <Modal
        open={add}
        onClose={() => setAdd(false)}
        title="Add Driver"
        footer={
          <>
            <Btn variant="outline" onClick={() => setAdd(false)}>
              Cancel
            </Btn>
            <Btn
              disabled={!f.name.trim() || !f.licence.trim() || !f.licenceExpiry}
              onClick={() => {
                const id = addDriver({ ...f, name: f.name.trim(), licence: f.licence.trim() });
                toast.success(`${id} submitted for Driver Compliance Review`);
                setAdd(false);
                navigate({ to: "/portal/drivers/$driverId", params: { driverId: id } });
              }}
            >
              Submit Driver
            </Btn>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Full name">
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={fieldCls} />
          </FormField>
          <FormField label="Phone">
            <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={fieldCls} placeholder="+234" />
          </FormField>
          <FormField label="Licence number">
            <input value={f.licence} onChange={(e) => setF({ ...f, licence: e.target.value })} className={fieldCls} />
          </FormField>
          <FormField label="Licence class">
            <select value={f.licenceClass} onChange={(e) => setF({ ...f, licenceClass: e.target.value })} className={fieldCls}>
              <option>Class E (HGV)</option>
              <option>Class B</option>
            </select>
          </FormField>
          <FormField label="Licence expiry">
            <input type="date" value={f.licenceExpiry} onChange={(e) => setF({ ...f, licenceExpiry: e.target.value })} className={fieldCls} />
          </FormField>
        </div>
      </Modal>
    </>
  );
}
