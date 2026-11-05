import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { AuthLayout, Btn, FieldError, Label, inputClass } from "@/components/beldium/auth";
import { StatusPill } from "@/components/beldium/ui";
import { useAccounts } from "@/lib/beldium/accounts";
import { roleDefs } from "@/lib/beldium/onboarding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Beldium Quality & Control" },
      {
        name: "description",
        content:
          "Sign in to Beldium to follow your Quality & Control application or open your verified workspace.",
      },
      { property: "og:title", content: "Sign in — Beldium Quality & Control" },
      {
        property: "og:description",
        content: "One sign-in for laboratories, inspectors, analysts and regulators on Beldium.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const { signIn, enterWorkspace, accounts } = useAccounts();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [show, setShow] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const res = signIn(email, password, remember);
    if (!res.ok) {
      setErrors({ form: res.error });
      setBusy(false);
      return;
    }
    if (res.account.roleKey && !res.account.application) {
      navigate({ to: "/signup" });
      return;
    }
    navigate({ to: enterWorkspace(res.account) });
  };

  const demo = accounts.filter((a) => a.id.startsWith("acc-") && a.email.includes("@"));

  return (
    <AuthLayout>
      <p className="text-xs font-semibold tracking-[0.18em] text-link uppercase">Welcome back</p>
      <h2 className="mt-1 font-display text-2xl font-semibold text-navy">Sign in to Beldium</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We route you to the right workspace from your organisation, role and verification status.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            className={inputClass}
            placeholder="you@organisation.com"
          />
          <FieldError>{errors.email}</FieldError>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              className={inputClass + " pr-10"}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <FieldError>{errors.password}</FieldError>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-navy">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 accent-[var(--color-link)]"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-link hover:underline">
            Forgot password?
          </Link>
        </div>
        {errors.form ? (
          <p className="rounded-xl border border-danger/40 bg-danger/15 px-3 py-2 text-sm text-danger-foreground">
            {errors.form}
          </p>
        ) : null}
        <Btn type="submit" className="w-full" disabled={busy}>
          <LogIn className="size-4" /> Sign in
        </Btn>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        New to Beldium?{" "}
        <Link to="/signup" className="font-semibold text-link hover:underline">
          Create account
        </Link>
      </p>

      <div className="mt-8 border-t border-border pt-5">
        <p className="text-xs font-semibold tracking-wide text-navy uppercase">Demo accounts</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Password for all: <span className="font-mono font-semibold text-navy">demo1234</span>. Tap
          one to fill the form.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {demo.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setEmail(a.email);
                setPassword("demo1234");
                setErrors({});
              }}
              className="rounded-xl border border-border p-3 text-left transition hover:border-link"
            >
              <span className="block truncate text-sm font-semibold text-navy">{a.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {a.roleKey ? roleDefs[a.roleKey].title : a.orgName}
              </span>
              <span className="mt-1.5 block">
                <StatusPill value={a.application?.status ?? "approved"} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
