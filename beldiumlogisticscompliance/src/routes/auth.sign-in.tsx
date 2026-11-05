import { createFileRoute } from '@tanstack/react-router';
import { SignInPage } from '@/components/logistics/AuthPages';
import { metadata } from '@/components/logistics/fields';
export const Route = createFileRoute('/auth/sign-in')({head:()=>metadata('sign-in','Simulated organization access and registration for Beldium Logistics Hub.'),component:SignInPage});
