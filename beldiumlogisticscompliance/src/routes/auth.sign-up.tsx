import { createFileRoute } from '@tanstack/react-router';
import { SignUpPage } from '@/components/logistics/AuthPages';
import { metadata } from '@/components/logistics/fields';
export const Route = createFileRoute('/auth/sign-up')({head:()=>metadata('sign-up','Simulated organization access and registration for Beldium Logistics Hub.'),component:SignUpPage});
