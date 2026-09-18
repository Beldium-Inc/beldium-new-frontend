import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/miner-shell";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useUpdateCurrentUser } from "@/lib/api/queries";
import { ApiError } from "@/lib/api/errors";
import { formatPhoneNumber } from "@/lib/phone";

const title = "Settings - Beldium Miner Hub";
const description = "Account profile and verification state for the miner workspace.";

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
  const { user, signOut } = useAuth();
  const updateUser = useUpdateCurrentUser();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    phone_number: user?.phone_number ?? "",
  });

  useEffect(() => {
    if (user) {
      setForm({ first_name: user.first_name, last_name: user.last_name, phone_number: user.phone_number });
    }
  }, [user]);

  return (
    <>
      <PageHeader title="Settings" description="Your account profile and verification state." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">Your profile</h2>
          <div className="mt-4 space-y-4">
            {(
              [
                ["first_name", "First name"],
                ["last_name", "Last name"],
                ["phone_number", "Phone number"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                {key === "phone_number" ? (
                  <PhoneInput
                    id={key}
                    value={form[key]}
                    onChange={(v) => setForm((f) => ({ ...f, phone_number: v }))}
                  />
                ) : (
                  <Input
                    id={key}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
            <div className="flex items-center gap-3">
              <Button
                disabled={updateUser.isPending}
                onClick={() => {
                  setError("");
                  updateUser.mutate(
                    { ...form, phone_number: formatPhoneNumber(form.phone_number) },
                    {
                    onError: (cause) => setError(cause instanceof ApiError ? cause.message : "Could not save changes."),
                  });
                }}
              >
                Save changes
              </Button>
              {updateUser.isSuccess ? <StatusChip tone="success">Saved</StatusChip> : null}
              {error ? <span className="text-sm text-destructive">{error}</span> : null}
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-md border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-card-foreground">Verification</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="text-card-foreground">{user?.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Email verified</dt>
                <dd>
                  <StatusChip tone={user?.email_verified_at ? "success" : "warning"}>
                    {user?.email_verified_at ? "Verified" : "Pending"}
                  </StatusChip>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Phone verified</dt>
                <dd>
                  <StatusChip tone={user?.phone_verified_at ? "success" : "warning"}>
                    {user?.phone_verified_at ? "Verified" : "Pending"}
                  </StatusChip>
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-md border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-card-foreground">Session</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign out of the miner workspace on this device.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                void signOut();
                navigate({ to: "/auth" });
              }}
            >
              Sign out
            </Button>
          </section>
        </div>
      </div>
    </>
  );
}
