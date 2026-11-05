import { createFileRoute } from '@tanstack/react-router';
import { Onboarding } from '@/components/logistics/Onboarding';
import { metadata } from '@/components/logistics/fields';
export const Route=createFileRoute('/auth/onboarding')({head:()=>metadata('Organization onboarding','Eight-step applicant-declared logistics organization onboarding, fleet and driver readiness.'),component:Onboarding});
