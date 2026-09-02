import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  Boxes,
  ClipboardCheck,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Search,
  ShieldCheck,
  Tags,
  X,
} from "lucide-react";
import { ROLE_LABEL, ROLE_PERSONA, useDemo } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/marketplace", label: "Find supply", icon: Search },
  { to: "/rfqs", label: "RFQs", icon: ClipboardCheck },
  { to: "/offers", label: "Offers", icon: Tags },
  { to: "/orders", label: "Orders & contracts", icon: Boxes },
  { to: "/finance", label: "Finance", icon: Landmark },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/compliance", label: "Compliance", icon: ShieldCheck },
  { to: "/notifications", label: "Notifications", icon: Bell },
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

  useEffect(() => {
    if (hydrated && !state.role) navigate({ to: "/", replace: true });
  }, [hydrated, state.role, navigate]);

  useEffect(() => setOpen(false), [pathname]);

  if (!hydrated || !state.role) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading workspace…
      </div>
    );
  }

  const persona = ROLE_PERSONA[state.role];
  const unread = state.notifications.filter(
    (n) => !n.read && (n.audience === state.role || n.audience === "all"),
  ).length;

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "navy-panel fixed inset-y-0 left-0 z-40 flex w-72 flex-col transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-sm font-bold text-primary">
              B
            </span>
            <span className="font-display text-base leading-tight font-semibold">
              Beldium
              <span className="block text-[11px] font-normal tracking-wide text-primary-foreground/60 uppercase">
                Marketplace compliance
              </span>
            </span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {NAV.map((item) => {
            const active =
              pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.to === "/notifications" && unread > 0 && (
                  <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-primary-foreground/10 p-4">
          <div className="mb-3">
            <p className="text-sm font-medium">{persona.name}</p>
            <p className="text-xs text-primary-foreground/60">{persona.org}</p>
            <p className="mt-1 inline-flex rounded bg-primary-foreground/10 px-2 py-0.5 text-[11px]">
              {ROLE_LABEL[state.role]}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/", replace: true });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-primary-foreground/20 px-3 py-2 text-sm font-medium hover:bg-primary-foreground/10"
          >
            <LogOut className="size-4" /> Log out
          </button>
        </div>
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
        <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
          <div className="flex items-start gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <button
              className="mt-1 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold sm:text-xl">{title}</h1>
              {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          Prototype — seeded demo data, no live counterparties or funds.
        </footer>
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
