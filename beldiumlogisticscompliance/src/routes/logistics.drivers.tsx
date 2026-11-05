import { createFileRoute } from '@tanstack/react-router';
import { EntityWorkspace } from '@/components/logistics/Workspace';
import { metadata } from '@/components/logistics/fields';
export const Route=createFileRoute('/logistics/drivers')({head:()=>metadata('Drivers','Organization-scoped Beldium logistics compliance and simulated operations.'),component:Page});
function Page(){return <EntityWorkspace kind="drivers"/>;}
