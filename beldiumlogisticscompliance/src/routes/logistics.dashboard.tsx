import { createFileRoute } from '@tanstack/react-router';
import { Dashboard } from '@/components/logistics/Workspace';
import { metadata } from '@/components/logistics/fields';
export const Route=createFileRoute('/logistics/dashboard')({head:()=>metadata('Dashboard','Organization-scoped Beldium logistics compliance and simulated operations.'),component:Page});
function Page(){return <Dashboard />;}
