import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Lock, ShieldCheck, Warehouse } from "lucide-react";
import { ROLES, type RoleId } from "@/lib/demo/data";
import { useDemo } from "@/lib/demo/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in | Beldium Warehousing Compliance" },
      {
        name: "description",
        content:
          "Role-based sign-in for the Beldium Warehousing Compliance prototype: compliance partner, warehouse operator and regulatory oversight.",
      },
      { property: "og:title", content: "Sign in | Beldium Warehousing Compliance" },
      {
        property: "og:description",
        content: "Choose a demo role to enter the Beldium warehousing compliance workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, roleId } = useDemo();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<RoleId>("partner");
  const role = ROLES.find((r) => r.id === selected)!;

  const enter = () => {
    signIn(selected);
    toast.success(`Signed in as ${role.person}`, { description: role.title });
    navigate({ to: role.home });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between bg-primary px-12 py-14 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-link">
            <Warehouse className="size-5 text-link-foreground" />
          </span>
          <div>
            <p className="font-heading text-lg font-semibold">Beldium</p>
            <p className="text-sm text-secondary/80">Warehousing Compliance</p>
          </div>
        </div>

        <div className="max-w-lg">
          <h1 className="font-heading text-4xl font-semibold leading-tight">
            Warehouse approvals, inspections and continuous monitoring in one control room.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-secondary/85">
            Beldium reviews mineral warehousing operators end to end — corporate standing, facility
            integrity, safety, environment, insurance, inventory controls and security — then keeps
            watching after approval.
          </p>
          <dl className="mt-10 grid grid-cols-3 gap-6">
            {[
              { k: "Live applications", v: "6" },
              { k: "Registered facilities", v: "7" },
              { k: "Open non-conformities", v: "4" },
            ].map((s) => (
              <div key={s.k}>
                <dt className="text-xs uppercase tracking-wide text-secondary/70">{s.k}</dt>
                <dd className="mt-1 font-heading text-3xl font-semibold">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="text-xs text-secondary/70">
          Prototype environment · Sample Nigerian mineral warehousing data · No live regulatory records
        </p>
      </section>

      <section className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-xl">
          <div className="rounded-3xl bg-card p-8 shadow-raised">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-link" />
              Secure demo sign-in
            </div>
            <h2 className="mt-3 font-heading text-2xl font-semibold text-primary">
              Select your role to continue
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {roleId
                ? "You already have an active session — choose a role to re-enter or switch."
                : "Each role opens a different workspace. You can log out or switch roles at any time."}
            </p>

            <div className="mt-6 space-y-3">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelected(r.id)}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition-all",
                    selected === r.id
                      ? "border-link bg-secondary/60 shadow-card"
                      : "border-border bg-card hover:border-link/40 hover:bg-muted/60",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary font-heading text-sm font-semibold text-primary-foreground">
                      {r.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-semibold text-primary">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.org}</p>
                      <p className="mt-1 text-xs leading-relaxed text-foreground/70">{r.blurb}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" readOnly value={role.demoEmail} className="rounded-xl bg-muted/60" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Passcode</Label>
                <Input
                  id="password"
                  type="password"
                  readOnly
                  value="demo-access"
                  className="rounded-xl bg-muted/60"
                />
              </div>
            </div>

            <Button
              onClick={enter}
              className="mt-6 h-12 w-full rounded-xl bg-link text-base text-link-foreground hover:bg-link/90"
            >
              Enter {role.title} workspace
              <ArrowRight className="size-4" />
            </Button>

            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3" />
              Credentials are pre-filled sample values — no authentication service is contacted.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
