import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  Boxes,
  Building2,
  ChartLine,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Files,
  FlaskConical,
  Gauge,
  HardHat,
  History,
  Inbox,
  Leaf,
  LogOut,
  Menu,
  Mountain,
  Receipt,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useStore } from "@/verticals/mining/store";
import { navForRole } from "./nav";
import { Chip } from "./chips";
import { BeldiumLogo } from "@/components/beldium-logo";

const icons: Record<string, typeof Gauge> = {
  gauge: Gauge,
  inbox: Inbox,
  building: Building2,
  mountain: Mountain,
  clipboard: ClipboardList,
  files: Files,
  hardhat: HardHat,
  flask: FlaskConical,
  leaf: Leaf,
  shield: ShieldCheck,
  alert: AlertTriangle,
  chart: ChartLine,
  history: History,
  boxes: Boxes,
  receipt: Receipt,
};

const roleLabel = {
  partner: "Mining Compliance Partner",
  miner: "Miner",
  regulator: "Regulatory Oversight",
} as const;

export function Shell({ children }: { children: ReactNode }) {
  const { role, user: account, logout, notifications, markNotificationsRead } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem("mining-nav-collapsed") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("mining-nav-collapsed", collapsed ? "1" : "0");
    } catch {
      // ignore write failures (private mode, disabled storage)
    }
  }, [collapsed]);

  if (!role) return null;
  const user = account ?? { name: "", initials: "??", title: "" };
  const items = navForRole(role);
  const groups = [...new Set(items.map((i) => i.group))];
  const mine = notifications.filter((n) => n.audience.includes(role));
  const unread = mine.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate({ to: "/signin", replace: true });
  };

  const sidebar = (collapsedDesktop: boolean) => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          "flex items-center gap-2.5 px-5 py-5",
          collapsedDesktop && "lg:justify-center lg:px-3",
        )}
      >
        <BeldiumLogo className="size-10 shrink-0 rounded-3xl" />
        <div className={cn("leading-tight", collapsedDesktop && "lg:hidden")}>
          <p className="font-display text-sm font-semibold text-sidebar-accent-foreground">
            Beldium
          </p>
          <p className="block text-[11px] font-normal tracking-wide text-primary-foreground/60 uppercase">
            Mining Compliance
          </p>
        </div>
      </div>
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-5 pb-6">
          {groups.map((group) => (
            <div key={group}>
              <p
                className={cn(
                  "px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50",
                  collapsedDesktop && "lg:hidden",
                )}
              >
                {group}
              </p>
              <ul className="space-y-0.5">
                {items
                  .filter((i) => i.group === group)
                  .map((item) => {
                    const Icon = icons[item.icon] ?? Gauge;
                    const active =
                      pathname === item.to ||
                      (item.to !== "/mining/dashboard" && pathname.startsWith(item.to));
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          title={collapsedDesktop ? item.label : undefined}
                          className={cn(
                            "flex items-center gap-2.5 rounded-3xl px-2.5 py-2 text-[13px] font-medium transition-colors",
                            collapsedDesktop && "lg:justify-center",
                            active
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className={cn("truncate", collapsedDesktop && "lg:hidden")}>
                            {item.label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 transition-[width] duration-200 lg:block",
          collapsed ? "lg:w-20" : "w-64",
        )}
      >
        {sidebar(collapsed)}
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

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64 max-w-[85vw] shadow-panel lg:max-w-none">{sidebar(false)}</div>
          <button
            aria-label="Close navigation"
            className="flex-1 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-surface px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          <div className="min-w-0 flex-1">
            <Chip tone="info" className="hidden sm:inline-flex">
              {roleLabel[role]}
            </Chip>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Notifications"
                onClick={() => markNotificationsRead()}
              >
                <Bell className="size-5" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-danger text-[9px] font-bold text-danger-foreground">
                    {unread}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-88 p-0">
              <div className="border-b border-border px-4 py-3">
                <p className="font-display text-sm font-semibold">Notifications</p>
              </div>
              <ScrollArea className="max-h-80">
                <ul className="divide-y divide-border">
                  {mine.slice(0, 12).map((n) => (
                    <li key={n.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-medium">{n.title}</p>
                        <Chip
                          tone={
                            n.tone === "positive"
                              ? "success"
                              : n.tone === "negative"
                                ? "danger"
                                : n.tone === "warning"
                                  ? "warning"
                                  : "neutral"
                          }
                        >
                          {n.tone === "positive"
                            ? "Update"
                            : n.tone === "negative"
                              ? "Action"
                              : "Notice"}
                        </Chip>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/70">{n.at}</p>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-3 border-l border-border pl-3">
            <div className="hidden text-right sm:block">
              <p className="text-[13px] leading-tight font-semibold">{user.name}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">{user.title}</p>
            </div>
            <div className="grid size-9 place-items-center rounded-full bg-brand-soft font-display text-xs font-bold text-brand">
              {user.initials}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" /> <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
