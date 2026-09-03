import * as React from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  Building2,
  ClipboardList,
  FileClock,
  FileText,
  Gauge,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareWarning,
  PieChart,
  Search,
  Settings,
  ShieldAlert,
  Truck,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/verticals/logistics/store";
import type { Role } from "@/verticals/logistics/mock-data";
import { BeldiumMark, Pill } from "./bits";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const NAV: Record<Role, { group: string; items: NavItem[] }[]> = {
  operator: [
    {
      group: "Workspace",
      items: [
        { to: "/logistics/operator", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { to: "/logistics/operator/applications", label: "Applications", icon: ClipboardList },
        { to: "/logistics/operator/risk", label: "Risk assessment", icon: Gauge },
        { to: "/logistics/operator/documents", label: "Expiring documents", icon: FileClock },
        { to: "/logistics/operator/requests", label: "Information requests", icon: MessageSquareWarning },
      ],
    },
    {
      group: "Governance",
      items: [
        { to: "/logistics/operator/audit", label: "Audit history", icon: History },
        { to: "/logistics/operator/reports", label: "Reports", icon: PieChart },
        { to: "/logistics/operator/notifications", label: "Notifications", icon: Bell },
        { to: "/logistics/operator/profile", label: "My profile", icon: UserCircle },
      ],
    },
  ],
  partner: [
    {
      group: "Company",
      items: [
        { to: "/logistics/partner", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { to: "/logistics/partner/application", label: "Application progress", icon: ClipboardList },
        { to: "/logistics/partner/requests", label: "Information requests", icon: MessageSquareWarning },
        { to: "/logistics/partner/company", label: "Company information", icon: Building2 },
      ],
    },
    {
      group: "Operations",
      items: [
        { to: "/logistics/partner/fleet", label: "Fleet", icon: Truck },
        { to: "/logistics/partner/drivers", label: "Drivers", icon: Users },
        { to: "/logistics/partner/documents", label: "Documents", icon: FileText },
        { to: "/logistics/partner/activity", label: "Activity", icon: History },
      ],
    },
  ],
  regulator: [
    {
      group: "Oversight",
      items: [
        { to: "/logistics/regulator", label: "Overview", icon: LayoutDashboard, exact: true },
        { to: "/logistics/regulator/operators", label: "Registered operators", icon: Building2 },
        { to: "/logistics/regulator/compliance", label: "Compliance status", icon: Gauge },
        { to: "/logistics/regulator/expiring", label: "Expiring credentials", icon: FileClock },
      ],
    },
    {
      group: "Intelligence",
      items: [
        { to: "/logistics/regulator/alerts", label: "Regulatory alerts", icon: ShieldAlert },
        { to: "/logistics/regulator/reports", label: "Reports", icon: PieChart },
        { to: "/logistics/regulator/notifications", label: "Notifications", icon: Bell },
      ],
    },
  ],
  admin: [
    {
      group: "Platform",
      items: [
        { to: "/logistics/admin", label: "Admin overview", icon: Settings, exact: true },
      ],
    },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  operator: "Compliance Operations",
  partner: "Logistics Partner Portal",
  regulator: "Regulatory Oversight",
  admin: "Beldium Admin",
};

export function AppShell({
  role,
  children,
  breadcrumbs,
  search,
}: {
  role: Role;
  children: React.ReactNode;
  breadcrumbs: { label: string; to?: string }[];
  search?: { value: string; onChange: (v: string) => void; placeholder: string };
}) {
  const { session, signOut, notifications, hydrated } = useApp();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (hydrated && (!session || session.role !== role)) {
      navigate({ to: "/" });
    }
  }, [hydrated, session, role, navigate]);

  React.useEffect(() => setOpen(false), [pathname]);

  if (!session || session.role !== role) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  const unread = notifications.filter((n) => n.audience.includes(role) && !n.read).length;

  const sidebar = (
    <div className="flex h-full flex-col bg-[var(--brand)]">
      <div className="border-b border-white/10 px-5 py-4">
        <BeldiumMark dark />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV[role].map((group) => (
          <div key={group.group}>
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.14em] text-white/40 uppercase">
              {group.group}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    activeOptions={{ exact: item.exact ?? false }}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white data-[status=active]:bg-white/12 data-[status=active]:font-medium data-[status=active]:text-white"
                    activeProps={{ className: "bg-white/15 text-white font-medium" }}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs font-medium text-white">{session.person}</p>
          <p className="mt-0.5 text-[11px] text-white/50">{session.title}</p>
          <p className="text-[11px] text-white/50">{session.org}</p>
          <button
            type="button"
            onClick={() => {
              signOut();
              navigate({ to: "/" });
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-white/20 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[var(--brand)]/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 -right-10 rounded-md bg-white/90 p-1.5 text-[var(--brand)]"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-white/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              className="rounded-md border border-border p-1.5 text-[var(--brand)] lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <Pill tone="info" className="hidden sm:inline-flex">
              {ROLE_LABEL[role]}
            </Pill>
            {search ? (
              <div className="relative ml-auto w-full max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search.value}
                  onChange={(e) => search.onChange(e.target.value)}
                  placeholder={search.placeholder}
                  className="w-full rounded-lg border border-input bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-[var(--link)] focus:ring-2 focus:ring-[var(--link)]/20"
                />
              </div>
            ) : (
              <div className="ml-auto" />
            )}
            <Link
              to={role === "operator" ? "/logistics/operator/notifications" : role === "partner" ? "/logistics/partner" : role === "regulator" ? "/logistics/regulator/notifications" : "/logistics/admin"}
              className="relative rounded-lg border border-border p-2 text-[var(--brand)] transition hover:border-[var(--link)]/40"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-semibold text-white">
                  {unread}
                </span>
              ) : null}
            </Link>
            <div className="hidden items-center gap-2 rounded-lg border border-border py-1.5 pr-3 pl-1.5 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--brand-soft)] text-xs font-semibold text-[var(--brand)]">
                {session.person
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <span className="text-xs leading-tight">
                <span className="block font-medium text-[var(--brand)]">{session.person}</span>
                <span className="block text-muted-foreground">{session.org}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                signOut();
                navigate({ to: "/" });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-medium text-white transition hover:bg-[var(--brand)]/90"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto border-t border-border px-4 py-2 text-xs text-muted-foreground sm:px-6">
            {breadcrumbs.map((b, i) => (
              <span key={`${b.label}-${i}`} className="flex items-center gap-1.5 whitespace-nowrap">
                {i > 0 ? <span className="text-border">/</span> : null}
                {b.to ? (
                  <Link to={b.to} className="text-[var(--link)] hover:underline">
                    {b.label}
                  </Link>
                ) : (
                  <span className="font-medium text-[var(--brand)]">{b.label}</span>
                )}
              </span>
            ))}
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function ComplianceBanner({
  tone = "warning",
  title,
  body,
}: {
  tone?: "warning" | "danger" | "info";
  title: string;
  body: string;
}) {
  const styles = {
    warning: "border-[var(--warning)]/60 bg-[var(--warning)]/15 text-[var(--warning-foreground)]",
    danger: "border-[var(--danger)]/50 bg-[var(--danger)]/15 text-[var(--danger-foreground)]",
    info: "border-[#b9d3fb] bg-[var(--brand-soft)]/60 text-[var(--brand)]",
  }[tone];
  return (
    <div className={cn("mb-6 flex items-start gap-3 rounded-xl border px-4 py-3", styles)}>
      <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs opacity-90">{body}</p>
      </div>
    </div>
  );
}
