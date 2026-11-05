import { createFileRoute } from '@tanstack/react-router';
import { TripDetail } from '@/components/logistics/Transport';
import { metadata } from '@/components/logistics/fields';
export const Route=createFileRoute('/operator/transport/$tripId')({head:()=>metadata('Operator movement record','Timestamped simulated movement timeline, custody and delivery evidence.'),component:Page});
function Page(){const {tripId}=Route.useParams();return <TripDetail tripId={tripId} mode="operator"/>;}
