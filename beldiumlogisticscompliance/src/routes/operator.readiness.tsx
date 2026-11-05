import { createFileRoute } from '@tanstack/react-router';
import { ReadinessReview } from '@/components/logistics/Transport';
import { metadata } from '@/components/logistics/fields';
export const Route=createFileRoute('/operator/readiness')({head:()=>metadata('Fleet and driver review','Independent vehicle and driver simulated compliance decisions.'),component:ReadinessReview});
