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
  X,
} from "lucide-react";
import { useBeldium } from "@/verticals/quality/store";
import { roleMeta } from "@/verticals/quality/data";
import type { Role } from "@/verticals/quality/types";
import { cn } from "@/lib/utils";
import { BeldiumLogo } from "@/components/beldium-logo";

type AppPath =
  | "/quality/dashboard"
  | "/quality/applications"
  | "/quality/samples"
  | "/quality/certificates"
  | "/quality/nonconformities"
  | "/quality/audit";

interface NavItem {
  to: AppPath;
  label: string;
  icon: React.ComponentType<{ className?: string | undefined }>;
}

const allNav = {
  dashboard: { to: "/quality/dashboard", label: "Dashboard", icon: Gauge },
  applications: { to: "/quality/applications", label: "Partner applications", icon: ClipboardCheck },
  samples: { to: "/quality/samples", label: "Samples & chain", icon: Boxes },
  certificates: { to: "/quality/certificates", label: "Certificates", icon: FileBadge2 },
  ncr: { to: "/quality/nonconformities", label: "Non-conformities", icon: ShieldAlert },
  audit: { to: "/quality/audit", label: "Audit trail", icon: ScrollText },
} satisfies Record<string, NavItem>;

export const navByRole: Record<Role, NavItem[]> = {
  operator: [
    allNav.dashboard,
    allNav.applications,
    allNav.samples,
    allNav.certificates,
    allNav.ncr,
    allNav.audit,
  ],
  partner: [allNav.dashboard, allNav.samples, allNav.certificates, allNav.ncr],
  miner: [allNav.dashboard, allNav.samples, allNav.certificates],
  buyer: [allNav.dashboard, allNav.samples, allNav.certificates, allNav.ncr],
  regulator: [
    allNav.dashboard,
    allNav.applications,
    allNav.samples,
    allNav.certificates,
    allNav.ncr,
    allNav.audit,
  ],
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useBeldium();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (ready && !user) navigate({ to: "/", replace: true });
  }, [ready, user, navigate]);

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

  const items = navByRole[user.role];

  const sidebar = (
    <div className="flex h-full w-72 flex-col bg-navy text-navy-foreground">
      <div className="px-6 py-6">
        <Link to="/quality/dashboard" className="flex items-center gap-3">
          <BeldiumLogo className="size-9" />
          <span>
            <span className="block font-display text-base font-semibold">Beldium</span>
            <span className="block text-[11px] tracking-wide text-pale/80 uppercase">
              Quality &amp; Control
            </span>
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        {items.map((item) => {
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
            logout();
            navigate({ to: "/" });
          }}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pale px-3 py-2 text-xs font-semibold text-navy transition hover:bg-white"
        >
          <LogOut className="size-3.5" /> Log out &amp; switch role
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
                Traceable material trust · demo environment
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
        <main className="px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
