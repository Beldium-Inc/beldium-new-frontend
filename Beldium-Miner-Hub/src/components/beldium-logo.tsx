import logo from "@/assets/beldium-logo.jpg.asset.json";
import { cn } from "@/lib/utils";

export function BeldiumMark({ className }: { className?: string }) {
  return (
    <img
      src={logo.url}
      alt="Beldium logo"
      className={cn("h-9 w-9 rounded-full border border-border/40 object-cover", className)}
    />
  );
}

export function BeldiumLockup({
  className,
  tone = "dark",
  subtitle = "Miner Hub",
}: {
  className?: string;
  tone?: "dark" | "light";
  subtitle?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BeldiumMark />
      <div className="leading-tight">
        <div
          className={cn(
            "text-sm font-semibold tracking-[0.18em] uppercase",
            tone === "light" ? "text-sidebar-foreground" : "text-foreground",
          )}
        >
          Beldium
        </div>
        <div className={cn("text-xs", tone === "light" ? "text-sidebar-foreground/70" : "text-muted-foreground")}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}
