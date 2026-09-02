import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Panel, StatusPill, toneForStatus } from "@/components/compliance-ui";
import { useDemo } from "@/lib/demo/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/operator/releases")({
  head: () => ({
    meta: [
      { title: "Release authorisation | Beldium Warehouse Operator" },
      { name: "description", content: "Authorise or decline customer stock release requests with recorded reasons and audit trail." },
      { property: "og:title", content: "Release authorisation | Beldium Warehouse Operator" },
      { property: "og:description", content: "Dual-control release of stored mineral batches." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReleasesPage,
});

function ReleasesPage() {
  const { releases, decideRelease } = useDemo();
  const [pending, setPending] = useState<{ id: string; authorise: boolean } | null>(null);
  const [reason, setReason] = useState("");

  return (
    <AppShell role="operator" title="Release requests" subtitle="Stock cannot leave site without a recorded authorisation">
      <Panel title="Requests" description="Declining a request requires a reason for the audit trail.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Commodity</TableHead>
              <TableHead>Tonnes</TableHead>
              <TableHead>Requested by</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {releases.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium text-primary">{r.id}</TableCell>
                <TableCell className="text-sm">{r.batch}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.commodity}</TableCell>
                <TableCell className="text-sm">{r.tonnes.toLocaleString()} t</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.requestedBy}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.destination}</TableCell>
                <TableCell>
                  <StatusPill tone={toneForStatus(r.status)}>{r.status}</StatusPill>
                  {r.reason ? <p className="mt-1 max-w-52 text-xs text-muted-foreground">{r.reason}</p> : null}
                </TableCell>
                <TableCell className="text-right">
                  {r.status === "Pending authorisation" ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        className="h-8 rounded-lg bg-link text-xs text-link-foreground hover:bg-link/90"
                        onClick={() => {
                          decideRelease(r.id, true, "", "Ibrahim Bello");
                          toast.success(`${r.id} authorised`, { description: `${r.tonnes} t of ${r.commodity} cleared for dispatch.` });
                        }}
                      >
                        Authorise
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 rounded-lg text-xs"
                        onClick={() => {
                          setPending({ id: r.id, authorise: false });
                          setReason("");
                        }}
                      >
                        Decline
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Closed</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <Dialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">Decline release {pending?.id}</DialogTitle>
            <DialogDescription>A reason is required and is written to the audit trail.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rr">Reason</Label>
            <Textarea
              id="rr"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Outstanding assay certificate for the requested lot."
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setPending(null)}>Cancel</Button>
            <Button
              className="rounded-xl"
              variant="destructive"
              onClick={() => {
                if (reason.trim().length < 10) {
                  toast.error("Please give a reason of at least 10 characters");
                  return;
                }
                decideRelease(pending!.id, false, reason.trim(), "Ibrahim Bello");
                toast.success(`${pending!.id} declined`, { description: "Requester notified with your reason." });
                setPending(null);
              }}
            >
              Decline release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
