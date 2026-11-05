import { createFileRoute } from '@tanstack/react-router';
import { Team } from '@/components/logistics/Workspace';
import { metadata } from '@/components/logistics/fields';
export const Route=createFileRoute('/logistics/team')({head:()=>metadata('Team','Organization-scoped Beldium logistics compliance and simulated operations.'),component:Page});
function Page(){return <Team />;}
