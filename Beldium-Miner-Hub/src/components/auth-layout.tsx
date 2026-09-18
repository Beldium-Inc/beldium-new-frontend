import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import mineralRocks from "@/assets/mineral-rocks.gif.asset.json";

import { BeldiumLockup } from "@/components/beldium-logo";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <aside
          className="relative hidden w-full flex-col justify-between overflow-hidden bg-sidebar p-10 lg:flex lg:w-2/5 xl:w-1/3"
        >
          <div className="absolute inset-0" aria-hidden>
            <img src={mineralRocks.url} alt="" className="h-full w-full object-cover" />
          </div>

          <div className="absolute inset-0 bg-sidebar/90" aria-hidden />
          <Link to="/" className="relative">
            <BeldiumLockup tone="light" />
          </Link>
          <div className="relative space-y-5 text-sidebar-foreground">
            <h2 className="text-3xl leading-tight font-semibold">
              Verified mining operations, on one record.
            </h2>
            <p className="text-sm text-sidebar-foreground/75">
              Register your mining organisation, declare sites and equipment, respond to reviewer
              requests, and run production, inventory and compliance from a single miner workspace.
            </p>
            <ul className="space-y-2 text-sm text-sidebar-foreground/75">
              <li>* Role based miner and organisation access</li>
              <li>* 8 step organisation application with saved progress</li>
              <li>* Live review timeline and evidence responses</li>
            </ul>
          </div>
          <p className="relative text-xs text-sidebar-foreground/50">
             {"\n"}
          </p>
        </aside>

        <main className="flex w-full flex-1 items-center justify-center p-6 sm:p-10">
          <div className={wide ? "w-full max-w-2xl" : "w-full max-w-md"}>
            <Link to="/" className="mb-8 inline-flex lg:hidden">
              <BeldiumLockup />
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-8 text-sm text-muted-foreground">{footer}</div> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
