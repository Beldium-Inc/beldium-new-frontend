import { TRIP_STAGES, type TransportAssignment } from "@/lib/trips/model";
import { cn } from "@/lib/utils";

/** The ten transport stages, with an exception shown at the stage it interrupted. */
export function TripStepper({
  trip,
}: {
  trip: Pick<TransportAssignment, "status" | "resumeStatus">;
}) {
  const current =
    trip.status === "Exception" || trip.status === "Disputed" ? trip.resumeStatus : trip.status;
  const index = TRIP_STAGES.indexOf(current as (typeof TRIP_STAGES)[number]);
  return (
    <ol
      className="grid grid-cols-2 gap-1.5 sm:grid-cols-5 xl:grid-cols-10"
      aria-label="Trip stages"
    >
      {TRIP_STAGES.map((stage, i) => (
        <li
          key={stage}
          aria-current={i === index ? "step" : undefined}
          className={cn(
            "rounded-md border px-2 py-1.5 text-[11px] leading-tight",
            i < index && "border-success/30 bg-success/10 text-success",
            i === index && "border-primary bg-primary text-primary-foreground",
            i > index && "border-border text-muted-foreground",
          )}
        >
          {stage}
        </li>
      ))}
    </ol>
  );
}
