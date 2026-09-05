import * as React from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  Boxes,
  ClipboardCheck,
  FileBarChart,
  FileStack,
  Gauge,
  History,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  ScrollText,
  Search,
  Siren,
  Factory,
  X,
} from "lucide-react";
import { useAppState } from "@/verticals/processing/store";
import { NOTIFICATIONS } from "@/verticals/processing/mock-data";
import { Pill } from "@/verticals/processing/bpc";
import { cn } from "@/lib/utils";
import { BeldiumLogo } from "@/components/beldium-logo";

type NavItem = { to: string; label: string; icon: React.ElementType; badge?: string };

const OPERATOR_NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Compliance",
    items: [
      { to: "/processing/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/processing/applications", label: "Applications", icon: FileStack, badge: "5" },
      { to: "/processing/nonconformities", label: "Non-conformities", icon: AlertTriangle, badge: "3" },
      { to: "/processing/inspections", label: "Inspections", icon: ClipboardCheck },
      { to: "/processing/onboarding", label: "New Application", icon: ScrollText },
    ],
  },
  {
    group: "Context",
    items: [
      { to: "/processing/traceability", label: "Operational Traceability", icon: Boxes },
      { to: "/processing/audit", label: "Audit Trail", icon: History },
    ],
  },
];

const REGULATOR_NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Oversight",
    items: [
      { to: "/processing/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/processing/processors", label: "Processors & Facilities", icon: Factory },
      { to: "/processing/monitoring", label: "Compliance Monitoring", icon: Gauge },
      { to: "/processing/inspections", label: "Inspection Queue", icon: ClipboardCheck },
    ],
  },
  {
    group: "Signals",
    items: [
      { to: "/processing/environmental", label: "Environmental Alerts", icon: Leaf, badge: "2" },
      { to: "/processing/incidents", label: "Incidents", icon: Siren },
      { to: "/processing/nonconformities", label: "Non-conformities", icon: AlertTriangle },
    ],
  },
  {
    group: "Records",
    items: [
      { to: "/processing/reports", label: "Reports", icon: FileBarChart },
      { to: "/processing/audit", label: "Audit History", icon: History },
      { to: "/processing/traceability", label: "Operational Traceability", icon: Boxes },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAppState();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  if (!user) return null;
  const nav = user.role === "operator" ? OPERATOR_NAV : REGULATOR_NAV;

  const sidebar = (
    <div className="flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <BeldiumLogo className="size-10" />
        <div className="leading-tight">
          <p className="text-sm font-semibold">Beldium</p>
          <p className="text-[11px] text-sidebar-foreground/70">Processing Compliance</p>
        </div>
        <button
          className="ml-auto rounded-lg p-1.5 text-sidebar-foreground/70 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mx-4 mb-4 rounded-xl border border-sidebar-border bg-sidebar-accent/60 px-3 py-2.5">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-sidebar-foreground/60 uppercase">
          Active role
        </p>
        <p className="mt-1 text-xs font-medium">{user.title}</p>
        <p className="text-[11px] text-sidebar-foreground/70">{user.org}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {nav.map((group) => (
          <div key={group.group} className="mb-5">
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.16em] text-sidebar-foreground/50 uppercase">
              {group.group}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.to || (item.to !== "/processing/dashboard" && pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.badge ? (
                      <span
                        className={cn(
                          "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          active
                            ? "bg-sidebar text-sidebar-foreground"
                            : "bg-sidebar-accent text-sidebar-foreground",
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-4 text-[11px] text-sidebar-foreground/60">
        Prototype · static demo data · no live records
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">{sidebar}</aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-primary/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 shadow-xl">{sidebar}</div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:px-8">
          <button
            className="rounded-lg border border-border p-2 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </button>

          <div className="relative hidden min-w-0 flex-1 md:block">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full max-w-md rounded-xl border border-border bg-muted/60 py-2 pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
              placeholder="Search applications, processors, Beldium Batch IDs…"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Pill tone={user.role === "operator" ? "primary" : "info"}>
              {user.role === "operator" ? "Compliance Operator" : "Oversight · read-only"}
            </Pill>

            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setProfileOpen(false);
                }}
                className="relative rounded-xl border border-border p-2 hover:bg-accent"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
              </button>
              {notifOpen ? (
                <div className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-border bg-popover p-2 shadow-[0_18px_50px_-20px_rgba(16,30,61,0.5)]">
                  <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Notifications
                  </p>
                  {NOTIFICATIONS.map((n) => (
                    <div key={n.id} className="rounded-xl px-3 py-2 hover:bg-accent">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            n.kind === "error"
                              ? "bg-destructive"
                              : n.kind === "warn"
                                ? "bg-warning"
                                : "bg-primary",
                          )}
                        />
                        <p className="text-xs font-medium">{n.title}</p>
                        <span className="ml-auto text-[10px] text-muted-foreground">{n.at}</span>
                      </div>
                      <p className="mt-1 pl-4 text-[11px] text-muted-foreground">{n.body}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-border py-1.5 pr-3 pl-1.5 hover:bg-accent"
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-[11px] font-semibold text-primary-foreground">
                  {user.initials}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-medium">{user.name}</span>
                  <span className="block text-[10px] text-muted-foreground">{user.title}</span>
                </span>
              </button>
              {profileOpen ? (
                <div className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-border bg-popover p-2 shadow-[0_18px_50px_-20px_rgba(16,30,61,0.5)]">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-[11px] text-muted-foreground">{user.org}</p>
                  </div>
                  <div className="my-1 h-px bg-border" />
                  <button
                    onClick={() => {
                      signOut();
                      navigate({ to: "/signin" });
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-destructive-foreground hover:bg-destructive/15"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
