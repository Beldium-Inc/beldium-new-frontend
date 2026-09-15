import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import * as React from "react";
import {
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  FlaskConical,
  Gauge,
  HandCoins,
  LayoutList,
  LogOut,
  Mountain,
  Receipt,
  ShieldCheck,
  Ship,
  Truck,
  Warehouse,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSignOut } from "@/lib/sign-out";
import { BeldiumLogo } from "@/components/beldium-logo";

// The Miner Hub's shell — a single, self-contained workspace spanning
// marketplace, operations, supply chain and governance. Every nav entry
// below resolves to a real Hub-native route (`/miner/*`) rendered inside
// this shell; nothing links out to the separate `/mining/*` tool.

type NavItem = { label: string; to: string; icon: React.ComponentType<{ className?: string }>; group: string };

const NAV: NavItem[] = [
  { label: "Overview", to: "/miner/dashboard", icon: Gauge, group: "Overview" },
  { label: "RFQs", to: "/miner/rfqs", icon: FileText, group: "Marketplace" },
  { label: "Supply Commitments", to: "/miner/commitments", icon: LayoutList, group: "Marketplace" },
  { label: "My Transactions", to: "/miner/transactions", icon: Receipt, group: "Marketplace" },
  { label: "My Organisation", to: "/miner/organisation", icon: Building2, group: "Operations" },
  { label: "Mining Sites", to: "/miner/sites", icon: Mountain, group: "Operations" },
  { label: "Production", to: "/miner/production", icon: Boxes, group: "Operations" },
  { label: "Mineral Inventory", to: "/miner/inventory", icon: Warehouse, group: "Operations" },
  { label: "Samples & Quality", to: "/miner/quality", icon: FlaskConical, group: "Operations" },
  { label: "Logistics", to: "/miner/logistics", icon: Truck, group: "Supply chain" },
  { label: "Warehousing", to: "/miner/warehousing", icon: Warehouse, group: "Supply chain" },
  { label: "Processing", to: "/miner/processing", icon: Boxes, group: "Supply chain" },
  { label: "Exports", to: "/miner/exports", icon: Ship, group: "Supply chain" },
  { label: "Finance & Payments", to: "/miner/finance", icon: HandCoins, group: "Supply chain" },
  { label: "Compliance", to: "/miner/compliance", icon: ShieldCheck, group: "Governance" },
  { label: "Documents", to: "/miner/documents", icon: FileText, group: "Governance" },
  { label: "Reports", to: "/miner/reports", icon: ClipboardList, group: "Governance" },
];

const GROUPS = ["Overview", "Marketplace", "Operations", "Supply chain", "Governance"];

export function MinerHubShell({ children }: { children: React.ReactNode }) {
  const signOut = useSignOut();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-5">
          <BeldiumLogo className="size-7" />
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold text-sidebar-foreground">Beldium Miner Hub</p>
            <p className="text-[11px] text-sidebar-foreground/60">Ijero Lithium Pit A</p>
          </div>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {GROUPS.map((group) => (
            <div key={group}>
              <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-wide text-sidebar-foreground/50 uppercase">
                {group}
              </p>
              <div className="space-y-0.5">
                {NAV.filter((item) => item.group === group).map((item) => {
                  const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            onClick={() => {
              signOut();
              navigate({ to: "/miner-portal" });
            }}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
