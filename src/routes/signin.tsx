import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  FlaskConical,
  Factory,
  Landmark,
  Mountain,
  ShieldCheck,
  Ship,
  Store,
  Truck,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { COMPLIANCE_VERTICALS, homeFor, type Vertical, type VerticalSlug } from "@/lib/verticals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { BeldiumLogo } from "@/components/beldium-logo";

export const Route = createFileRoute("/signin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in | Beldium Compliance" },
      {
        name: "description",
        content:
          "Sign in to Beldium Compliance. Choose your sector, mining, processing, quality, warehousing, logistics, export or marketplace, and the role you hold within it.",
      },
      { property: "og:title", content: "Sign in | Beldium Compliance" },
      {
        property: "og:description",
        content: "One sign-in across all seven Beldium compliance sectors.",
      },
    ],
  }),
  component: SignInPage,
});

const DISCLAIMER =
  "Beldium issues an independent compliance verification record. It is not a government permit, licence, or customs clearance and does not replace any statutory approval.";

const VERTICAL_ICON: Record<VerticalSlug, React.ElementType> = {
  miner: Mountain,
  mining: Mountain,
  processing: Factory,
  export: Ship,
  quality: FlaskConical,
  warehousing: Warehouse,
  logistics: Truck,
  marketplace: Store,
};

const ROLE_ICON: Record<string, React.ElementType> = {
  operator: ShieldCheck,
  partner: ShieldCheck,
  regulator: Landmark,
  admin: Landmark,
  exporter: Ship,
  miner: Mountain,
  buyer: Store,
  offtaker: Boxes,
  oem: Factory,
};

function SignInPage() {
  // Two things happen on submit: the API authenticates the person, and the
  // local session records which dashboard and role they chose to work in.
  const { session, hydrated, signIn: startSession } = useSession();
  const { signIn: authenticate } = useAuth();
  const navigate = useNavigate();

  const [picked, setPicked] = React.useState<Vertical | null>(null);
  const [roleId, setRoleId] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  // Already signed in: go straight back to that workspace.
  React.useEffect(() => {
    if (hydrated && session) {
      navigate({ to: homeFor(session.vertical, session.role) });
    }
  }, [hydrated, session, navigate]);

  const openSector = (vertical: Vertical) => {
    setPicked(vertical);
    setRoleId(vertical.roles[0]!.id);
  };

  const selectRole = (_vertical: Vertical, id: string) => {
    setRoleId(id);
  };

  const submit = async () => {
    if (!picked || !roleId || submitting) return;
    const address = email.trim();
    if (!address.includes("@") || password.length === 0) {
      toast.error("Enter your email address and password.");
      return;
    }

    setSubmitting(true);
    try {
      await authenticate({ email: address, password });
      startSession(picked.slug, roleId);
      navigate({ to: homeFor(picked.slug, roleId) });
    } catch (error) {
      // An unverified account is not a failed password: send them to finish
      // the signup code rather than making them guess at their credentials.
      if (error instanceof ApiError && error.code === "email_not_verified") {
        toast.error("Verify your email address to finish setting up this account.");
        navigate({ to: "/onboarding/verify", search: { email: address } });
        return;
      }
      toast.error(error instanceof ApiError ? error.message : "Sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] gap-10 px-6 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-16">
        <div className="space-y-8">
          <Link to="/" className="flex items-center gap-2.5">
            <BeldiumLogo className="size-10" />
            <div className="leading-tight">
              <p className="font-display text-base font-semibold">Beldium</p>
              <p className="text-xs text-accent/80">Compliance Platform</p>
            </div>
          </Link>

          <div className="space-y-4">
            <h1 className="font-display text-4xl leading-tight font-semibold sm:text-5xl">
              Compliance assurance across the minerals value chain
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-primary-foreground/75">
              Beldium verifies operators, interrogates evidence section by section, and issues an
              independent compliance verification record at every stage, from pit to port.
            </p>
          </div>

          <dl className="grid max-w-lg grid-cols-3 gap-4 border-t border-primary-foreground/15 pt-6">
            {[
              ["7", "Compliance sectors"],
              ["24", "Partner roles"],
              ["1", "Verification standard"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="font-display text-2xl font-semibold text-accent">{v}</dt>
                <dd className="text-xs text-primary-foreground/65">{l}</dd>
              </div>
            ))}
          </dl>

          <p className="max-w-lg rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-3 text-xs leading-relaxed text-primary-foreground/70">
            {DISCLAIMER}
          </p>
        </div>

        <div className="rounded-2xl bg-card p-6 text-card-foreground shadow-raised sm:p-8">
          {picked === null ? (
            <>
              <h2 className="font-display text-xl font-semibold">Sign in to your sector</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose the compliance sector your account belongs to.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {COMPLIANCE_VERTICALS.map((vertical) => {
                  const Icon = VERTICAL_ICON[vertical.slug];
                  return (
                    <button
                      key={vertical.slug}
                      onClick={() => openSector(vertical)}
                      className="group rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-card"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                          <Icon className="size-4.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-sm font-semibold">{vertical.name}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {vertical.tagline}
                          </p>
                          <p className="mt-2 text-[11px] text-muted-foreground/80">
                            {vertical.roles.length} roles
                          </p>
                        </div>
                        <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="mt-7 text-center text-xs text-muted-foreground">
                New to Beldium?{" "}
                <Link to="/onboarding/sector" className="font-medium text-brand underline">
                  Create an account
                </Link>
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setPicked(null);
                  setRoleId(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> All sectors
              </button>
              <h2 className="mt-4 font-display text-xl font-semibold">{picked.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose the role you hold, then sign in. You can sign out and switch at any time.
              </p>

              <div className="mt-6 space-y-3">
                {picked.roles.map((role) => {
                  const Icon = ROLE_ICON[role.id] ?? ShieldCheck;
                  const active = roleId === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => selectRole(picked, role.id)}
                      aria-pressed={active}
                      className={cn(
                        "group w-full rounded-xl border bg-card p-4 text-left transition-all hover:shadow-card",
                        active
                          ? "border-primary bg-accent/30"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <span
                          className={cn(
                            "grid size-10 shrink-0 place-items-center rounded-lg",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-accent text-accent-foreground",
                          )}
                        >
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-sm font-semibold">{role.label}</p>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {role.blurb}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-7 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
                  Keep me signed in
                </label>
                <button
                  className="text-xs font-medium text-brand underline"
                  onClick={() => toast.info("Password reset is not available yet.")}
                >
                  Forgot password?
                </button>
              </div>

              <Button
                className="mt-6 w-full"
                size="lg"
                onClick={() => void submit()}
                disabled={submitting}
              >
                {submitting ? "Signing in…" : `Sign in to ${picked.name}`}
              </Button>

              <p className="mt-5 text-center text-xs text-muted-foreground">
                New to Beldium?{" "}
                <Link to="/onboarding/sector" className="font-medium text-brand underline">
                  Create an account
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
