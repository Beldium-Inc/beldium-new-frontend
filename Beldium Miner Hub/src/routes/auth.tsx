import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMiner } from "@/lib/miner-store";

const title = "Sign in — Beldium Miner Hub";
const description = "Universal sign-in for miners, mining organisation admins and organisation staff.";

export const Route = createFileRoute("/auth")({
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
  component: AuthPage,
});

function AuthPage() {
  const { state, signIn } = useMiner();
  const navigate = useNavigate();
  const [email, setEmail] = useState(state.account?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and a password of at least 6 characters.");
      return;
    }
    signIn(email.trim());
    navigate({ to: "/portal" });
  }

  return (
    <AuthLayout
      title="Sign in to Beldium Miner Hub"
      subtitle="One sign-in for every miner role. Your workspace adapts to your verification status."
      footer={
        <>
          New to Beldium?{" "}
          <Link to="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
            Create a miner account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourmine.com" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <span className="text-xs text-muted-foreground">Prototype: any 6+ characters</span>
          </div>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>

      {state.account ? (
        <div className="mt-6 rounded-md border border-border bg-card p-4 text-sm">
          <div className="font-medium text-card-foreground">Existing prototype account</div>
          <p className="mt-1 text-muted-foreground">
            {state.account.fullName} · {state.account.email}
          </p>
        </div>
      ) : null}
    </AuthLayout>
  );
}
