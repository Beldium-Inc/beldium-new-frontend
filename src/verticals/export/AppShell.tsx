import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BellRing,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FileStack,
  Gauge,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  ScrollText,
  Ship,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/verticals/export/store";
import type { Role } from "@/verticals/export/mock-data";
import { Button } from "@/components/ui/button";
import { BeldiumLogo } from "@/components/beldium-logo";
import { DashboardHeader } from "@/components/dashboard-header";

type NavItem = { to: string; label: string; icon: React.ElementType; exact?: boolean };

const NAV: Record<Role, NavItem[]> = {
  operator: [
    { to: "/export/queue", label: "Review queue", icon: ClipboardList },
    { to: "/export/shipments", label: "Shipments", icon: Ship },
    { to: "/export/exporters", label: "Exporters", icon: Building2 },
    { to: "/export/documents", label: "Documents", icon: FileStack },
    { to: "/export/monitoring", label: "Monitoring", icon: BellRing },
  ],
  exporter: [
    { to: "/export/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/export/shipments", label: "My shipments", icon: Ship },
    { to: "/export/shipments/new", label: "New shipment", icon: PlusCircle },
    { to: "/export/documents", label: "Documents", icon: FileStack },
    { to: "/export/monitoring", label: "Alerts", icon: BellRing },
  ],
  regulator: [
    { to: "/export/oversight", label: "Oversight", icon: Gauge },
    { to: "/export/shipments", label: "Consignments", icon: Ship },
    { to: "/export/documents", label: "Document register", icon: ScrollText },
    { to: "/export/monitoring", label: "Monitoring", icon: BellRing },
  ],
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileNav, setMobileNav] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem("export-nav-collapsed") === "1";
    } catch {
      return false;
    }
  });

  React.useEffect(() => setMobileNav(false), [pathname]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem("export-nav-collapsed", collapsed ? "1" : "0");
    } catch {
      // ignore write failures (private mode, disabled storage)
    }
  }, [collapsed]);

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
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              collapsed && "lg:justify-center",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className={cn("flex items-center gap-2.5", collapsed && "lg:justify-center")}>
      <BeldiumLogo className="size-9 rounded-lg" />
      <div className={cn("leading-tight", collapsed && "lg:hidden")}>
        <p className="font-display text-sm font-semibold text-sidebar-primary">Beldium</p>
        <p className="text-[11px] text-sidebar-foreground/70">Export Compliance</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col justify-between border-r border-sidebar-border bg-sidebar px-4 py-5 transition-[width] duration-200 lg:flex",
          collapsed ? "w-64 lg:w-20" : "w-64",
        )}
      >
        <div className="space-y-8">
          {brand}
          {navList}
        </div>
        <div
          className={cn("space-y-3 border-t border-sidebar-border pt-4", collapsed && "lg:hidden")}
        >
          <p className="text-[11px] leading-relaxed text-sidebar-foreground/60">
            Compliance verification records issued by Beldium are independent assurance documents,
            not government permits.
          </p>
        </div>

        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          className="absolute top-8 -right-3 z-10 hidden size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground lg:flex"
        >
          {collapsed ? (
            <ChevronsRight className="size-3.5" />
          ) : (
            <ChevronsLeft className="size-3.5" />
          )}
        </button>
      </aside>

      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-primary/40"
            onClick={() => setMobileNav(false)}
          />
          <div className="absolute inset-y-0 left-0 max-w-[85vw] w-64 space-y-8 overflow-y-auto bg-sidebar px-4 py-5">
            {brand}
            {navList}
          </div>
        </div>
      )}

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-20" : "lg:pl-64")}>
        <DashboardHeader
          title={title}
          subtitle={subtitle}
          onOpenNav={() => setMobileNav(true)}
          actions={
            <>
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
            </>
          }
        />
        <main className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
