import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Truck,
  FlaskConical,
  Boxes,
  Map,
  Container,
  CarFront,
  Users,
  PackageCheck,
  Receipt,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Wallet,
  BarChart3,
  Bell,
  Settings,
  Menu,
  X,

} from "lucide-react";

import { cn } from "@/lib/utils";
import { useOps } from "@/lib/ops-store";
import { NetworkSimulator } from "./network-sim";
import { GlobalSearch } from "./global-search";
import { BeldiumLogo } from "@/components/beldium/auth-layout";
import { setState, useOperator } from "@/lib/onboarding-store";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transport-requests", label: "Transport Requests", icon: Inbox },
  { to: "/active-movements", label: "Active Movements", icon: Truck },
  { to: "/sample-logistics", label: "Sample Logistics", icon: FlaskConical },
  { to: "/bulk-logistics", label: "Bulk Logistics", icon: Boxes },
  { to: "/routes-tracking", label: "Routes & Tracking", icon: Map },
  { to: "/fleet", label: "Fleet", icon: Container },
  { to: "/vehicles", label: "Vehicles", icon: CarFront },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/deliveries", label: "Deliveries", icon: PackageCheck },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/incidents", label: "Incidents", icon: AlertTriangle },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/compliance", label: "Compliance", icon: ShieldCheck },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ops = useOps();
  const unread = ops.notifications.filter((n) => !n.read).length;
  const op = useOperator();
  const acc = op.signedIn ? op.account : undefined;
  const orgName = acc ? op.organisation?.name || "My organisation" : "Trans Sahel Ops";
  const initials = acc ? `${acc.firstName[0] ?? ""}${acc.lastName[0] ?? ""}`.toUpperCase() : "TS";
  const roleLabel = acc
    ? op.application?.status === "Approved"
      ? "Verified Logistics Operator"
      : `Application ${op.application?.status ?? "draft"}`
    : "Logistics Operator";

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/" className="flex items-center gap-2.5">
            <BeldiumLogo className="size-9" />
            <span>
              <span className="block text-sm font-semibold leading-none text-white">Beldium</span>
              <span className="mt-1 block text-[11px] leading-none text-sidebar-foreground/70">
                Logistics Operator
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-sidebar-foreground/80 lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{
                className: "bg-sidebar-primary text-sidebar-primary-foreground font-semibold",
              }}
              inactiveProps={{
                className: "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-white",
              }}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors"
            >
              <item.icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.label === "Notifications" && unread > 0 ? (
                <span className="ml-auto rounded-full bg-warning px-1.5 py-0.5 text-[10px] font-bold text-warning-foreground">
                  {unread}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-primary/40 lg:hidden"
        />
      ) : null}

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md border border-border p-1.5 text-foreground lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <GlobalSearch />

          <div className="ml-auto flex items-center gap-3">
            <NetworkSimulator />
            <Link
              to="/notifications"
              className="relative rounded-md border border-border p-1.5 text-foreground hover:border-primary"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {unread > 0 ? (
                <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unread}
                </span>
              ) : null}
            </Link>
            <div className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5">
              <span className="grid size-7 place-items-center rounded-full bg-secondary text-[11px] font-bold text-secondary-foreground">
                {initials}
              </span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-xs font-semibold">{orgName}</span>
                <span className="beldium-small block">{roleLabel}</span>
              </span>
            </div>
            {acc ? (
              <Link to="/sign-in" onClick={() => setState({ signedIn: false })} className="text-xs font-semibold text-colorLink">
                Sign out
              </Link>
            ) : (
              <Link to="/sign-in" className="text-xs font-semibold text-colorLink">
                Sign in
              </Link>
            )}
          </div>
        </header>

        <main className="px-4 py-5 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-primary md:text-2xl">{title}</h1>
        {description ? <p className="beldium-small mt-1 max-w-3xl">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
