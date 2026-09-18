import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/errors";

const title = "Sign in - Beldium Miner Hub";
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
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.includes("@") || password.length < 1) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn({ email: email.trim(), password });
      navigate({ to: "/portal" });
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "email_not_verified") {
        navigate({ to: "/verify", search: { email: email.trim() } });
        return;
      }
      setError(cause instanceof ApiError ? cause.message : "Sign in failed. Try again.");
    } finally {
      setSubmitting(false);
    }
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
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
