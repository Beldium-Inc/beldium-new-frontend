import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiError,
  ORGANISATION_TYPE_LABELS,
  useDecideParticipantOrganisation,
  useDecideRegulatorRequest,
  useParticipantApplications,
  useRegulatorRequests,
  type RegulatorAccessRequest,
} from "@/lib/api";
import { VERTICAL_BY_SLUG, type VerticalSlug } from "@/lib/verticals";

function sectorName(slug: VerticalSlug) {
  return VERTICAL_BY_SLUG[slug]?.name ?? slug;
}

function errorText(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function Shell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

/**
 * Regulator access requests (BE-O5, D9). The operator checks the official
 * email or the agency letter, then approves some or all of the sectors asked
 * for, or rejects with a reason.
 */
export function RegulatorAccessQueue({ sector }: { sector?: VerticalSlug | undefined }) {
  const requests = useRegulatorRequests("pending");
  const decide = useDecideRegulatorRequest();
  const [open, setOpen] = useState<RegulatorAccessRequest | null>(null);
  const [sectors, setSectors] = useState<VerticalSlug[]>([]);
  const [reason, setReason] = useState("");

  const rows = (requests.data?.results ?? []).filter(
    (r) => !sector || r.requested_sectors.includes(sector),
  );

  const start = (r: RegulatorAccessRequest) => {
    setOpen(r);
    setSectors(r.requested_sectors);
    setReason("");
  };

  const run = (input: Parameters<typeof decide.mutateAsync>[0], done: string) =>
    decide
      .mutateAsync(input)
      .then(() => {
        toast.success(done);
        setOpen(null);
      })
      .catch((error: unknown) => toast.error(errorText(error, "The decision could not be saved.")));

  return (
    <Shell
      title="Regulator access requests"
      description="Government agencies asking for read-only access. Check the official email or letter, then approve the sectors they may see."
    >
      {requests.isPending ? (
        <div className="p-6 text-sm text-muted-foreground">Loading requests…</div>
      ) : requests.error ? (
        <div className="p-6 text-sm text-destructive">
          {errorText(requests.error, "Could not load requests.")}
        </div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground">
          No regulator request is waiting.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agency</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Official email</TableHead>
                <TableHead>Sectors asked for</TableHead>
                <TableHead>Letter</TableHead>
                <TableHead>Asked</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.agency_name}
                    <p className="text-xs text-muted-foreground">
                      {r.office}, {r.state}
                    </p>
                  </TableCell>
                  <TableCell>
                    {r.requester_name || r.requester_email}
                    <p className="text-xs text-muted-foreground">{r.requester_title}</p>
                  </TableCell>
                  <TableCell>{r.official_email}</TableCell>
                  <TableCell>{r.requested_sectors.map(sectorName).join(", ")}</TableCell>
                  <TableCell>{r.has_authority_letter ? r.authority_letter_name : "None"}</TableCell>
                  <TableCell>{r.created_at.slice(0, 10)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => start(r)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{open?.agency_name}</DialogTitle>
            <DialogDescription>
              {open?.official_email}. {open?.mandate || "No mandate note."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm font-medium">Sectors to approve</p>
            {open?.requested_sectors.map((slug) => (
              <label key={slug} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={sectors.includes(slug)}
                  onCheckedChange={(v) =>
                    setSectors((s) => (v === true ? [...s, slug] : s.filter((x) => x !== slug)))
                  }
                />
                {sectorName(slug)}
              </label>
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Reason (needed to reject)</p>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={decide.isPending || !reason.trim() || !open}
              onClick={() =>
                open && void run({ id: open.id, decision: "reject", reason }, "Request rejected")
              }
            >
              Reject
            </Button>
            <Button
              disabled={decide.isPending || sectors.length === 0 || !open}
              onClick={() =>
                open && void run({ id: open.id, decision: "approve", sectors }, "Access approved")
              }
            >
              Approve {sectors.length} sector{sectors.length === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

/**
 * Submitted applications from a sector's own companies (BE-O3): processors,
 * warehouse operators, exporters and buyers. Verified or rejected here.
 */
export function ParticipantQueue({ sector }: { sector?: VerticalSlug | undefined }) {
  const applications = useParticipantApplications();
  const decide = useDecideParticipantOrganisation();
  const rows = (applications.data?.results ?? []).filter(
    (a) =>
      a.status === "submitted" &&
      a.organisation.verification_status === "under_review" &&
      (!sector || a.sector === sector),
  );

  const run = (organisationId: string, decision: "verified" | "rejected") => {
    const reason = decision === "rejected" ? (window.prompt("Reason for rejecting") ?? "") : "";
    if (decision === "rejected" && !reason.trim()) return;
    decide
      .mutateAsync({ organisationId, decision, reason })
      .then(() => toast.success(decision === "verified" ? "Company verified" : "Company rejected"))
      .catch((error: unknown) => toast.error(errorText(error, "The decision could not be saved.")));
  };

  return (
    <Shell
      title="Company applications"
      description="Processing companies, warehouse operators, exporters and buyers that have submitted their application."
    >
      {applications.isPending ? (
        <div className="p-6 text-sm text-muted-foreground">Loading applications…</div>
      ) : applications.error ? (
        <div className="p-6 text-sm text-destructive">
          {errorText(applications.error, "Could not load applications.")}
        </div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground">
          No company application is waiting.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.organisation.beldium_id}</TableCell>
                  <TableCell className="font-medium">{a.organisation.name}</TableCell>
                  <TableCell>
                    {ORGANISATION_TYPE_LABELS[a.organisation.organisation_type]}
                    {a.participant_subtype ? ` (${a.participant_subtype})` : ""}
                  </TableCell>
                  <TableCell>{sectorName(a.sector)}</TableCell>
                  <TableCell>{a.documents.length}</TableCell>
                  <TableCell>{a.submitted_at?.slice(0, 10) ?? "-"}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={decide.isPending}
                      onClick={() => run(a.organisation.id, "rejected")}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={decide.isPending}
                      onClick={() => run(a.organisation.id, "verified")}
                    >
                      Verify
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Shell>
  );
}
