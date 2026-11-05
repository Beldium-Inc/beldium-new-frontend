import * as React from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  ClipboardCheck,
  FileBadge2,
  Gauge,
  LogOut,
  Menu,
  ScrollText,
  ShieldAlert,
  BadgeCheck,
  Workflow,
  X,
} from "lucide-react";
import { useBeldium } from "@/lib/beldium/store";
import { useAccounts } from "@/lib/beldium/accounts";
import { roleMeta } from "@/lib/beldium/data";
import type { Role } from "@/lib/beldium/types";
import { cn } from "@/lib/utils";
import { can, canAccessPath, environmentFor, membershipsFor } from "@/lib/beldium/compliance";
import { Btn } from "./auth";

type AppPath =
  | "/dashboard"
  | "/applications"
  | "/samples"
  | "/certificates"
  | "/nonconformities"
  | "/audit"
  | "/assignments"
  | "/compliance-review"
  | "/application-status";

interface NavItem {
  to: AppPath;
  label: string;
  icon: React.ComponentType<{ className?: string | undefined }>;
}

const allNav = {
  dashboard: { to: "/dashboard", label: "Dashboard", icon: Gauge },
  applications: { to: "/applications", label: "Partner applications", icon: ClipboardCheck },
  assignments: { to: "/assignments", label: "Quality assignments", icon: Workflow },
  samples: { to: "/samples", label: "Samples & chain", icon: Boxes },
  certificates: { to: "/certificates", label: "Certificates", icon: FileBadge2 },
  ncr: { to: "/nonconformities", label: "Non-conformities", icon: ShieldAlert },
  audit: { to: "/audit", label: "Audit trail", icon: ScrollText },
} satisfies Record<string, NavItem>;

export const navByRole: Record<Role, NavItem[]> = {
  operator: [
    allNav.dashboard,
    allNav.applications,
    allNav.assignments,
    allNav.samples,
    allNav.certificates,
    allNav.ncr,
    allNav.audit,
  ],
  partner: [allNav.dashboard, allNav.assignments, allNav.samples, allNav.certificates, allNav.ncr],
  miner: [allNav.dashboard, allNav.assignments, allNav.samples, allNav.certificates],
  buyer: [allNav.dashboard, allNav.samples, allNav.certificates, allNav.ncr],
  regulator: [
    allNav.dashboard,
    allNav.applications,
    allNav.assignments,
    allNav.samples,
    allNav.certificates,
    allNav.ncr,
    allNav.audit,
  ],
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useBeldium();
  const accounts = useAccounts();
  const app = accounts.current?.application ?? null;
  const locked = !!user && !!accounts.current?.roleKey && (app?.status !== "approved" || !can(user, "view"));
  const allowed = canAccessPath(user, useRouterState({ select: (s) => s.location.pathname }));
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (ready && !user) navigate({ to: "/", replace: true });
    else if (ready && accounts.ready && locked && pathname !== "/application-status")
      navigate({ to: "/application-status", replace: true });
  }, [ready, user, navigate, locked, pathname, accounts.ready]);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading workspace…</p>
      </div>
    );
  }

  const statusItem: NavItem = { to: "/application-status", label: "Application & access", icon: BadgeCheck };
  const items = locked
    ? [statusItem]
    : accounts.current?.roleKey
      ? [...navByRole[user.role], statusItem]
      : navByRole[user.role];
  const visibleItems = items.filter((item) => canAccessPath(user, item.to));
  if (!locked && environmentFor(user) !== "operations") visibleItems.splice(2, 0, { to: "/compliance-review", label: "Applicant review", icon: ClipboardCheck });
  const memberships = membershipsFor(user);

  const sidebar = (
    <div className="flex h-full w-72 flex-col bg-navy text-navy-foreground">
      <div className="px-6 py-6">
        <Link to="/dashboard" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-pale font-display text-lg font-bold text-navy">
            B
          </span>
          <span>
            <span className="block font-display text-base font-semibold">Beldium</span>
            <span className="block text-[11px] tracking-wide text-pale/80 uppercase">
              Quality &amp; Control
            </span>
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        {visibleItems.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-pale text-navy"
                  : "text-pale/80 hover:bg-white/10 hover:text-navy-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="m-4 rounded-2xl bg-white/8 p-4">
        <p className="text-[11px] tracking-wide text-pale/70 uppercase">
          {roleMeta[user.role].label}
        </p>
        <p className="mt-1 text-sm font-semibold">{user.name}</p>
        <p className="text-xs text-pale/70">{user.org}</p>
        <button
          type="button"
          onClick={() => {
            accounts.signOut();
            navigate({ to: "/" });
          }}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pale px-3 py-2 text-xs font-semibold text-navy transition hover:bg-white"
        >
          <LogOut className="size-3.5" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">{sidebar}</div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-navy/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="grid size-9 place-items-center rounded-xl border border-border bg-card lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
            <div className="hidden sm:block">
              <p className="text-xs text-muted-foreground">
                {environmentFor(user) === "verification" ? "Compliance verification" : environmentFor(user) === "oversight" ? "Regulatory oversight" : "Sector operations"} · simulated
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-semibold text-navy">{user.name}</span>
              <span className="block text-xs text-muted-foreground">{user.title}</span>
            </span>
            <span className="grid size-9 place-items-center rounded-full bg-pale font-display text-sm font-semibold text-navy">
              {user.initials}
            </span>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-8 sm:py-8">
          <p className="mb-3 text-xs text-muted-foreground">Frontend demo · no live registry checks, official regulatory approval, or secure multi-user enforcement.</p>
          <p className="mb-4 text-xs text-muted-foreground">{memberships.map((m) => `${m.organization} · ${m.sector} · ${m.environment}`).join(" / ") || "Authority not delegated · application access only"}</p>
          {allowed && (!locked || pathname === "/application-status") ? children : <div><p className="text-sm text-navy">This workspace is outside your delegated access.</p><Btn className="mt-4" onClick={() => navigate({ to: locked ? "/application-status" : "/dashboard" })}>Return to your workspace</Btn></div>}
        </main>
      </div>
    </div>
  );
}
