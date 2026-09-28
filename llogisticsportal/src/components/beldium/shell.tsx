import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CarFront,
  ClipboardCheck,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Map,
  PackageCheck,
  Receipt,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import { BeldiumLockup } from "@/components/beldium-logo";
import { StatusChip, type ChipTone } from "@/components/status-chip";
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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { fullName } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { useOperationsDashboard } from "@/lib/api/operations-queries";
import { STAGE_LABELS, isVerified, useWorkspace, type WorkspaceStage } from "@/lib/workspace";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard };

const reviewNav: NavItem[] = [
  { title: "Review overview", url: "/portal", icon: LayoutDashboard },
  { title: "Information requests", url: "/portal/requests", icon: ClipboardCheck },
  { title: "Submitted application", url: "/portal/application-record", icon: FileText },
  { title: "Notifications", url: "/portal/notifications", icon: Bell },
  { title: "Settings", url: "/portal/settings", icon: Settings },
];

const verifiedNav: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",
    items: [{ title: "Command Centre", url: "/portal", icon: LayoutDashboard }],
  },
  {
    group: "Movements",
    items: [
      { title: "Transport Requests", url: "/portal/transport-requests", icon: Inbox },
      { title: "Movements", url: "/portal/movements", icon: Truck },
      { title: "Tracking", url: "/portal/tracking", icon: Map },
      { title: "Deliveries", url: "/portal/deliveries", icon: PackageCheck },
    ],
  },
  {
    group: "Fleet & people",
    items: [
      { title: "Vehicles", url: "/portal/vehicles", icon: CarFront },
      { title: "Drivers", url: "/portal/drivers", icon: Users },
    ],
  },
  {
    group: "Commercial",
    items: [
      { title: "Transactions", url: "/portal/transactions", icon: Receipt },
      { title: "Payments", url: "/portal/payments", icon: Wallet },
    ],
  },
  {
    group: "Governance",
    items: [
      { title: "Incidents", url: "/portal/incidents", icon: AlertTriangle },
      { title: "Compliance", url: "/portal/compliance", icon: ShieldCheck },
      { title: "Documents", url: "/portal/documents", icon: FileText },
      { title: "Reports", url: "/portal/reports", icon: BarChart3 },
      { title: "Notifications", url: "/portal/notifications", icon: Bell },
      { title: "Settings", url: "/portal/settings", icon: Settings },
    ],
  },
];

const stageTone: Record<WorkspaceStage, ChipTone> = {
  none: "neutral",
  join_pending: "warning",
  draft: "neutral",
  under_review: "warning",
  information_required: "danger",
  verified: "success",
  rejected: "danger",
};

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { record, pendingJoin } = useWorkspace();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const stage = record?.stage ?? (pendingJoin ? "join_pending" : "none");
  const verified = isVerified(stage);
  const groups = verified ? verifiedNav : [{ group: "Verification", items: reviewNav }];
  const dashboard = useOperationsDashboard({ enabled: verified });
  const unread = verified ? (dashboard.data?.stats.unread_notifications ?? 0) : 0;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <BeldiumLockup tone="light" />
          </SidebarHeader>
          <SidebarContent>
            {groups.map((g) => (
              <SidebarGroup key={g.group}>
                <SidebarGroupLabel>{g.group}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {g.items.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={
                            item.url === "/portal"
                              ? pathname === "/portal" || pathname === "/portal/"
                              : pathname.startsWith(item.url)
                          }
                          tooltip={item.title}
                        >
                          <Link to={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                        {item.url === "/portal/notifications" && unread > 0 ? (
                          <SidebarMenuBadge className="text-sidebar-primary">
                            {unread}
                          </SidebarMenuBadge>
                        ) : null}
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
                {record?.organisationName || (user ? fullName(user) : "Logistics workspace")}
              </div>
              <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <StatusChip tone={stageTone[stage]} className="hidden sm:inline-flex">
                {STAGE_LABELS[stage]}
              </StatusChip>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  void signOut();
                  navigate({ to: "/auth" });
                }}
              >
                <LogOut className="mr-1.5 h-4 w-4" />{" "}
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </header>
          <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Same as `actions`; kept for screens written before the Miner Hub alignment. */
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ?? children}
    </div>
  );
}
