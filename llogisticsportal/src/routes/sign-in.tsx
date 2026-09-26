import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthLayout, Field, inputCls } from "@/components/beldium/auth-layout";
import { getState, setState } from "@/lib/onboarding-store";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign In | Beldium Logistics Operator" },
      { name: "description", content: "Sign in to your Beldium Logistics Operator dashboard." },
      { property: "og:title", content: "Sign In | Beldium Logistics Operator" },
      { property: "og:description", content: "Access transport requests, movements, fleet and compliance on Beldium." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const acc = getState().account;
    if (!acc || acc.email.toLowerCase() !== email.trim().toLowerCase() || acc.password !== password) {
      toast.error("Email or password is incorrect.");
      return;
    }
    setState({ signedIn: true });
    navigate({ to: "/" });
  }

  return (
    <AuthLayout>
      <h1 className="text-xl font-semibold text-primary">Sign in</h1>
      <p className="beldium-small mb-5">Logistics operators on the Beldium ecosystem.</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Work email">
          <input className={inputCls} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <input className={inputCls} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <button className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
          Sign in
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        New to Beldium?{" "}
        <Link to="/sign-up" className="font-semibold text-colorLink">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        <Link to="/" className="text-colorLink">Continue to demo dashboard</Link>
      </p>
    </AuthLayout>
  );
}
