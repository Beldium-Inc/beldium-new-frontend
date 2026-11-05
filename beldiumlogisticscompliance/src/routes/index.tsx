import { createFileRoute } from '@tanstack/react-router';
import { SignInPage } from '@/components/logistics/AuthPages';
import { metadata } from '@/components/logistics/fields';
export const Route=createFileRoute('/')({head:()=>metadata('Sign in','Simulated sign-in for Beldium logistics organizations, operations personnel and compliance workspaces.'),component:SignInPage});
