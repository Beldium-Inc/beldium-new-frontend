import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, ProgressHeader } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useOnboarding } from "@/lib/onboarding/store";

export const Route = createFileRoute("/onboarding/account")({ component: AccountPage });

function AccountPage() {
  const { account, updateAccount } = useOnboarding();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (account.fullName.trim().length < 3) e['fullName'] = "Enter your full name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(account.email.trim())) e['email'] = "Enter a valid work email address.";
    if (!/^[0-9+][0-9\s-]{8,17}$/.test(account.phone.trim())) e['phone'] = "Enter a valid phone number, e.g. +234 803 000 0000.";
    if (account.password.length < 8) e['password'] = "Use at least 8 characters.";
    if (!account.acceptedTerms) e['terms'] = "You must accept the platform terms.";
    setErrors(e);
    if (Object.keys(e).length === 0) navigate({ to: "/onboarding/verify" });
  };

  const strength = Math.min(4, [account.password.length >= 8, /[A-Z]/.test(account.password), /[0-9]/.test(account.password), /[^A-Za-z0-9]/.test(account.password)].filter(Boolean).length);

  return (
    <AuthShell
      title="Create your account"
      description="These details identify you as a user. Organisation information is captured in the next stage."
    >
      <ProgressHeader step={3} total={5} onBack={() => navigate({ to: "/onboarding/role" })} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" value={account.fullName} onChange={(ev) => updateAccount({ fullName: ev.target.value })} placeholder="Amina Bello" autoComplete="name" />
          {errors['fullName'] && <p className="text-xs text-danger">{errors['fullName']}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jobTitle">Job title</Label>
          <Input id="jobTitle" value={account.jobTitle} onChange={(ev) => updateAccount({ jobTitle: ev.target.value })} placeholder="Compliance Manager" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" value={account.email} onChange={(ev) => updateAccount({ email: ev.target.value, emailVerified: false })} placeholder="you@company.com" autoComplete="email" />
          {errors['email'] && <p className="text-xs text-danger">{errors['email']}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Mobile number</Label>
          <Input id="phone" type="tel" value={account.phone} onChange={(ev) => updateAccount({ phone: ev.target.value, phoneVerified: false })} placeholder="+234 803 000 0000" autoComplete="tel" />
          {errors['phone'] && <p className="text-xs text-danger">{errors['phone']}</p>}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={account.password} onChange={(ev) => updateAccount({ password: ev.target.value })} autoComplete="new-password" />
          <div className="flex gap-1.5 pt-1" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i < strength ? (strength >= 3 ? "bg-success" : "bg-warning") : "bg-muted"}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Use 8+ characters with a capital letter, number and symbol.</p>
          {errors['password'] && <p className="text-xs text-danger">{errors['password']}</p>}
        </div>
      </div>

      <label className="mt-6 flex items-start gap-3 rounded-[14px] border border-border bg-muted/40 p-4">
        <Checkbox checked={account.acceptedTerms} onCheckedChange={(v) => updateAccount({ acceptedTerms: Boolean(v) })} />
        <span className="text-xs leading-relaxed text-muted-foreground">
          I confirm the information I provide is accurate and I accept the Beldium platform terms, data-processing notice and compliance
          code of conduct.
        </span>
      </label>
      {errors['terms'] && <p className="mt-2 text-xs text-danger">{errors['terms']}</p>}

      <div className="mt-7 flex flex-wrap gap-3">
        <Button size="lg" onClick={submit}>
          Create account &amp; send codes
        </Button>
        <Button size="lg" variant="ghost" onClick={() => navigate({ to: "/onboarding/path" })}>
          Back
        </Button>
      </div>
    </AuthShell>
  );
}
