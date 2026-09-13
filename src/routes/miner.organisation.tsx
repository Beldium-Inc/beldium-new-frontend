import { createFileRoute } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMiner } from "@/verticals/miner/store";
import { PageHeader, Panel, Field, EmptyState } from "@/verticals/miner/components/primitives";

export const Route = createFileRoute("/miner/organisation")({ component: OrganisationPage });

function OrganisationPage() {
  const { orgName, orgMembers, sites, user } = useMiner();
  return (
    <>
      <PageHeader title="My Organisation" description="Profile and members of your organisation." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Panel title="Profile">
          <div className="grid gap-4">
            <Field label="Organisation" value={orgName} />
            <Field label="Registered sites" value={String(sites.length)} />
            <Field label="You" value={`${user?.name ?? "—"}`} />
          </div>
        </Panel>
        <Panel title="Members" bodyClassName="p-0">
          {orgMembers.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No members listed" description="Members appear here once your organisation is set up." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgMembers.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.email}</TableCell>
                    <TableCell className="capitalize">{m.role.replace(/_/g, " ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
