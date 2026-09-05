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
  BadgeCheck,
  Warehouse,
} from "lucide-react";
import { ROLES, roleById, type RoleId } from "@/verticals/warehousing/data";
import { useSession } from "@/lib/session";
import { useDemo } from "@/verticals/warehousing/store";
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
import { BeldiumLogo } from "@/components/beldium-logo";

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
    { to: "/warehousing/partner", label: "Reviewer dashboard", icon: "LayoutDashboard" },
    { to: "/warehousing/partner/applications", label: "Applications", icon: "FileText" },
    { to: "/warehousing/partner/facilities", label: "Warehouse register", icon: "Warehouse" },
    { to: "/warehousing/partner/inspections", label: "Inspections", icon: "ClipboardCheck" },
    { to: "/warehousing/partner/non-conformities", label: "Non-conformities", icon: "FileWarning" },
    { to: "/warehousing/partner/alerts", label: "Monitoring alerts", icon: "Bell" },
    { to: "/warehousing/partner/audit", label: "Audit history", icon: "ScrollText" },
  ],
  operator: [
    { to: "/warehousing/operator", label: "Operations dashboard", icon: "LayoutDashboard" },
    { to: "/warehousing/operator/facility", label: "Facility profile", icon: "Warehouse" },
    { to: "/warehousing/operator/locations", label: "Storage locations", icon: "MapPin" },
    { to: "/warehousing/operator/inventory", label: "Inventory & batches", icon: "Boxes" },
    { to: "/warehousing/operator/receive", label: "Receive shipment", icon: "PackagePlus" },
    { to: "/warehousing/operator/releases", label: "Release authorisation", icon: "Truck" },
    { to: "/warehousing/operator/documents", label: "Documents", icon: "FileText" },
    { to: "/warehousing/operator/incidents", label: "Incidents", icon: "Siren" },
  ],
  regulator: [
    { to: "/warehousing/regulator", label: "Oversight dashboard", icon: "LayoutDashboard" },
    { to: "/warehousing/regulator/facilities", label: "Registered facilities", icon: "Building2" },
    { to: "/warehousing/regulator/certificates", label: "Certificates", icon: "BadgeCheck" },
    { to: "/warehousing/regulator/inspections", label: "Inspections", icon: "ClipboardCheck" },
    { to: "/warehousing/regulator/incidents", label: "Incidents & alerts", icon: "ShieldAlert" },
    { to: "/warehousing/regulator/reports", label: "Reports", icon: "Gauge" },
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
  const { roleId, signOut } = useDemo();
  const { signIn } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profile = roleById(role);

  useEffect(() => {
    if (roleId === null) navigate({ to: "/signin", replace: true });
    else if (roleId !== role) navigate({ to: roleById(roleId).home, replace: true });
  }, [roleId, role, navigate]);

  if (roleId !== role) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col bg-sidebar px-4 py-6 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3 px-2">
          <BeldiumLogo className="size-10" />
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
                        signIn("warehousing", r.id);
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
                      navigate({ to: "/signin" });
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
          Beldium Warehousing Compliance, front-end prototype with sample data for demonstration only.
        </footer>
      </div>
    </div>
  );
}
