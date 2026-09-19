import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Boxes,
  ClipboardCheck,
  Factory,
  FileText,
  FlaskConical,
  Gauge,
  Handshake,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mountain,
  Receipt,
  Settings,
  ShieldCheck,
  Ship,
  Truck,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";

import { BeldiumLockup } from "@/components/beldium-logo";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { useMyOrganisations } from "@/lib/api/queries";
import { fullName } from "@/lib/api/types";

const reviewNav = [
  { title: "Review overview", url: "/portal", icon: LayoutDashboard },
  { title: "Information requests", url: "/portal/requests", icon: ClipboardCheck },
  { title: "Submitted application", url: "/portal/application-record", icon: FileText },
  { title: "Notifications", url: "/portal/notifications", icon: Bell },
  { title: "Organisation", url: "/portal/organisation", icon: Users },
  { title: "Settings", url: "/portal/settings", icon: Settings },
];

const verifiedNav = [
  { group: "Overview", items: [
    { title: "Dashboard", url: "/portal", icon: LayoutDashboard },
  ] },
  { group: "Marketplace", items: [
    { title: "RFQs", url: "/portal/rfqs", icon: Inbox },
    { title: "Supply Commitments", url: "/portal/commitments", icon: Handshake },
    { title: "My Transactions", url: "/portal/transactions", icon: Receipt },
  ] },
  { group: "Operations", items: [
    { title: "My Organisation", url: "/portal/organisation", icon: Users },
    { title: "Mining Sites", url: "/portal/sites", icon: Mountain },
    { title: "Production", url: "/portal/production", icon: Gauge },
    { title: "Mineral Inventory", url: "/portal/inventory", icon: Boxes },
    { title: "Samples & Quality", url: "/portal/quality", icon: FlaskConical },
  ] },
  { group: "Supply chain", items: [
    { title: "Logistics", url: "/portal/logistics", icon: Truck },
    { title: "Warehousing", url: "/portal/warehousing", icon: Warehouse },
    { title: "Processing", url: "/portal/processing", icon: Factory },
    { title: "Exports", url: "/portal/exports", icon: Ship },
    { title: "Finance & Payments", url: "/portal/finance", icon: Wallet },
  ] },
  { group: "Governance", items: [
    { title: "Compliance", url: "/portal/compliance", icon: ShieldCheck },
    { title: "Documents", url: "/portal/documents", icon: FileText },
    { title: "Reports", url: "/portal/reports", icon: BarChart3 },
    { title: "Notifications", url: "/portal/notifications", icon: Bell },
    { title: "Settings", url: "/portal/settings", icon: Settings },
  ] },
];

export function MinerShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const organisations = useMyOrganisations();
  const org = organisations.data?.results[0] ?? null;
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const verified = org?.verification_status === "verified";

  const groups = verified ? verifiedNav : [{ group: "Verification", items: reviewNav }];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <BeldiumLockup tone="light" subtitle="Miner Hub" />
          </SidebarHeader>
          <SidebarContent>
            {groups.map((g) => (
              <SidebarGroup key={g.group}>
                <SidebarGroupLabel>{g.group}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {g.items.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild isActive={item.url === "/portal" ? pathname === "/portal" : pathname.startsWith(item.url)} tooltip={item.title}>
                          <Link to={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
            <SidebarTrigger />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">
                {org?.name || (user ? fullName(user) : "Miner workspace")}
              </div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {org ? (
                <StatusChip tone={verified ? "success" : "warning"}>
                  {org.verification_status.replace("_", " ")}
                </StatusChip>
              ) : null}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  void signOut();
                  navigate({ to: "/auth" });
                }}
              >
                <LogOut className="mr-1.5 h-4 w-4" /> Sign out
              </Button>
            </div>
          </header>
          <main className="min-w-0 flex-1 p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="text-xs tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold text-card-foreground">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
