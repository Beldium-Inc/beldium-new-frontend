import { createFileRoute } from "@tanstack/react-router";
import { useMineSite } from "@/lib/api/miner-queries";
import { toMineSite } from "@/verticals/miner/mappers";
import { PageHeader, Panel, Field } from "@/verticals/miner/components/primitives";
import { RiskChip, ScorePill, StatusChip } from "@/verticals/miner/components/chips";

export const Route = createFileRoute("/miner/sites/$siteId")({ component: SiteDetailPage });

function SiteDetailPage() {
  const { siteId } = Route.useParams();
  const query = useMineSite(siteId);
  const site = query.data ? toMineSite(query.data) : null;

  if (query.isPending) return <p className="text-sm text-muted-foreground">Loading site…</p>;
  if (!site) return <p className="text-sm text-muted-foreground">Site not found.</p>;

  return (
    <>
      <PageHeader
        eyebrow={site.code}
        title={site.name}
        description={`${site.mineral} · ${site.lga}, ${site.state} State`}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Status">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Compliance score"><ScorePill score={site.complianceScore} /></Field>
            <Field label="Risk"><RiskChip value={site.risk} /></Field>
            <Field label="Mine status"><StatusChip value={site.status} /></Field>
            <Field label="Workforce" value={`${site.workforce} people`} />
            <Field label="Area" value={`${site.areaHa} ha`} />
            <Field label="Last inspection" value={site.lastInspection || "—"} />
          </div>
        </Panel>
        <Panel title="Capacity">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Licensed capacity" value={`${site.capacityTpa.toLocaleString()} t/yr`} />
            <Field label="Current run rate" value={`${site.currentTpa.toLocaleString()} t/yr`} />
          </div>
        </Panel>
        <Panel title="Verification">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Site"><StatusChip value={site.verification.site ? "Verified" : "Pending"} /></Field>
            <Field label="Licence"><StatusChip value={site.verification.licence ? "Verified" : "Pending"} /></Field>
            <Field label="Documents"><StatusChip value={site.verification.documents ? "Verified" : "Pending"} /></Field>
            <Field label="GPS"><StatusChip value={site.verification.gps ? "Verified" : "Pending"} /></Field>
          </div>
        </Panel>
        {site.riskReasons.length > 0 && (
          <Panel title="Risk factors">
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {site.riskReasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </Panel>
        )}
      </div>
    </>
  );
}
