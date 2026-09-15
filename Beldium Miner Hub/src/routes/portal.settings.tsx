import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleLabel } from "@/lib/miner-data";
import { useMiner } from "@/lib/miner-store";

const title = "Settings — Beldium Miner Hub";
const description = "Account profile, verification state and prototype data controls for the miner workspace.";

export const Route = createFileRoute("/portal/settings")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, updateAccount, resetAll } = useMiner();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    fullName: state.account?.fullName ?? "",
    email: state.account?.email ?? "",
    phone: state.account?.phone ?? "",
    position: state.account?.position ?? "",
  });

  return (
    <>
      <PageHeader title="Settings" description="Prototype account settings stored in this browser only." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">Your profile</h2>
          <div className="mt-4 space-y-4">
            {(
              [
                ["fullName", "Full name"],
                ["email", "Email address"],
                ["phone", "Phone number"],
                ["position", "Position"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={form[key]}
                  onChange={(e) => {
                    setSaved(false);
                    setForm((f) => ({ ...f, [key]: e.target.value }));
                  }}
                />
              </div>
            ))}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  updateAccount(form);
                  setSaved(true);
                }}
              >
                Save changes
              </Button>
              {saved ? <StatusChip tone="success">Saved locally</StatusChip> : null}
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-md border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-card-foreground">Account role & verification</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Role</dt>
                <dd className="text-card-foreground">{state.account ? roleLabel[state.account.role] : "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Email verified</dt>
                <dd>
                  <StatusChip tone={state.account?.emailVerified ? "success" : "warning"}>
                    {state.account?.emailVerified ? "Verified" : "Pending"}
                  </StatusChip>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Phone verified</dt>
                <dd>
                  <StatusChip tone={state.account?.phoneVerified ? "success" : "warning"}>
                    {state.account?.phoneVerified ? "Verified" : "Pending"}
                  </StatusChip>
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-md border border-destructive/40 bg-destructive/5 p-5">
            <h2 className="text-sm font-semibold text-card-foreground">Reset prototype data</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Clears the account, application draft and all seeded operational records stored in this browser, then
              returns you to the start of the journey.
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="mt-4"
              onClick={() => {
                resetAll();
                navigate({ to: "/" });
              }}
            >
              Reset and start over
            </Button>
          </section>
        </div>
      </div>
    </>
  );
}
