import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell, OptionCard } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { users } from "@/lib/prototype/data";
import { useStore } from "@/lib/prototype/store";
import type { Role } from "@/lib/prototype/types";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in · Beldium Mining Compliance" },
      {
        name: "description",
        content: "Sign in to the Beldium mining compliance workspace as a compliance partner or regulatory oversight user.",
      },
      { property: "og:title", content: "Sign in · Beldium Mining Compliance" },
      { property: "og:description", content: "Universal sign-in for the Beldium mining compliance platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignInPage,
});

const demoRoles: { role: Role; title: string; blurb: string }[] = [
  {
    role: "partner",
    title: "Mining Compliance",
    blurb: "Full review workspace: applications, mine reviews, scoring, inspections and reporting.",
  },
  {
    role: "regulator",
    title: "Regulatory / Oversight",
    blurb: "Read-mostly oversight of the register, licences, inspections and alerts.",
  },
];

function SignInPage() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Role>("partner");
  const [email, setEmail] = useState("partner@beldium.demo");
  const [password, setPassword] = useState("demo-prototype");
  const [remember, setRemember] = useState(true);

  const signIn = () => {
    if (!email.includes("@") || password.length < 4) {
      toast.error("Enter your email and password.");
      return;
    }
    login(selected);
    navigate({ to: "/app/dashboard" });
  };

  return (
    <AuthShell
      title="Sign in to Beldium"
      description="One sign-in for every compliance account type. This prototype does not validate passwords."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
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
          <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} /> Keep me signed in
        </label>
        <button
          className="text-xs font-medium text-brand underline"
          onClick={() => toast.info("Password reset email sent (simulated).")}
        >
          Forgot password?
        </button>
      </div>

      <div className="mt-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Continue as a demo role</p>
        <div className="mt-3 space-y-3">
          {demoRoles.map(({ role, title, blurb }) => (
            <OptionCard
              key={role}
              active={selected === role}
              title={title}
              description={blurb}
              onClick={() => {
                setSelected(role);
                setEmail(`${role}@beldium.demo`);
              }}
              meta={
                <span className="text-[11px] text-muted-foreground">
                  Signs in as {users[role].name} · {users[role].org}
                </span>
              }
            />
          ))}
        </div>
      </div>

      <Button className="mt-7 w-full" size="lg" onClick={signIn}>
        Sign in
      </Button>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        New to Beldium?{" "}
        <Link to="/onboarding/role" className="font-medium text-brand underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
