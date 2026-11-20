import { createFileRoute } from "@tanstack/react-router";

import { TripDetail } from "@/components/independent/trip";

export const Route = createFileRoute("/independent/trips_/$tripId")({
  head: ({ params }) => ({
    meta: [
      { title: `Trip ${params.tripId} - Beldium Logistics Hub` },
      {
        name: "description",
        content: "Trip lifecycle, milestones, exceptions and proof of delivery.",
      },
    ],
  }),
  component: TripPage,
});

function TripPage() {
  const { tripId } = Route.useParams();
  return <TripDetail tripId={tripId} />;
}
