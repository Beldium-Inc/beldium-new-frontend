import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Field, FieldGrid, errorMessage } from "@/components/beldium/ops";
import { PageHeader } from "@/components/beldium/shell";
import { Panel } from "@/components/beldium/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  useJoinCode,
  useMyOrganisations,
  useRotateJoinCode,
  useUpdateCurrentUser,
} from "@/lib/api/queries";
import { useAuth } from "@/lib/auth";
import { TwoStepSettings } from "@/components/two-step-settings";
import { formatJoinCode } from "@/lib/join-code";
import { formatPhoneNumber, isValidPhoneNumber } from "@/lib/phone";
import { useWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/portal/settings")({
  head: () => ({ meta: [{ title: "Settings - Beldium Logistics Hub" }] }),
  component: SettingsPage,
});

/** Administrators of an organisation see its join code so they can share it. */
function JoinCodePanel() {
  const orgs = useMyOrganisations();
  const admin = orgs.data?.results.find((o) => o.my_role === "owner" || o.my_role === "admin");
  const code = useJoinCode(admin?.id ?? null);
  const rotate = useRotateJoinCode(admin?.id ?? "");
  if (!admin) return null;
  const current = rotate.data ?? code.data;

  return (
    <Panel
      title="Invite colleagues"
      description={`Share this code so people can ask to join ${admin.name}. Organisations under review can use it too.`}
    >
      <div className="flex flex-wrap items-center gap-4">
        <span className="font-mono text-2xl tracking-[0.25em]">
          {current ? formatJoinCode(current.join_code) : "…"}
        </span>
        <Button
          variant="outline"
          disabled={!current}
          onClick={() => {
            if (!current) return;
            void navigator.clipboard.writeText(formatJoinCode(current.join_code));
            toast.success("Join code copied");
          }}
        >
          Copy code
        </Button>
        <Button
          variant="ghost"
          disabled={rotate.isPending}
          onClick={() => {
            if (!window.confirm("Create a new code? The old code will stop working.")) return;
            rotate.mutate(undefined, {
              onSuccess: () => toast.success("New join code created"),
              onError: (e) => toast.error(errorMessage(e)),
            });
          }}
        >
          Create new code
        </Button>
      </div>
    </Panel>
  );
}

function SettingsPage() {
  const { user } = useAuth();
  const { record } = useWorkspace();
  const update = useUpdateCurrentUser();
  const [form, setForm] = useState({ first_name: "", last_name: "", phone_number: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (user)
      setForm({
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
      });
  }, [user]);

  function save() {
    setError("");
    const phone = formatPhoneNumber(form.phone_number);
    if (form.phone_number && !isValidPhoneNumber(phone))
      return setError("Enter a complete phone number.");
    update.mutate(
      { ...form, phone_number: phone },
      {
        onSuccess: () => toast.success("Profile saved"),
        onError: (e) => setError(errorMessage(e)),
      },
    );
  }

  return (
    <>
      <PageHeader title="Settings" description="Your profile and organisation record." />
      <div className="space-y-4">
        <Panel title="Your profile">
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <Field label="First name">
              <Input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </Field>
            <Field label="Last name">
              <Input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </Field>
            <Field label="Mobile number">
              <PhoneInput
                value={form.phone_number}
                onChange={(v) => setForm({ ...form, phone_number: v })}
              />
            </Field>
            <Field label="Email">
              <Input value={user?.email ?? ""} disabled />
            </Field>
          </div>
          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
          <Button className="mt-5" onClick={save} disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save profile"}
          </Button>
        </Panel>
        <Panel title="Organisation">
          <FieldGrid
            items={[
              ["Organisation", record?.organisationName],
              ["Beldium Logistics ID", record?.reference],
              ["Verification", record?.statusLabel],
              ["Permitted services", record?.permittedScopes.join(", ")],
            ]}
          />
        </Panel>
        <JoinCodePanel />
        {user ? <TwoStepSettings email={user.email} /> : null}
      </div>
    </>
  );
}
