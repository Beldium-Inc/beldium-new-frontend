import { createFileRoute } from '@tanstack/react-router';
import { Deliveries } from '@/components/logistics/Transport';
import { metadata } from '@/components/logistics/fields';
export const Route=createFileRoute('/logistics/deliveries')({head:()=>metadata('Delivery records','Simulated transport completion, discrepancies and proof-of-delivery placeholders.'),component:Deliveries});
