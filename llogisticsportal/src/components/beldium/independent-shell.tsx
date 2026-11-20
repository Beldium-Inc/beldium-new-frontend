import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ClipboardList,
  FileCheck,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  PackageCheck,
  Route as RouteIcon,
  Settings,
  ShieldCheck,
  Truck,
  User,
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
import { operatorStatus, type OperatorStatus } from "@/lib/independent/model";
import { useIndependent } from "@/lib/independent/store";
import { useAuth } from "@/lib/auth";
import { useIndependentNotifications } from "@/lib/independent/notifications";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard };

const nav: { group: string; items: NavItem[] }[] = [
  {
    group: "Operator",
    items: [
      { title: "Dashboard", url: "/independent/dashboard", icon: LayoutDashboard },
      { title: "Onboarding", url: "/independent/onboarding", icon: ClipboardList },
      { title: "My Profile", url: "/independent/profile", icon: User },
      { title: "My Vehicles", url: "/independent/vehicles", icon: Truck },
      { title: "Driver Credentials", url: "/independent/credentials", icon: FileCheck },
      { title: "Compliance Centre", url: "/independent/compliance", icon: ShieldCheck },
    ],
  },
  {
    group: "Transport",
    items: [
      { title: "Available Assignments", url: "/independent/assignments", icon: Package },
      { title: "My Trips", url: "/independent/trips", icon: RouteIcon },
      { title: "Pickup / Loading", url: "/independent/pickup", icon: Package },
      { title: "Journey Milestones", url: "/independent/journey", icon: MapPin },
      { title: "Proof of Delivery", url: "/independent/delivery", icon: PackageCheck },
    ],
  },
  {
    group: "Account",
    items: [
      { title: "Notifications", url: "/independent/notifications", icon: Bell },
      { title: "Settings", url: "/independent/settings", icon: Settings },
    ],
  },
];

const tone: Record<OperatorStatus, ChipTone> = {
  Draft: "neutral",
  Submitted: "info",
  "Under Review": "warning",
  "Information Requested": "danger",
  "Demo Eligible": "success",
  "Demo Restricted": "danger",
};

export function IndependentShell({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const { workspace, isDemo, user, setSubject } = useIndependent();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const status = operatorStatus(workspace.application, workspace.review);
  const unread = useIndependentNotifications().filter((n) => !n.read).length;
  const a = workspace.application;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <BeldiumLockup tone="light" />
          </SidebarHeader>
          <SidebarContent>
            {nav.map((g) => (
              <SidebarGroup key={g.group}>
                <SidebarGroupLabel>{g.group}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {g.items.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname.startsWith(item.url)}
                          tooltip={item.title}
                        >
                          <Link to={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                        {item.url === "/independent/notifications" && unread > 0 ? (
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
                {`${a.personal["firstName"] ?? ""} ${a.personal["lastName"] ?? ""}`.trim() ||
                  "Independent operator"}
                <span className="text-muted-foreground"> · Independent operator</span>
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {isDemo ? "Seeded demo operator" : user.email}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <StatusChip tone={tone[status]} className="hidden sm:inline-flex">
                {status}
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
          {isDemo ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-warning/40 bg-warning/15 px-4 py-2 text-xs text-warning-foreground md:px-6">
              <span>
                You are viewing the seeded demo operator (approved in a recorded demo decision) so
                the assignment and trip flow can be walked through. Nothing here is a real transport
                record.
              </span>
              <Button size="sm" variant="outline" onClick={() => setSubject("mine")}>
                Back to my record
              </Button>
            </div>
          ) : null}
          <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
