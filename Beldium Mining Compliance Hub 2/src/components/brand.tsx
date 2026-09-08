import { cn } from "@/lib/utils";
import logo from "@/assets/beldium-logo.jpeg.asset.json";

export function BeldiumMark({ className }: { className?: string }) {
  return (
    <img
      src={logo.url}
      alt="Beldium logo"
      className={cn("size-10 rounded-[12px] object-contain", className)}
      loading="lazy"
    />
  );
}
