import { createFileRoute } from '@tanstack/react-router';
import { Assignments } from '@/components/logistics/Transport';
import { metadata } from '@/components/logistics/fields';
export const Route=createFileRoute('/operator/transport/')({head:()=>metadata('Operator transport assignments','Simulated mineral movement, assignment status and transport evidence.'),component:Page});
function Page(){return <Assignments mode="operator"/>;}
