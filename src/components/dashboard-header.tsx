import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The one header every sector dashboard renders inside its AppShell. Actions
 * drop to their own row under the title on narrow screens instead of being
 * squeezed beside a truncating heading (the layout that was cramming a menu
 * button, title, and a wide action button onto one line on mobile).
 */
export function DashboardHeader({
  title,
  subtitle,
  actions,
  onOpenNav,
  className,
}: {
  title: string;
  subtitle?: string | undefined;
  actions?: ReactNode;
  /** Omit when this vertical has no mobile drawer/overlay to open; the menu button is skipped rather than rendered inert. */
  onOpenNav?: (() => void) | undefined;
  className?: string | undefined;
}) {
  return (
    <header className={cn("sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur", className)}>
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex min-w-0 items-start gap-3">
          {onOpenNav && (
            <button
              className="mt-0.5 shrink-0 lg:hidden"
              onClick={onOpenNav}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold sm:text-xl">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">{actions}</div>
        )}
      </div>
    </header>
  );
}
