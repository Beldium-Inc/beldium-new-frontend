import { cn } from "@/lib/utils";

/**
 * Shared Beldium brand mark, used by the sign-in hub and every vertical shell.
 *
 * The artwork in public/logo.png is a navy mark on a transparent background, so
 * it is always set on a light tile; most of the dashboard sidebars are dark navy
 * and the mark would otherwise disappear into them.
 *
 * Sizing and corner radius come from `className` (tailwind-merge lets a caller's
 * `size-*` / `rounded-*` win over the defaults here).
 */
export function BeldiumLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-white",
        className,
      )}
    >
      {/* Decorative: the "Beldium" wordmark sits next to this at every call site. */}
      <img src="/logo.png" alt="" aria-hidden className="size-[78%] object-contain" />
    </span>
  );
}
