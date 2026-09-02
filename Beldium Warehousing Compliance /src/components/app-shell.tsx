import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  Bell,
  Boxes,
  Building2,
  ClipboardCheck,
  FileText,
  FileWarning,
  Gauge,
  LayoutDashboard,
  LogOut,
  MapPin,
  PackagePlus,
  Repeat,
  ScrollText,
  ShieldAlert,
  Siren,
  Truck,
  Warehouse,
  BadgeCheck,
} from "lucide-react";
import { ROLES, roleById, type RoleId } from "@/lib/demo/data";
import { useDemo } from "@/lib/demo/store";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const ICONS = {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Warehouse,
  FileWarning,
  Bell,
  ScrollText,
  Boxes,
  MapPin,
  PackagePlus,
  Truck,
  Siren,
  Building2,
  BadgeCheck,
  ShieldAlert,
  Gauge,
} as const;

type IconName = keyof typeof ICONS;

const NAV: Record<RoleId, { to: string; label: string; icon: IconName }[]> = {
  partner: [
    { to: "/partner", label: "Reviewer dashboard", icon: "LayoutDashboard" },
    { to: "/partner/applications", label: "Applications", icon: "FileText" },
    { to: "/partner/facilities", label: "Warehouse register", icon: "Warehouse" },
    { to: "/partner/inspections", label: "Inspections", icon: "ClipboardCheck" },
    { to: "/partner/non-conformities", label: "Non-conformities", icon: "FileWarning" },
    { to: "/partner/alerts", label: "Monitoring alerts", icon: "Bell" },
    { to: "/partner/audit", label: "Audit history", icon: "ScrollText" },
  ],
  operator: [
    { to: "/operator", label: "Operations dashboard", icon: "LayoutDashboard" },
    { to: "/operator/facility", label: "Facility profile", icon: "Warehouse" },
    { to: "/operator/locations", label: "Storage locations", icon: "MapPin" },
    { to: "/operator/inventory", label: "Inventory & batches", icon: "Boxes" },
    { to: "/operator/receive", label: "Receive shipment", icon: "PackagePlus" },
    { to: "/operator/releases", label: "Release authorisation", icon: "Truck" },
    { to: "/operator/documents", label: "Documents", icon: "FileText" },
    { to: "/operator/incidents", label: "Incidents", icon: "Siren" },
  ],
  regulator: [
    { to: "/regulator", label: "Oversight dashboard", icon: "LayoutDashboard" },
    { to: "/regulator/facilities", label: "Registered facilities", icon: "Building2" },
    { to: "/regulator/certificates", label: "Certificates", icon: "BadgeCheck" },
    { to: "/regulator/inspections", label: "Inspections", icon: "ClipboardCheck" },
    { to: "/regulator/incidents", label: "Incidents & alerts", icon: "ShieldAlert" },
    { to: "/regulator/reports", label: "Reports", icon: "Gauge" },
  ],
};

export function AppShell({
  role,
  title,
  subtitle,
  actions,
  children,
}: {
  role: RoleId;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { roleId, signIn, signOut } = useDemo();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profile = roleById(role);

  useEffect(() => {
    if (roleId === null) navigate({ to: "/", replace: true });
    else if (roleId !== role) navigate({ to: roleById(roleId).home, replace: true });
  }, [roleId, role, navigate]);

  if (roleId !== role) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col bg-sidebar px-4 py-6 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Warehouse className="size-5" />
          </div>
          <div>
            <p className="font-heading text-sm font-semibold text-sidebar-accent-foreground">Beldium</p>
            <p className="text-xs text-sidebar-foreground/70">Warehousing Compliance</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV[role].map((item) => {
            const Icon = ICONS[item.icon];
            const active = item.to === profile.home ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-2xl bg-sidebar-accent p-4 text-xs text-sidebar-accent-foreground/80">
          <p className="font-heading font-semibold text-sidebar-accent-foreground">Demo environment</p>
          <p className="mt-1 leading-relaxed">
            Sample Nigerian mineral warehousing data. No live records, no backend.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <h1 className="truncate font-heading text-xl font-semibold text-primary">{title}</h1>
              {subtitle ? <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            <div className="flex items-center gap-3">
              {actions}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-11 gap-3 rounded-xl border-border pl-2 pr-3">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-secondary font-heading text-xs font-semibold text-secondary-foreground">
                      {profile.initials}
                    </span>
                    <span className="hidden text-left leading-tight sm:block">
                      <span className="block text-sm font-medium text-foreground">{profile.person}</span>
                      <span className="block text-xs text-muted-foreground">{profile.title}</span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 rounded-2xl">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Signed in as {profile.demoEmail}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
                    Switch role
                  </DropdownMenuLabel>
                  {ROLES.filter((r) => r.id !== role).map((r) => (
                    <DropdownMenuItem
                      key={r.id}
                      className="gap-2 rounded-lg"
                      onSelect={() => {
                        signIn(r.id);
                        navigate({ to: r.home });
                      }}
                    >
                      <Repeat className="size-4" />
                      <span className="text-sm">{r.title}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 rounded-lg"
                    onSelect={() => {
                      signOut();
                      navigate({ to: "/" });
                    }}
                  >
                    <LogOut className="size-4" />
                    <span className="text-sm">Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden">
            {NAV[role].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-muted-foreground data-[status=active]:bg-secondary data-[status=active]:text-secondary-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-8">{children}</main>

        <footer className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
          Beldium Warehousing Compliance — front-end prototype with sample data for demonstration only.
        </footer>
      </div>
    </div>
  );
}
