import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { QualityNotification } from "@/lib/api/quality";
import {
  useMarkQualityNotificationRead,
  useQualityNotifications,
} from "@/lib/api/quality-queries";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** The bell reads the Quality API's own notifications; the backend decides who gets which. */
export function QualityNotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const query = useQualityNotifications();
  const markRead = useMarkQualityNotificationRead();

  const items = query.data?.results ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  const openItem = (n: QualityNotification) => {
    if (!n.read_at) markRead.mutate(n.id);
    setOpen(false);
    if (n.sample) void navigate({ to: "/quality/samples/$id", params: { id: n.sample } });
    else if (n.application)
      void navigate({ to: "/quality/applications/$id", params: { id: n.application } });
    else if (n.certificate)
      void navigate({ to: "/quality/certificates/$id", params: { id: n.certificate } });
    else if (n.non_conformity) void navigate({ to: "/quality/nonconformities" });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative grid size-9 place-items-center rounded-full border border-border text-navy hover:border-link"
        >
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="absolute -top-1 -right-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b border-border px-4 py-3 text-sm font-semibold text-navy">
          Notifications
        </p>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nothing new yet.
            </p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => openItem(n)}
                className={cn(
                  "block w-full border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-pale/50",
                  !n.read_at && "bg-pale/30",
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-navy">{n.title}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {timeAgo(n.created_at)}
                  </span>
                </span>
                {n.body ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">{n.body}</span>
                ) : null}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
