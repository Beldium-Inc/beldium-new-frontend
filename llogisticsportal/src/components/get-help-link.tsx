import { LifeBuoy } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { supportUrl } from "@/lib/support";
import { cn } from "@/lib/utils";

/**
 * The one "Get help" link every portal header shows (OR-013). Its target is
 * the single VITE_SUPPORT_URL value; see src/lib/support.ts.
 * `compact` hides the label on narrow screens and keeps the icon.
 */
export function GetHelpLink({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const href = supportUrl();
  const external = /^https?:/i.test(href);
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5", className)}
      aria-label={compact ? "Get help" : undefined}
    >
      <LifeBuoy className="size-4" aria-hidden />
      <span className={compact ? "hidden sm:inline" : undefined}>Get help</span>
    </a>
  );
}
