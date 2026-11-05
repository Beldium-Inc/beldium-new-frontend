import { createFileRoute } from '@tanstack/react-router';
import { RoleSelection } from '@/components/logistics/AuthPages';
import { metadata } from '@/components/logistics/fields';
export const Route = createFileRoute('/auth/role-selection')({head:()=>metadata('role-selection','Simulated organization access and registration for Beldium Logistics Hub.'),component:RoleSelection});
