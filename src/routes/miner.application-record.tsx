import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useMiner } from "@/verticals/miner/store";
import { PageHeader, Panel, Field, EmptyState } from "@/verticals/miner/components/primitives";
import { StatusChip } from "@/verticals/miner/components/chips";

export const Route = createFileRoute("/miner/application-record")({ component: ApplicationRecordPage });

function ApplicationRecordPage() {
  const { applications, infoRequests } = useMiner();
  const latest = applications[0];

  if (!latest) {
    return (
      <>
        <PageHeader title="Application status" description="Your submitted organisation application." />
        <EmptyState title="No application on file" description="Start one to bring your organisation onto Beldium." />
        <div className="mt-4">
          <Button asChild>
            <Link to="/miner/application">Start application</Link>
          </Button>
        </div>
      </>
    );
  }

  const related = infoRequests.filter((r) => r.siteId === latest.orgId || true);

  return (
    <>
      <PageHeader
        eyebrow={latest.ref}
        title="Application status"
        description="Read-only view of your submitted application and its review timeline."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Summary">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reference" value={latest.ref} />
            <Field label="Status"><StatusChip value={latest.status} /></Field>
            <Field label="Site" value={latest.siteName || "—"} />
            <Field label="Mineral" value={latest.mineral} />
            <Field label="Submitted" value={latest.submitted || "—"} />
            <Field label="Stage" value={latest.stage} />
            <Field label="Assigned to" value={latest.assignedTo} />
          </div>
        </Panel>
        <Panel title="Information requests" description="Requests raised during review.">
          {related.length === 0 ? (
            <EmptyState title="None yet" />
          ) : (
            <ul className="space-y-3">
              {related.map((r) => (
                <li key={r.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{r.subject}</p>
                    <StatusChip value={r.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{r.details}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
