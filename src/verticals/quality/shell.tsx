import * as React from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  FileBadge2,
  Gauge,
  LogOut,
  ScrollText,
  ShieldAlert,
} from "lucide-react";
import { useBeldium } from "@/verticals/quality/store";
import { roleMeta } from "@/verticals/quality/data";
import type { Role } from "@/verticals/quality/types";
import { cn } from "@/lib/utils";
import { BeldiumLogo } from "@/components/beldium-logo";
import { DashboardHeader } from "@/components/dashboard-header";

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
  applications: {
    to: "/quality/applications",
    label: "Partner applications",
    icon: ClipboardCheck,
  },
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
  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem("quality-nav-collapsed") === "1";
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    if (ready && !user) navigate({ to: "/signin", replace: true });
  }, [ready, user, navigate]);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem("quality-nav-collapsed", collapsed ? "1" : "0");
    } catch {
      // ignore write failures (private mode, disabled storage)
    }
  }, [collapsed]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading workspace…</p>
      </div>
    );
  }

  const items = navByRole[user.role];

  const sidebar = (
    <div
      className={cn(
        "relative flex h-full max-w-[85vw] flex-col bg-navy text-navy-foreground transition-[width] duration-200 lg:max-w-none",
        collapsed ? "w-72 lg:w-20" : "w-72",
      )}
    >
      <div
        className={cn("flex items-center py-6", collapsed ? "justify-center px-3 lg:px-3" : "px-6")}
      >
        <Link
          to="/quality/dashboard"
          className={cn("flex items-center gap-3", collapsed && "lg:justify-center")}
        >
          <BeldiumLogo className="size-9 shrink-0" />
          <span className={cn(collapsed && "lg:hidden")}>
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
              title={collapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "lg:justify-center",
                active
                  ? "bg-pale text-navy"
                  : "text-pale/80 hover:bg-white/10 hover:text-navy-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div
        className={cn(
          "m-4 rounded-2xl bg-white/8 p-4",
          collapsed && "lg:flex lg:flex-col lg:items-center",
        )}
      >
        <div className={cn(collapsed && "lg:hidden")}>
          <p className="text-[11px] tracking-wide text-pale/70 uppercase">
            {roleMeta[user.role].label}
          </p>
          <p className="mt-1 text-sm font-semibold">{user.name}</p>
          <p className="text-xs text-pale/70">{user.org}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate({ to: "/signin" });
          }}
          title={collapsed ? "Log out" : undefined}
          className={cn(
            "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pale px-3 py-2 text-xs font-semibold text-navy transition hover:bg-white",
            collapsed && "lg:mt-0 lg:w-auto lg:px-2.5",
          )}
        >
          <LogOut className="size-3.5 shrink-0" />
          <span className={cn(collapsed && "lg:hidden")}>Log out &amp; switch role</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        className="absolute top-8 -right-3 z-10 hidden size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground lg:flex"
      >
        {collapsed ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
      </button>
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

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-20" : "lg:pl-72")}>
        <DashboardHeader
          title="Traceable material trust"
          subtitle={user.title}
          onOpenNav={() => setOpen(true)}
          actions={
            <div className="flex items-center gap-3">
              <span className="hidden text-right sm:block">
                <span className="block text-sm font-semibold text-navy">{user.name}</span>
                <span className="block text-xs text-muted-foreground">{user.title}</span>
              </span>
              <span className="grid size-9 place-items-center rounded-full bg-pale font-display text-sm font-semibold text-navy">
                {user.initials}
              </span>
            </div>
          }
        />
        <main className="px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
