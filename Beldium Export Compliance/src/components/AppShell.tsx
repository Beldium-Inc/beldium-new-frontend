import * as React from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BellRing,
  Building2,
  ClipboardList,
  FileStack,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  ScrollText,
  Ship,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui-kit";

type NavItem = { to: string; label: string; icon: React.ElementType; exact?: boolean };

const NAV: Record<Role, NavItem[]> = {
  operator: [
    { to: "/queue", label: "Review queue", icon: ClipboardList },
    { to: "/shipments", label: "Shipments", icon: Ship },
    { to: "/exporters", label: "Exporters", icon: Building2 },
    { to: "/documents", label: "Documents", icon: FileStack },
    { to: "/monitoring", label: "Monitoring", icon: BellRing },
  ],
  exporter: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/shipments", label: "My shipments", icon: Ship },
    { to: "/shipments/new", label: "New shipment", icon: PlusCircle },
    { to: "/documents", label: "Documents", icon: FileStack },
    { to: "/monitoring", label: "Alerts", icon: BellRing },
  ],
  regulator: [
    { to: "/oversight", label: "Oversight", icon: Gauge },
    { to: "/shipments", label: "Consignments", icon: Ship },
    { to: "/documents", label: "Document register", icon: ScrollText },
    { to: "/monitoring", label: "Monitoring", icon: BellRing },
  ],
};

export const ROLE_HOME: Record<Role, string> = {
  operator: "/queue",
  exporter: "/dashboard",
  regulator: "/oversight",
};

const ROLE_LABEL: Record<Role, string> = {
  operator: "Compliance operator",
  exporter: "Exporter",
  regulator: "Regulatory oversight",
};

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileNav, setMobileNav] = React.useState(false);

  React.useEffect(() => {
    if (user === null) navigate({ to: "/" });
  }, [user, navigate]);

  React.useEffect(() => setMobileNav(false), [pathname]);

  if (!user) return null;
  const items = NAV[user.role];

  const navList = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          pathname === item.to || (item.to !== "/" && pathname.startsWith(`${item.to}/`));
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <ShieldCheck className="size-5" />
      </span>
      <div className="leading-tight">
        <p className="font-display text-sm font-semibold text-sidebar-primary">Beldium</p>
        <p className="text-[11px] text-sidebar-foreground/70">Export Compliance</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col justify-between border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
        <div className="space-y-8">
          {brand}
          {navList}
        </div>
        <div className="space-y-3 border-t border-sidebar-border pt-4">
          <p className="text-[11px] leading-relaxed text-sidebar-foreground/60">
            Compliance verification records issued by Beldium are independent assurance documents —
            not government permits.
          </p>
        </div>
      </aside>

      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-primary/40"
            onClick={() => setMobileNav(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 space-y-8 bg-sidebar px-4 py-5">
            {brand}
            {navList}
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileNav(true)}
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="truncate font-display text-lg font-semibold">{title}</h1>
                {subtitle && (
                  <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {actions}
              <div className="hidden items-center gap-2.5 border-l border-border pl-3 sm:flex">
                <span className="grid size-9 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                  {user.initials}
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-[11px] text-muted-foreground">{ROLE_LABEL[user.role]}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-border bg-secondary/60 px-4 py-1.5 sm:px-6">
            <Pill tone="info">Demo environment</Pill>
            <p className="truncate text-[11px] text-muted-foreground">
              Signed in as {ROLE_LABEL[user.role]} · {user.org}
            </p>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
