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
import { Pill } from "@/verticals/processing/bpc";
import { cn } from "@/lib/utils";
import { BeldiumLogo } from "@/components/beldium-logo";

type NavItem = { to: string; label: string; icon: React.ElementType; badge?: string | undefined };

/** Counts pulled live from the store, so a nav badge never drifts from what its page actually shows. */
type NavBadgeCounts = {
  pendingApplications: number;
  openNonConformities: number;
  openEnvironmentalAlerts: number;
};

function buildOperatorNav(counts: NavBadgeCounts): { group: string; items: NavItem[] }[] {
  return [
    {
      group: "Compliance",
      items: [
        { to: "/processing/dashboard", label: "Dashboard", icon: LayoutDashboard },
        {
          to: "/processing/applications",
          label: "Applications",
          icon: FileStack,
          badge: counts.pendingApplications ? String(counts.pendingApplications) : undefined,
        },
        {
          to: "/processing/nonconformities",
          label: "Non-conformities",
          icon: AlertTriangle,
          badge: counts.openNonConformities ? String(counts.openNonConformities) : undefined,
        },
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
}

const APPLICANT_NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "My application",
    items: [
      { to: "/processing/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/processing/application", label: "Application", icon: ScrollText },
      { to: "/processing/nonconformities", label: "Findings", icon: AlertTriangle },
      { to: "/processing/inspections", label: "Inspections", icon: ClipboardCheck },
    ],
  },
  {
    group: "My operation",
    items: [
      { to: "/processing/traceability", label: "Operational Traceability", icon: Boxes },
      { to: "/processing/incidents", label: "Incidents", icon: Siren },
    ],
  },
];

function buildRegulatorNav(counts: NavBadgeCounts): { group: string; items: NavItem[] }[] {
  return [
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
        {
          to: "/processing/environmental",
          label: "Environmental Alerts",
          icon: Leaf,
          badge: counts.openEnvironmentalAlerts
            ? String(counts.openEnvironmentalAlerts)
            : undefined,
        },
        { to: "/processing/incidents", label: "Incidents", icon: Siren },
        {
          to: "/processing/nonconformities",
          label: "Non-conformities",
          icon: AlertTriangle,
          badge: counts.openNonConformities ? String(counts.openNonConformities) : undefined,
        },
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
}

/**
 * Closes a popover when a press lands outside it, or on Escape.
 *
 * Listens for `pointerdown` rather than `click` so the menu is gone by the time
 * whatever was underneath reacts — a click handler would leave it hanging open
 * over the page for the rest of the gesture. The toggle button lives inside the
 * returned ref, so pressing it is not "outside": its own handler does the
 * toggling and this one leaves it alone.
 */
function useDismissOnOutside<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = React.useRef<T>(null);

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return ref;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut, notifications, applications, nonConformities, envAlerts } = useAppState();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  const closeNotif = React.useCallback(() => setNotifOpen(false), []);
  const closeProfile = React.useCallback(() => setProfileOpen(false), []);
  const notifRef = useDismissOnOutside<HTMLDivElement>(notifOpen, closeNotif);
  const profileRef = useDismissOnOutside<HTMLDivElement>(profileOpen, closeProfile);

  React.useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Same "still needs attention" semantics the dashboard stat cards use, so a
  // nav badge and the number on the page it links to never disagree.
  const badgeCounts: NavBadgeCounts = {
    pendingApplications: applications.filter((a) => a.stage !== "Decided").length,
    openNonConformities: nonConformities.filter((n) => n.status !== "Closed").length,
    openEnvironmentalAlerts: envAlerts.filter((a) => a.status !== "Resolved").length,
  };

  if (!user) return null;
  const nav =
    user.role === "operator"
      ? buildOperatorNav(badgeCounts)
      : user.role === "processor"
        ? APPLICANT_NAV
        : buildRegulatorNav(badgeCounts);

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
                  pathname === item.to ||
                  (item.to !== "/processing/dashboard" && pathname.startsWith(item.to));
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
        Live register · Beldium Processing Compliance API
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
            <Pill
              tone={
                user.role === "operator"
                  ? "primary"
                  : user.role === "processor"
                    ? "warning"
                    : "info"
              }
            >
              {user.role === "operator"
                ? "Compliance Operator"
                : user.role === "processor"
                  ? "Applicant"
                  : "Oversight · read-only"}
            </Pill>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setProfileOpen(false);
                }}
                className="relative rounded-xl border border-border p-2 hover:bg-accent"
                aria-label="Notifications"
                aria-expanded={notifOpen}
                aria-haspopup="menu"
              >
                <Bell className="size-4" />
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
              </button>
              {notifOpen ? (
                <div className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-border bg-popover p-2 shadow-[0_18px_50px_-20px_rgba(16,30,61,0.5)]">
                  <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Notifications
                  </p>
                  {notifications.length === 0 ? (
                    <p className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                      Nothing needs your attention.
                    </p>
                  ) : null}
                  {notifications.map((n) => {
                    const body = (
                      <>
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              "mt-1 size-2 shrink-0 rounded-full",
                              n.kind === "error"
                                ? "bg-destructive"
                                : n.kind === "warn"
                                  ? "bg-warning"
                                  : "bg-primary",
                            )}
                          />
                          <p className="text-xs font-medium">{n.title}</p>
                          <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                            {n.at}
                          </span>
                        </div>
                        <p className="mt-1 pl-4 text-[11px] text-muted-foreground">{n.body}</p>
                        {n.target ? (
                          <p className="mt-1 pl-4 text-[11px] font-medium text-primary">
                            View record →
                          </p>
                        ) : null}
                      </>
                    );
                    // Only a row that leads somewhere is a link; the rest keep
                    // the same shape without pretending to be clickable.
                    return n.target ? (
                      <Link
                        key={n.id}
                        to={n.target.to}
                        search={n.target.search ?? {}}
                        onClick={() => setNotifOpen(false)}
                        className="block rounded-xl px-3 py-2 text-left hover:bg-accent"
                      >
                        {body}
                      </Link>
                    ) : (
                      <div key={n.id} className="rounded-xl px-3 py-2">
                        {body}
                      </div>
                    );
                  })}
                  <div className="mt-1 flex gap-1 border-t border-border pt-1">
                    <Link
                      to="/processing/nonconformities"
                      onClick={() => setNotifOpen(false)}
                      className="flex-1 rounded-lg px-3 py-2 text-center text-[11px] font-medium hover:bg-accent"
                    >
                      All findings
                    </Link>
                    <Link
                      to="/processing/environmental"
                      onClick={() => setNotifOpen(false)}
                      className="flex-1 rounded-lg px-3 py-2 text-center text-[11px] font-medium hover:bg-accent"
                    >
                      All alerts
                    </Link>
                    <Link
                      to="/processing/inspections"
                      onClick={() => setNotifOpen(false)}
                      className="flex-1 rounded-lg px-3 py-2 text-center text-[11px] font-medium hover:bg-accent"
                    >
                      Inspections
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-border py-1.5 pr-3 pl-1.5 hover:bg-accent"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
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
