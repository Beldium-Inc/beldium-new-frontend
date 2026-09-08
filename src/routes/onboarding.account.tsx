import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AuthShell, ProgressHeader } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useOnboarding } from "@/lib/onboarding/store";

export const Route = createFileRoute("/onboarding/account")({ component: AccountPage });

// The API names its fields differently; map its validation errors back onto the
// inputs the person is actually looking at.
const BACKEND_FIELD_TO_INPUT: Record<string, string> = {
  email: "email",
  password: "password",
  confirm_password: "confirmPassword",
  agreed_terms: "terms",
  phone_number: "phone",
  first_name: "fullName",
  last_name: "fullName",
};

function AccountPage() {
  const { account, updateAccount } = useOnboarding();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  // Kept out of the onboarding store: that store persists to localStorage, and
  // one copy of a password sitting there is already one too many.
  const [confirmPassword, setConfirmPassword] = useState("");

  const submit = async () => {
    if (submitting) return;
    const e: Record<string, string> = {};
    if (account.fullName.trim().length < 3) e["fullName"] = "Enter your full name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(account.email.trim()))
      e["email"] = "Enter a valid work email address.";
    if (!/^[0-9+][0-9\s-]{8,17}$/.test(account.phone.trim()))
      e["phone"] = "Enter a valid phone number, e.g. +234 803 000 0000.";
    if (account.password.length < 8) e["password"] = "Use at least 8 characters.";
    if (confirmPassword !== account.password) e["confirmPassword"] = "Both passwords must match.";
    if (!account.acceptedTerms) e["terms"] = "You must accept the platform terms.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    // The User model stores given and family names separately; everything after
    // the first space is the surname.
    const parts = account.fullName.trim().split(/\s+/);
    const email = account.email.trim();

    setSubmitting(true);
    try {
      await signUp({
        email,
        password: account.password,
        confirm_password: confirmPassword,
        agreed_terms: account.acceptedTerms,
        first_name: parts[0] ?? "",
        last_name: parts.slice(1).join(" "),
        phone_number: account.phone.trim(),
      });
      updateAccount({ emailVerified: false });
      toast.success("Account created. We emailed you a six-digit code.");
      navigate({ to: "/onboarding/verify", search: { email } });
    } catch (error) {
      if (!(error instanceof ApiError)) {
        toast.error("Could not create your account. Please try again.");
        return;
      }

      const fromApi: Record<string, string> = {};
      for (const [field, message] of Object.entries(error.fieldErrors())) {
        const input = BACKEND_FIELD_TO_INPUT[field.split(".")[0] ?? ""];
        if (input) fromApi[input] = message;
      }
      if (Object.keys(fromApi).length > 0) setErrors(fromApi);
      toast.error(error.message);

      // An address already on file usually means a half-finished signup rather
      // than a mistake, so point at the code screen instead of a dead end.
      if (fromApi["email"]?.toLowerCase().includes("already exists")) {
        setErrors({ email: "That email already has an account. Verify it or sign in instead." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const strength = Math.min(
    4,
    [
      account.password.length >= 8,
      /[A-Z]/.test(account.password),
      /[0-9]/.test(account.password),
      /[^A-Za-z0-9]/.test(account.password),
    ].filter(Boolean).length,
  );

  return (
    <AuthShell
      title="Create your account"
      description="These details identify you as a user. Organisation information is captured in the next stage."
    >
      <ProgressHeader step={4} total={6} onBack={() => navigate({ to: "/onboarding/role" })} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={account.fullName}
            onChange={(ev) => updateAccount({ fullName: ev.target.value })}
            placeholder="Amina Bello"
            autoComplete="name"
          />
          {errors["fullName"] && <p className="text-xs text-danger">{errors["fullName"]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jobTitle">Job title</Label>
          <Input
            id="jobTitle"
            value={account.jobTitle}
            onChange={(ev) => updateAccount({ jobTitle: ev.target.value })}
            placeholder="Compliance Manager"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            value={account.email}
            onChange={(ev) => updateAccount({ email: ev.target.value, emailVerified: false })}
            placeholder="you@company.com"
            autoComplete="email"
          />
          {errors["email"] && <p className="text-xs text-danger">{errors["email"]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Mobile number</Label>
          <Input
            id="phone"
            type="tel"
            value={account.phone}
            onChange={(ev) => updateAccount({ phone: ev.target.value, phoneVerified: false })}
            placeholder="+234 803 000 0000"
            autoComplete="tel"
          />
          {errors["phone"] && <p className="text-xs text-danger">{errors["phone"]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={account.password}
            onChange={(ev) => updateAccount({ password: ev.target.value })}
            autoComplete="new-password"
          />
          <div className="flex gap-1.5 pt-1" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i < strength ? (strength >= 3 ? "bg-success" : "bg-warning") : "bg-muted"}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Use 8+ characters with a capital letter, number and symbol.
          </p>
          {errors["password"] && <p className="text-xs text-danger">{errors["password"]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(ev) => setConfirmPassword(ev.target.value)}
            autoComplete="new-password"
          />
          {errors["confirmPassword"] && (
            <p className="text-xs text-danger">{errors["confirmPassword"]}</p>
          )}
        </div>
      </div>

      <label className="mt-6 flex items-start gap-3 rounded-[14px] border border-border bg-muted/40 p-4">
        <Checkbox
          checked={account.acceptedTerms}
          onCheckedChange={(v) => updateAccount({ acceptedTerms: Boolean(v) })}
        />
        <span className="text-xs leading-relaxed text-muted-foreground">
          I confirm the information I provide is accurate and I accept the Beldium platform terms,
          data-processing notice and compliance code of conduct.
        </span>
      </label>
      {errors["terms"] && <p className="mt-2 text-xs text-danger">{errors["terms"]}</p>}

      <div className="mt-7 flex flex-wrap gap-3">
        <Button size="lg" onClick={() => void submit()} disabled={submitting}>
          {submitting ? "Creating account…" : "Create account & send code"}
        </Button>
        <Button size="lg" variant="ghost" onClick={() => navigate({ to: "/onboarding/path" })}>
          Back
        </Button>
      </div>
    </AuthShell>
  );
}
