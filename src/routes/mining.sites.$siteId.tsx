import { createFileRoute } from "@tanstack/react-router";
import { SiteReview } from "@/verticals/mining/components/SiteReview";

export const Route = createFileRoute("/mining/sites/$siteId")({ component: SiteDetail });

function SiteDetail() {
  const { siteId } = Route.useParams();
  return <SiteReview siteId={siteId} />;
}
