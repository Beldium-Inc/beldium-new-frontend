import * as React from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  FileText,
  FolderOpen,
  Gavel,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Map,
  Scale,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useGovernanceMe, type GovernanceCapability } from "@/lib/api";
import { BeldiumLogo } from "@/components/beldium-logo";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoadError, Loading } from "./ui";

type GovernancePath =
  | "/governance/dashboard"
  | "/governance/policies"
  | "/governance/impact"
  | "/governance/regulatory"
  | "/governance/risks"
  | "/governance/compliance"
  | "/governance/stakeholders"
  | "/governance/roadmap"
  | "/governance/copilot"
  | "/governance/documents"
  | "/governance/admin"
  | "/governance/security";

const NAV: {
  to: GovernancePath;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  needs?: GovernanceCapability;
}[] = [
  { to: "/governance/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/governance/policies", label: "Policy Briefing", icon: FileText },
  { to: "/governance/impact", label: "Regulatory Impact", icon: Scale },
  { to: "/governance/regulatory", label: "Regulatory Analysis", icon: Gavel },
  { to: "/governance/risks", label: "Risk Management", icon: ShieldAlert },
  { to: "/governance/compliance", label: "Compliance Intelligence", icon: Activity },
  { to: "/governance/stakeholders", label: "Stakeholder Intelligence", icon: Users },
  { to: "/governance/roadmap", label: "Roadmap & KPIs", icon: Map },
  { to: "/governance/copilot", label: "Governance Copilot", icon: Sparkles },
  { to: "/governance/documents", label: "Documents & Reports", icon: FolderOpen },
  { to: "/governance/admin", label: "Administration", icon: Settings, needs: "manage_access" },
  { to: "/governance/security", label: "Security", icon: KeyRound },
];

export function GovernanceShell({
  children,
  onSignOut,
}: {
  children: React.ReactNode;
  onSignOut: () => void;
}) {
  const { user } = useAuth();
  const me = useGovernanceMe();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);

  const current = NAV.find((n) => pathname.startsWith(n.to));
  const capabilities = me.data?.capabilities;
  const nav = NAV.filter((n) => !n.needs || capabilities?.[n.needs]);

  if (me.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loading label="Opening the governance workspace…" />
      </div>
    );
  }

  if (me.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-4">
          <LoadError error={me.error} />
          <Button variant="outline" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  // Signed in to Beldium but not (or no longer) a governance member: the API
  // would refuse every page, so say why instead of rendering empty screens.
  if (!me.data.role) {
    const status = me.data.status;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 shadow-card">
          <BeldiumLogo className="size-11" />
          <h1 className="font-display text-2xl font-semibold">
            {status === "pending" ? "Access request pending" : "No governance access"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {status === "pending"
              ? "Your request is waiting for a Super Administrator to review it. You will be able to open the workspace once it is approved."
              : status === "suspended"
                ? "Your governance access is suspended. Ask a Super Administrator to restore it."
                : status === "declined"
                  ? `Your access request was declined${me.data.member?.decision_notes ? `: ${me.data.member.decision_notes}` : "."}`
                  : "This account is not a member of the Governance & Risk workspace. Use the link in your invitation email, or request access."}
          </p>
          <div className="flex flex-wrap gap-2">
            {status === "none" && (
              <Button onClick={() => navigate({ to: "/governance/request-access" })}>
                Request access
              </Button>
            )}
            <Button variant="outline" onClick={onSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const sidebar = (
    <>
      <Link to="/governance/dashboard" className="flex items-center gap-2 px-5 py-5">
        <BeldiumLogo />
        <div className="leading-tight">
          <div className="font-display text-base font-semibold text-sidebar-accent-foreground">
            Beldium
          </div>
          <div className="text-xs opacity-70">Governance &amp; Risk</div>
        </div>
      </Link>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Governance">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{
              className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
            }}
          >
            <n.icon className="h-4 w-4" /> {n.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-4 text-xs">
        <div className="truncate font-medium text-sidebar-accent-foreground">
          {user ? `${user.first_name} ${user.last_name}`.trim() || user.email : ""}
        </div>
        <div className="opacity-70">{me.data.role_label}</div>
        <Button
          variant="ghost"
          className="mt-3 w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={onSignOut}
        >
          <LogOut /> Sign out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        {sidebar}
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground">
            <button
              className="absolute top-4 right-4 text-sidebar-foreground"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          title={current?.label ?? "Governance"}
          subtitle="Beldium Governance, Risk & Policy Intelligence"
          onOpenNav={() => setOpen(true)}
          actions={
            <span
              className={cn(
                "rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground",
              )}
            >
              {me.data.role_label}
            </span>
          }
        />
        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
