import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { Switch } from "@/components/ui/switch";
import { Btn, FormField, Modal, fieldCls } from "@/components/beldium/ops-ui";
import { resetOps, setPref, useOps } from "@/lib/ops-store";
import { setState, useOperator } from "@/lib/onboarding-store";

export const Route = createFileRoute("/portal/settings")({
  head: () => ({
    meta: [
      { title: "Settings - Beldium Logistics Hub" },
      { name: "description", content: "Logistics operator profile, notification preferences and demo data controls." },
      { property: "og:title", content: "Settings - Beldium Logistics Hub" },
      { property: "og:description", content: "Configure your Beldium logistics workspace." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const s = useOps();
  const op = useOperator();
  const [confirm, setConfirm] = useState(false);
  const [profile, setProfile] = useState({
    name: op.organisation?.name || "Trans Sahel Haulage Ltd",
    email: op.organisation?.email || "ops@transsahel.ng",
    phone: op.organisation?.phone || "+234 803 000 4412",
    address: op.organisation?.operatingAddress || "14 Ahmadu Bello Way, Kaduna",
  });

  return (
    <>
      <PageHeader title="Settings" />
      <div className="space-y-5">
        <Panel title="Organisation">
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (op.organisation) setState({ organisation: { ...op.organisation, name: profile.name, email: profile.email, phone: profile.phone, operatingAddress: profile.address } });
              toast.success("Organisation profile saved");
            }}
          >
            <FormField label="Organisation name">
              <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={fieldCls} />
            </FormField>
            <FormField label="Operations email">
              <input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className={fieldCls} />
            </FormField>
            <FormField label="Phone">
              <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className={fieldCls} />
            </FormField>
            <FormField label="Operating address">
              <input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className={fieldCls} />
            </FormField>
            <div className="sm:col-span-2">
              <Btn type="submit">Save</Btn>
            </div>
          </form>
        </Panel>

        <Panel title="Notification Preferences">
          <ul className="divide-y divide-border">
            {Object.entries(s.prefs).map(([k, v]) => (
              <li key={k} className="flex items-center justify-between py-2.5 text-sm">
                {k}
                <Switch checked={v} onCheckedChange={(c) => setPref(k, c)} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Demo Data">
          <Btn variant="danger" onClick={() => setConfirm(true)}>
            Reset Demo Data
          </Btn>
        </Panel>
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Reset demo data"
        footer={
          <>
            <Btn variant="outline" onClick={() => setConfirm(false)}>
              Cancel
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                resetOps();
                setConfirm(false);
                toast.success("Demo data restored to the seeded scenario");
              }}
            >
              Reset
            </Btn>
          </>
        }
      >
        <p className="text-sm">All requests, movements, incidents, invoices and notifications return to the seeded scenario.</p>
      </Modal>
    </>
  );
}
