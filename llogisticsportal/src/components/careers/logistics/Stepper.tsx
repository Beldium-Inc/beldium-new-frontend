import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center">
        {steps.map((label, i) => {
          const isComplete = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-bold transition",
                    isComplete && "bg-brand-navy-deep text-white",
                    isCurrent && "bg-brand-navy-deep text-white ring-4 ring-brand-navy/15",
                    !isComplete && !isCurrent && "bg-brand-mist text-brand-navy-soft",
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-center text-xs font-semibold whitespace-nowrap sm:block",
                    isCurrent || isComplete ? "text-brand-navy-deep" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full transition",
                    isComplete ? "bg-brand-navy-deep" : "bg-brand-mist",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
