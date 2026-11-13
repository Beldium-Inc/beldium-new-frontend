import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, UserRound, Users } from "lucide-react";
import { useState } from "react";

import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordGuide, passwordProblem } from "@/components/ui/password-guide";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/errors";
import { formatPhoneNumber, isValidPhoneNumber } from "@/lib/phone";
import {
  cleanJoinCode,
  formatJoinCode,
  readPendingJoinCode,
  writePendingJoinCode,
} from "@/lib/join-code";

const title = "Create a miner account - Beldium Miner Hub";
const description =
  "Register a new mining organisation, request to join an existing organisation, or sign up as an individual miner.";

export const Route = createFileRoute("/signup")({
  // /join sends people here with role=org_staff once they have checked their code.
  validateSearch: (search: Record<string, unknown>): { role?: SignupRole } => {
    const role = search["role"];
    return role === "org_admin" || role === "org_staff" || role === "individual" ? { role } : {};
  },
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
  component: SignupPage,
});

/**
 * The backend has no "miner" onboarding_role - a mining organisation is
 * identified by `organisations.Organisation.organisation_type=mining_company`,
 * created after email verification. This local `role` only decides which
 * onboarding path the miner-portal UI walks them through afterwards; it is
 * not sent to the register endpoint.
 */
type SignupRole = "org_admin" | "org_staff" | "individual";

const roles: { id: SignupRole; icon: typeof Building2; title: string; body: string }[] = [
  {
    id: "org_admin",
    icon: Building2,
    title: "Register a mining organisation",
    body: "You are the authorised representative and will complete the verification application.",
  },
  {
    id: "org_staff",
    icon: Users,
    title: "Join an existing organisation",
    body: "Your organisation is already on Beldium. Use the join code its administrator shared with you.",
  },
  {
    id: "individual",
    icon: UserRound,
    title: "Individual / artisanal miner",
    body: "Operating under your own licence without a registered organisation.",
  },
];

function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { role: initialRole } = Route.useSearch();
  const [role, setRole] = useState<SignupRole>(initialRole ?? "org_admin");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    organisationName: "",
    password: "",
  });
  // Filled in from a join link opened before signup.
  const [joinCode, setJoinCode] = useState(() =>
    typeof window === "undefined" ? "" : formatJoinCode(readPendingJoinCode()),
  );
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const phone = formatPhoneNumber(form.phone);
    if (!form.fullName || !form.email.includes("@") || !isValidPhoneNumber(phone)) {
      setError("Complete your name, a valid email and a complete phone number.");
      return;
    }
    const weak = passwordProblem(form.password);
    if (weak) {
      setError(weak);
      return;
    }
    if (role === "org_admin" && !form.organisationName) {
      setError("Enter the mining organisation name.");
      return;
    }
    if (role === "org_staff" && cleanJoinCode(joinCode).length < 8) {
      setError("Enter the 8 character join code your organisation shared with you.");
      return;
    }
    if (!agreedTerms) {
      setError("You must accept the terms to continue.");
      return;
    }

    const [firstName, ...rest] = form.fullName.trim().split(/\s+/);
    setSubmitting(true);
    try {
      await signUp({
        email: form.email.trim(),
        password: form.password,
        confirm_password: form.password,
        agreed_terms: true,
        first_name: firstName ?? "",
        last_name: rest.join(" "),
        phone_number: phone,
      });
      // The join request is sent from /join once the email is verified.
      if (role === "org_staff") writePendingJoinCode(joinCode);
      navigate({
        to: "/verify",
        search: {
          email: form.email.trim(),
          role,
          organisationName: role === "org_admin" ? form.organisationName || undefined : undefined,
        },
      });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not create the account. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      wide
      title="Create your miner account"
      subtitle="Choose how you are joining Beldium. This decides which onboarding path you follow."
      footer={
        <>
          Already registered?{" "}
          <Link to="/auth" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="grid gap-3">
        {roles.map((r) => {
          const active = role === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={cn(
                "flex items-start gap-4 rounded-md border p-4 text-left transition-colors",
                active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40",
              )}
            >
              <span className={cn("mt-0.5 rounded-sm p-2", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                <r.icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block font-medium text-card-foreground">{r.title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{r.body}</span>
              </span>
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={form.fullName} onChange={set("fullName")} placeholder="Naomi Mwale" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="you@yourmine.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile number</Label>
            <PhoneInput
              id="phone"
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="08012345678"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              value={form.password}
              onChange={set("password")}
              placeholder="••••••••"
              autoComplete="new-password"
              aria-describedby="password-guide"
            />
          </div>
          <PasswordGuide
            id="password-guide"
            className="sm:col-span-2"
            password={form.password}
            identity={[form.fullName, form.email]}
          />
        </div>

        {role === "org_admin" ? (
          <div className="space-y-2">
            <Label htmlFor="organisationName">Mining organisation legal name</Label>
            <Input
              id="organisationName"
              value={form.organisationName}
              onChange={set("organisationName")}
              placeholder="Zambezi Minerals Ltd"
            />
          </div>
        ) : null}

        {role === "org_staff" ? (
          <div className="space-y-2">
            <Label htmlFor="joinCode">Organisation join code</Label>
            <Input
              id="joinCode"
              value={joinCode}
              onChange={(e) => setJoinCode(formatJoinCode(e.target.value))}
              className="font-mono tracking-[0.2em] uppercase"
              autoComplete="off"
              spellCheck={false}
              placeholder="ABCD-2345"
            />
            <p className="text-xs text-muted-foreground">
              Your organisation's owner or administrator finds this on their Team page. After you
              verify your email, you pick your role and send the request; they accept or decline it.
            </p>
          </div>
        ) : null}

        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
          />
          I agree to the Beldium terms of use and privacy policy.
        </label>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating account…" : "Continue to verification"}
        </Button>
      </form>
    </AuthLayout>
  );
}
