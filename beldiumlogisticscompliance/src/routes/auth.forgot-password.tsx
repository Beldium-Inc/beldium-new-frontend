import { createFileRoute } from '@tanstack/react-router';
import { ForgotPage } from '@/components/logistics/AuthPages';
import { metadata } from '@/components/logistics/fields';
export const Route = createFileRoute('/auth/forgot-password')({head:()=>metadata('forgot-password','Simulated organization access and registration for Beldium Logistics Hub.'),component:ForgotPage});
