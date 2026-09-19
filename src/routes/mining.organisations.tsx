import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel, EmptyState } from "@/verticals/mining/components/primitives";
import { StatusChip } from "@/verticals/mining/components/chips";
import {
  useDecideOrganisation,
  useMiningCapabilities,
  useOrganisationVerification,
} from "@/lib/api/mining-queries";
import type { OrganisationVerificationRow } from "@/lib/api/mining";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/mining/organisations")({ component: Page });

const statusLabel: Record<OrganisationVerificationRow["verification_status"], string> = {
  draft: "Under Review",
  under_review: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
};

function Page() {
  const { data, isPending, error } = useOrganisationVerification();
  const capabilities = useMiningCapabilities();
  const decide = useDecideOrganisation();
  const canDecide = Boolean(capabilities.data?.can_decide);
  const [rejecting, setRejecting] = useState<OrganisationVerificationRow | null>(null);
  const [reason, setReason] = useState("");

  const run = async (
    org: OrganisationVerificationRow,
    decision: "verify" | "reject",
    why?: string,
  ) => {
    try {
      await decide.mutateAsync({ id: org.id, decision, ...(why ? { reason: why } : {}) });
      toast.success(decision === "verify" ? `${org.name} verified` : `${org.name} rejected`, {
        description:
          decision === "verify"
            ? "The miner's workspace now opens as a verified miner."
            : "The miner can see the reason and resubmit.",
      });
      setRejecting(null);
      setReason("");
    } catch (err) {
      toast.error("Could not record the decision", {
        description: err instanceof ApiError ? err.message : "Please try again.",
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Mining Organisations"
        description="Verify a mining company once every declared site and submitted document has been verified."
      />
      <Panel title="Organisations" bodyClassName="p-0">
        {isPending ? <p className="p-5 text-sm text-muted-foreground">Loading organisations…</p> : null}
        {error ? <p className="p-5 text-sm text-destructive">Could not load the register.</p> : null}
        {data && data.results.length === 0 ? <EmptyState title="No mining organisations yet" /> : null}
        <ul className="divide-y divide-border">
          {data?.results.map((org) => (
            <li key={org.id} className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{org.name}</span>
                  <StatusChip value={statusLabel[org.verification_status]} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {org.beldium_id ?? "-"} · Sites {org.sites_verified}/{org.sites_total} verified · Documents{" "}
                  {org.documents_verified}/{org.documents_total} verified
                </p>
                {org.verification_status !== "verified" && org.blockers.length ? (
                  <ul className="list-disc pl-4 text-xs text-muted-foreground">
                    {org.blockers.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
                {org.verification_status === "rejected" && org.rejection_reason ? (
                  <p className="text-xs text-danger-foreground">Rejected: {org.rejection_reason}</p>
                ) : null}
              </div>
              {canDecide && org.verification_status !== "verified" ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!org.ready || decide.isPending}
                    onClick={() => void run(org, "verify")}
                  >
                    Verify organisation
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRejecting(org)}>
                    Reject
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>

      <Dialog open={rejecting !== null} onOpenChange={(v) => !v && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejecting?.name}</DialogTitle>
            <DialogDescription>The miner will see this reason.</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              disabled={!reason.trim() || decide.isPending}
              onClick={() => rejecting && void run(rejecting, "reject", reason.trim())}
            >
              Record rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
