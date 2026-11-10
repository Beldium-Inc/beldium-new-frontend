import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExpiryBadge, daysUntil } from "@/components/shared/expiry-badge";
import { useStore } from "@/verticals/mining/store";
import type { InfoRequest } from "@/verticals/mining/types";
import { KpiCard, PageHeader, Panel } from "@/verticals/mining/components/primitives";
import { Chip, StatusChip } from "@/verticals/mining/components/chips";
import { ListState, errorMessage, useSiteNames } from "@/verticals/mining/components/listkit";

export const Route = createFileRoute("/mining/actions")({ component: ActionsPage });

type ActionItem = {
  id: string;
  kind: "Information request" | "Non-conformity" | "Licence";
  title: string;
  detail: string;
  siteId: string;
  due: string | null;
  priority: string;
  open: () => ReactNode;
};

/**
 * One to-do list for the miner, built from three registers the store already
 * loads: open information requests, findings that need corrective action, and
 * licences inside the 90-day window. Soonest due first.
 */
function ActionsPage() {
  const { infoRequests, nonConformities, licences, isLoading, error } = useStore();
  const siteName = useSiteNames();
  const [responding, setResponding] = useState<InfoRequest | null>(null);

  const items: ActionItem[] = [
    ...infoRequests
      .filter((r) => r.status === "Open")
      .map<ActionItem>((r) => ({
        id: `ir-${r.id}`,
        kind: "Information request",
        title: r.subject,
        detail: r.details,
        siteId: r.siteId,
        due: r.dueBy || null,
        priority: r.priority,
        open: () => (
          <Button size="sm" onClick={() => setResponding(r)}>
            Respond
          </Button>
        ),
      })),
    ...nonConformities
      .filter(
        (nc) => nc.status === "Open" || nc.status === "In Progress" || nc.status === "Escalated",
      )
      .map<ActionItem>((nc) => ({
        id: `nc-${nc.id}`,
        kind: "Non-conformity",
        title: `${nc.ref} · ${nc.title}`,
        detail: nc.requiredAction,
        siteId: nc.siteId,
        due: nc.deadline || null,
        priority: nc.severity,
        open: () => (
          <Button asChild size="sm">
            <Link to="/mining/nonconformities">Submit evidence</Link>
          </Button>
        ),
      })),
    ...licences
      .filter((l) => {
        const d = daysUntil(l.expiry);
        return d !== null && d <= 90;
      })
      .map<ActionItem>((l) => ({
        id: `lic-${l.id}`,
        kind: "Licence",
        title: `Renew ${l.type} ${l.number}`,
        detail: `Issued by ${l.authority || "the authority"}. Upload the renewed licence before it lapses.`,
        siteId: l.siteId,
        due: l.expiry || null,
        priority: l.status,
        open: () => (
          <Button asChild size="sm">
            <Link to="/mining/documents">Upload renewal</Link>
          </Button>
        ),
      })),
  ].sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));

  const overdue = items.filter((i) => {
    const d = daysUntil(i.due);
    return d !== null && d < 0;
  }).length;
  const count = (kind: ActionItem["kind"]) => items.filter((i) => i.kind === kind).length;

  return (
    <>
      <PageHeader
        eyebrow="Compliance"
        title="Action required"
        description="Everything waiting on you, soonest due first."
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Overdue" value={overdue} tone={overdue ? "danger" : "success"} />
        <KpiCard label="Information requests" value={count("Information request")} tone="warning" />
        <KpiCard label="Findings to fix" value={count("Non-conformity")} tone="warning" />
        <KpiCard label="Licences to renew" value={count("Licence")} />
      </div>
      <ListState
        loading={isLoading}
        error={error}
        empty={items.length === 0}
        emptyTitle="Nothing needs you right now"
        emptyDescription="New requests from the compliance desk will appear here."
      >
        <Panel bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone="info">{item.kind}</Chip>
                    <StatusChip value={item.priority} />
                    <span className="text-xs text-muted-foreground">{siteName(item.siteId)}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold">{item.title}</p>
                  {item.detail && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {item.detail}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 sm:shrink-0">
                  {item.due && (
                    <ExpiryBadge
                      date={item.due}
                      mode={item.kind === "Licence" ? "expiry" : "due"}
                    />
                  )}
                  {item.open()}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </ListState>
      <RespondDialog request={responding} onClose={() => setResponding(null)} />
    </>
  );
}

function RespondDialog({ request, onClose }: { request: InfoRequest | null; onClose: () => void }) {
  const { respondToInfoRequest } = useStore();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!request) return;
    if (!message.trim()) {
      toast.error("Write your response");
      return;
    }
    setBusy(true);
    try {
      await respondToInfoRequest(request.id, message.trim(), []);
      toast.success("Response sent to the compliance desk");
      setMessage("");
      onClose();
    } catch (err) {
      toast.error("Could not send the response", { description: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={request !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{request?.subject}</DialogTitle>
          <DialogDescription>
            {request?.details || "The compliance desk asked for more information."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="ir-response">Your response</Label>
          <Textarea
            id="ir-response"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            To send a document, upload it on the site page under the section the request is about,
            or on Licences & documents.
          </p>
        </div>
        <DialogFooter>
          {request && (
            <Button asChild variant="outline">
              <Link to="/mining/sites/$siteId" params={{ siteId: request.siteId }}>
                Open site
              </Link>
            </Button>
          )}
          <Button disabled={busy} onClick={submit}>
            Send response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
