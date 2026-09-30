import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartnerApplicationStatus } from "@/lib/careers/logistics-api";

const STAGES: { key: PartnerApplicationStatus; label: string }[] = [
  { key: "submitted", label: "Application Submitted" },
  { key: "under_review", label: "Documents Under Review" },
  { key: "info_requested", label: "Additional Information Requested" },
  { key: "approved", label: "Approved Logistics Partner" },
  { key: "dashboard_active", label: "Dashboard Activated" },
];

interface StatusTrackerProps {
  status: PartnerApplicationStatus;
}

export function StatusTracker({ status }: StatusTrackerProps) {
  const stages = STAGES.filter((s) => s.key !== "info_requested" || status === "info_requested");
  const currentIndex = stages.findIndex((s) => s.key === status);

  return (
    <div className="space-y-4">
      {stages.map((stage, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={stage.key} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition",
                  isComplete && "bg-brand-navy-deep text-white",
                  isCurrent && "bg-brand-navy-deep text-white ring-4 ring-brand-navy/15",
                  !isComplete && !isCurrent && "bg-brand-mist text-brand-navy-soft",
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              {i < stages.length - 1 && (
                <div
                  className={cn(
                    "my-1 h-8 w-0.5 rounded-full",
                    isComplete ? "bg-brand-navy-deep" : "bg-brand-mist",
                  )}
                />
              )}
            </div>
            <div className="pt-1">
              <p
                className={cn(
                  "text-sm font-semibold",
                  isCurrent || isComplete ? "text-brand-navy-deep" : "text-muted-foreground",
                )}
              >
                {stage.label}
              </p>
              {isCurrent && <p className="mt-0.5 text-xs text-muted-foreground">Current stage</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
