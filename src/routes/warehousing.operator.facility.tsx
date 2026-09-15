import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/verticals/warehousing/app-shell";
import { Field, Panel, StatusPill, toneForStatus } from "@/verticals/warehousing/compliance-ui";
import { labelStatus } from "@/verticals/warehousing/data";
import { useDemo } from "@/verticals/warehousing/store";
import type { WarehouseOperator, WarehousingFacility } from "@/lib/api/warehousing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useUpdateWarehouse,
  useUpdateWarehousingFacility,
} from "@/lib/api/warehousing-queries";
import { Pencil } from "lucide-react";

export const Route = createFileRoute("/warehousing/operator/facility")({
  head: () => ({
    meta: [
      { title: "Facility profile | Beldium Warehouse Operator" },
      { name: "description", content: "Facility and operating company profile submitted for warehouse compliance registration." },
    ],
  }),
  component: FacilityPage,
});

function FacilityPage() {
  const { myWarehouse, myApplication, state } = useDemo();
  const facilities = state.facilities.filter((f) => f.warehouse === myWarehouse?.id);

  if (!myWarehouse)
    return (
      <AppShell role="operator" title="Facility profile">
        <Panel title="No warehouse on file">
          <p className="text-sm text-muted-foreground">Your account has no registered warehouse yet.</p>
        </Panel>
      </AppShell>
    );

  return (
    <AppShell role="operator" title="Facility profile" subtitle={myWarehouse.name}>
      <div className="space-y-6">
        <Panel
          title="Operating company"
          description="Registered particulars held on file."
          actions={
            <div className="flex items-center gap-2">
              <StatusPill tone={toneForStatus(myApplication?.status ?? "not_started")}>{labelStatus(myApplication?.status ?? "not_started")}</StatusPill>
              <OperatorEditDialog warehouse={myWarehouse} />
            </div>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Reference" value={myWarehouse.reference} />
            <Field label="Registration number" value={myWarehouse.registration_number} />
            <Field label="Trading name" value={myWarehouse.trading_name || "-"} />
            <Field label="Company type" value={myWarehouse.company_type || "-"} />
            <Field label="Incorporated on" value={myWarehouse.incorporated_on ?? "-"} />
            <Field label="Mineral title" value={myWarehouse.mineral_title || "-"} />
            <Field label="Contact" value={myWarehouse.contact_name} />
            <Field label="Email" value={myWarehouse.contact_email} />
            <Field label="Phone" value={myWarehouse.contact_phone} />
            <Field label="Licence number" value={myWarehouse.warehouse_license_number || "-"} />
            <Field label="Licence expiry" value={myWarehouse.license_expires_on ?? "-"} />
            <Field label="Services" value={myWarehouse.services.join(", ") || "-"} />
            <Field label="Storage categories" value={myWarehouse.storage_categories.join(", ") || "-"} />
            <Field label="Head office address" value={myWarehouse.head_office_address || "-"} />
            <Field label="Bankers" value={myWarehouse.bankers || "-"} />
            <Field label="Annual turnover" value={myWarehouse.annual_turnover || "-"} />
            <Field label="Staff count" value={myWarehouse.staff_count ?? "-"} />
          </div>
          {myWarehouse.directors.length > 0 && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Directors</p>
              <ul className="mt-2 space-y-1">
                {myWarehouse.directors.map((d, i) => (
                  <li key={i} className="text-sm text-foreground">
                    {d.name} ({d.role}) {d.bvn_verified ? "(BVN verified)" : "(BVN unverified)"}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {myWarehouse.shareholding.length > 0 && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Shareholding</p>
              <ul className="mt-2 space-y-1">
                {myWarehouse.shareholding.map((s, i) => (
                  <li key={i} className="text-sm text-foreground">
                    {s.holder} ({s.percent}%)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        {facilities.map((f) => (
          <Panel key={f.id} title={f.name} description={`${f.state}, ${f.country}`} actions={<FacilityEditDialog facility={f} />}>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Type" value={f.facility_type} />
              <Field label="Address" value={f.address} />
              <Field label="Capacity" value={`${Number(f.capacity).toLocaleString()} ${f.capacity_unit}`} />
              <Field label="Coordinates" value={f.coordinates || "-"} />
              <Field label="Land title" value={f.land_title || "-"} />
              <Field label="Built area" value={f.built_area || "-"} />
              <Field label="Bays" value={f.bay_count ?? "-"} />
              <Field label="Loading docks" value={f.loading_dock_count ?? "-"} />
              <Field label="Facility contact" value={f.facility_contact || "-"} />
              <Field label="Fire certificate expiry" value={f.fire_certificate_expires_on ?? "-"} />
              <Field label="Insurance expiry" value={f.insurance_expires_on ?? "-"} />
              <Field label="Active" value={f.is_active ? "Yes" : "No"} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Weighbridge" value={f.weighbridge_details || "-"} />
              <Field label="Laboratory" value={f.laboratory_details || "-"} />
              <Field label="Security" value={f.security_details || "-"} />
              <Field label="Fire system" value={f.fire_system_details || "-"} />
            </div>
          </Panel>
        ))}
        {facilities.length === 0 && (
          <Panel title="No facilities registered">
            <p className="text-sm text-muted-foreground">Add a facility to begin recording storage zones and lots.</p>
          </Panel>
        )}
      </div>
    </AppShell>
  );
}

function OperatorEditDialog({ warehouse }: { warehouse: WarehouseOperator }) {
  const [open, setOpen] = useState(false);
  const updateWarehouse = useUpdateWarehouse();
  const [form, setForm] = useState({
    contact_name: warehouse.contact_name,
    contact_email: warehouse.contact_email,
    contact_phone: warehouse.contact_phone,
    warehouse_license_number: warehouse.warehouse_license_number,
    license_expires_on: warehouse.license_expires_on ?? "",
    trading_name: warehouse.trading_name,
    company_type: warehouse.company_type,
    incorporated_on: warehouse.incorporated_on ?? "",
    mineral_title: warehouse.mineral_title,
    head_office_address: warehouse.head_office_address,
    bankers: warehouse.bankers,
    annual_turnover: warehouse.annual_turnover,
    staff_count: warehouse.staff_count?.toString() ?? "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    void updateWarehouse
      .mutateAsync({
        id: warehouse.id,
        patch: {
          contact_name: form.contact_name,
          contact_email: form.contact_email,
          contact_phone: form.contact_phone,
          warehouse_license_number: form.warehouse_license_number || undefined,
          license_expires_on: form.license_expires_on || null,
        },
      })
      .then(() => {
        toast.success("Operating company profile updated");
        setOpen(false);
      })
      .catch(() => toast.error("Could not update the profile"));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-lg">
          <Pencil className="size-3.5" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit operating company</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Contact name</Label>
            <Input value={form.contact_name} onChange={set("contact_name")} />
          </div>
          <div className="space-y-2">
            <Label>Contact email</Label>
            <Input value={form.contact_email} onChange={set("contact_email")} />
          </div>
          <div className="space-y-2">
            <Label>Contact phone</Label>
            <Input value={form.contact_phone} onChange={set("contact_phone")} />
          </div>
          <div className="space-y-2">
            <Label>Licence number</Label>
            <Input value={form.warehouse_license_number} onChange={set("warehouse_license_number")} />
          </div>
          <div className="space-y-2">
            <Label>Licence expiry</Label>
            <Input type="date" value={form.license_expires_on} onChange={set("license_expires_on")} />
          </div>
          <p className="col-span-full text-xs text-muted-foreground">
            Trading name, incorporation, mineral title and financial particulars are set during registration and
            reviewed by the compliance partner; contact your reviewer to amend them.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={updateWarehouse.isPending} className="bg-link text-link-foreground hover:bg-link/90">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FacilityEditDialog({ facility }: { facility: WarehousingFacility }) {
  const [open, setOpen] = useState(false);
  const updateFacility = useUpdateWarehousingFacility();
  const [form, setForm] = useState({
    coordinates: facility.coordinates,
    land_title: facility.land_title,
    built_area: facility.built_area,
    bay_count: facility.bay_count?.toString() ?? "",
    loading_dock_count: facility.loading_dock_count?.toString() ?? "",
    facility_contact: facility.facility_contact,
    weighbridge_details: facility.weighbridge_details,
    laboratory_details: facility.laboratory_details,
    security_details: facility.security_details,
    fire_system_details: facility.fire_system_details,
    fire_certificate_expires_on: facility.fire_certificate_expires_on ?? "",
    insurance_expires_on: facility.insurance_expires_on ?? "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    void updateFacility
      .mutateAsync({
        id: facility.id,
        patch: {
          coordinates: form.coordinates,
          land_title: form.land_title,
          built_area: form.built_area,
          bay_count: form.bay_count ? Number(form.bay_count) : null,
          loading_dock_count: form.loading_dock_count ? Number(form.loading_dock_count) : null,
          facility_contact: form.facility_contact,
          weighbridge_details: form.weighbridge_details,
          laboratory_details: form.laboratory_details,
          security_details: form.security_details,
          fire_system_details: form.fire_system_details,
          fire_certificate_expires_on: form.fire_certificate_expires_on || null,
          insurance_expires_on: form.insurance_expires_on || null,
        },
      })
      .then(() => {
        toast.success("Facility profile updated");
        setOpen(false);
      })
      .catch(() => toast.error("Could not update the facility"));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-lg">
          <Pencil className="size-3.5" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit facility: {facility.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Coordinates</Label>
            <Input value={form.coordinates} onChange={set("coordinates")} placeholder="lat, lng" />
          </div>
          <div className="space-y-2">
            <Label>Land title</Label>
            <Input value={form.land_title} onChange={set("land_title")} />
          </div>
          <div className="space-y-2">
            <Label>Built area</Label>
            <Input value={form.built_area} onChange={set("built_area")} placeholder="e.g. 4,500 sqm" />
          </div>
          <div className="space-y-2">
            <Label>Facility contact</Label>
            <Input value={form.facility_contact} onChange={set("facility_contact")} />
          </div>
          <div className="space-y-2">
            <Label>Bay count</Label>
            <Input type="number" value={form.bay_count} onChange={set("bay_count")} />
          </div>
          <div className="space-y-2">
            <Label>Loading dock count</Label>
            <Input type="number" value={form.loading_dock_count} onChange={set("loading_dock_count")} />
          </div>
          <div className="space-y-2">
            <Label>Fire certificate expiry</Label>
            <Input type="date" value={form.fire_certificate_expires_on} onChange={set("fire_certificate_expires_on")} />
          </div>
          <div className="space-y-2">
            <Label>Insurance expiry</Label>
            <Input type="date" value={form.insurance_expires_on} onChange={set("insurance_expires_on")} />
          </div>
          <div className="col-span-full space-y-2">
            <Label>Weighbridge details</Label>
            <Textarea value={form.weighbridge_details} onChange={set("weighbridge_details")} rows={2} />
          </div>
          <div className="col-span-full space-y-2">
            <Label>Laboratory details</Label>
            <Textarea value={form.laboratory_details} onChange={set("laboratory_details")} rows={2} />
          </div>
          <div className="col-span-full space-y-2">
            <Label>Security details</Label>
            <Textarea value={form.security_details} onChange={set("security_details")} rows={2} />
          </div>
          <div className="col-span-full space-y-2">
            <Label>Fire system details</Label>
            <Textarea value={form.fire_system_details} onChange={set("fire_system_details")} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={updateFacility.isPending} className="bg-link text-link-foreground hover:bg-link/90">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
