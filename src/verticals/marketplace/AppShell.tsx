import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  Boxes,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Search,
  ShieldCheck,
  Tags,
  X,
} from "lucide-react";
import { ROLE_LABEL, ROLE_PERSONA, useDemo } from "@/verticals/marketplace/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BeldiumLogo } from "@/components/beldium-logo";
import { DashboardHeader } from "@/components/dashboard-header";

const NAV = [
  { to: "/marketplace/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/marketplace/marketplace", label: "Find supply", icon: Search },
  { to: "/marketplace/rfqs", label: "RFQs", icon: ClipboardCheck },
  { to: "/marketplace/offers", label: "Offers", icon: Tags },
  { to: "/marketplace/orders", label: "Orders & contracts", icon: Boxes },
  { to: "/marketplace/finance", label: "Finance", icon: Landmark },
  { to: "/marketplace/documents", label: "Documents", icon: FileText },
  { to: "/marketplace/compliance", label: "Compliance", icon: ShieldCheck },
  { to: "/marketplace/notifications", label: "Notifications", icon: Bell },
] as const;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string | undefined;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { state, hydrated, logout } = useDemo();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem("marketplace-nav-collapsed") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (hydrated && !state.role) navigate({ to: "/signin", replace: true });
  }, [hydrated, state.role, navigate]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    try {
      window.localStorage.setItem("marketplace-nav-collapsed", collapsed ? "1" : "0");
    } catch {
      // ignore write failures (private mode, disabled storage)
    }
  }, [collapsed]);

  if (!state.role) return null;

  const persona = ROLE_PERSONA[state.role];
  const unread = state.notifications.filter(
    (n) => !n.read && (n.audience === state.role || n.audience === "all"),
  ).length;

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "navy-panel fixed inset-y-0 left-0 z-40 flex max-w-[85vw] flex-col transition-[transform,width] duration-200 lg:sticky lg:top-0 lg:h-screen lg:max-w-none lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-72 lg:w-20" : "w-72",
        )}
      >
        <div
          className={cn(
            "flex items-center py-6",
            collapsed ? "justify-center px-3 lg:px-3" : "justify-between px-6",
          )}
        >
          <Link
            to="/marketplace/dashboard"
            className={cn("flex items-center gap-2.5", collapsed && "lg:justify-center")}
          >
            <BeldiumLogo className="size-10 shrink-0 rounded-3xl" />
            <span
              className={cn(
                "font-display text-base leading-tight font-semibold",
                collapsed && "lg:hidden",
              )}
            >
              Beldium
              <span className="block text-[11px] font-normal tracking-wide text-primary-foreground/60 uppercase">
                Marketplace compliance
              </span>
            </span>
          </Link>
          <button
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {NAV.map((item) => {
            const active =
              pathname === item.to ||
              (item.to !== "/marketplace/dashboard" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-3xl px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed && "lg:justify-center",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className={cn("flex-1", collapsed && "lg:hidden")}>{item.label}</span>
                {item.to === "/marketplace/notifications" && unread > 0 && (
                  <span
                    className={cn(
                      "rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground",
                      collapsed && "lg:absolute lg:top-1 lg:right-1",
                    )}
                  >
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            "border-t border-primary-foreground/10 p-4",
            collapsed && "lg:flex lg:flex-col lg:items-center",
          )}
        >
          <div className={cn("mb-3", collapsed && "lg:hidden")}>
            <p className="text-sm font-medium">{persona.name}</p>
            <p className="text-xs text-primary-foreground/60">{persona.org}</p>
            <p className="mt-1 inline-flex rounded bg-primary-foreground/10 px-2 py-0.5 text-[11px]">
              {ROLE_LABEL[state.role]}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/signin", replace: true });
            }}
            title={collapsed ? "Log out" : undefined}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md border border-primary-foreground/20 px-3 py-2 text-sm font-medium hover:bg-primary-foreground/10",
              collapsed && "lg:w-auto lg:px-2.5",
            )}
          >
            <LogOut className="size-4 shrink-0" />
            <span className={cn(collapsed && "lg:hidden")}>Log out</span>
          </button>
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

      {open && (
        <div
          className="fixed inset-0 z-30 bg-primary/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          title={title}
          subtitle={subtitle}
          actions={actions}
          onOpenNav={() => setOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-md border border-secondary bg-secondary/40 px-3 py-2 text-xs text-primary">
      <ScrollText className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function Metric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  tone?: "default" | "warning" | "success" | "danger" | undefined;
}) {
  return (
    <div className="surface p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p
        className={cn(
          "font-display mt-2 text-2xl font-semibold",
          tone === "warning" && "text-warning-foreground",
          tone === "success" && "text-success",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string | undefined;
  actions?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <section className={cn("surface p-5", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export { Button };
