import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader, StatCard } from "@/components/miner-shell";
import { DataTable, EmptyState, Panel, StatusPill, Td } from "@/components/ecosystem-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAcceptRfq, useDeclineRfq, useRfqs } from "@/lib/api/ecosystem-queries";

function tonnes(v: number): string {
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} t`;
}
function usd(v: number): string {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export const Route = createFileRoute("/portal/rfqs")({ component: RfqsPage });

function RfqsPage() {
  const rfqsQuery = useRfqs();
  const acceptRfq = useAcceptRfq();
  const declineRfq = useDeclineRfq();
  const [partial, setPartial] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("all");

  const all = Array.isArray(rfqsQuery.data) ? rfqsQuery.data : (rfqsQuery.data?.results ?? []);
  const rfqs = all.filter((r) => (filter === "all" ? true : filter === "open" ? r.status === "open" : r.status !== "open"));
  const open = all.filter((r) => r.status === "open");

  return (
    <div>
      <PageHeader
        title="RFQs"
        description="Buyer demand received through the Beldium marketplace. Accept, partially accept or decline — accepted demand becomes a supply commitment and a transaction."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active RFQs" value={String(open.length)} hint="Awaiting your response" />
        <StatCard label="Demand received" value={tonnes(open.reduce((s, r) => s + r.quantity_requested, 0))} hint="Open quantity requested" />
        <StatCard
          label="Indicative value"
          value={usd(open.reduce((s, r) => s + r.quantity_requested * (r.indicative_price ?? 0), 0))}
          hint="If fully accepted"
        />
      </div>

      <div className="mb-4 flex gap-2">
        {[
          { id: "all", label: "All" },
          { id: "open", label: "Open" },
          { id: "decided", label: "Decided" },
        ].map((f) => (
          <Button key={f.id} size="sm" variant={filter === f.id ? "default" : "outline"} onClick={() => setFilter(f.id)}>
            {f.label}
          </Button>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {open.length === 0 ? <EmptyState label="No open RFQs right now." /> : null}
        {open.map((r) => (
          <Panel key={r.id} title={`${r.reference} — ${r.buyer_name}`} description={`respond by ${r.respond_by ?? "—"}`}>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-muted-foreground">Mineral</dt><dd>{r.mineral}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Specification</dt><dd>{r.grade_spec}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Quantity requested</dt><dd>{tonnes(r.quantity_requested)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Indicative price</dt><dd>{usd(r.indicative_price ?? 0)} / t</dd></div>
              <div><dt className="text-xs text-muted-foreground">Terms</dt><dd>{r.incoterm}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Destination</dt><dd>{r.destination}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">{r.notes}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                disabled={acceptRfq.isPending}
                onClick={() => acceptRfq.mutate({ id: r.id, committedQuantity: r.quantity_requested })}
              >
                Accept in full
              </Button>
              <Input
                className="h-9 w-28"
                placeholder="Tonnes"
                inputMode="numeric"
                value={partial[r.id] ?? ""}
                onChange={(e) => setPartial((p) => ({ ...p, [r.id]: e.target.value }))}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!Number(partial[r.id] || 0) || acceptRfq.isPending}
                onClick={() => acceptRfq.mutate({ id: r.id, committedQuantity: Number(partial[r.id] || 0) })}
              >
                Partially accept
              </Button>
              <Button size="sm" variant="ghost" disabled={declineRfq.isPending} onClick={() => declineRfq.mutate(r.id)}>
                Decline
              </Button>
            </div>
          </Panel>
        ))}
      </div>

      <Panel title="All RFQs" description="Full demand history with your decision.">
        <DataTable head={["Reference", "Buyer", "Mineral", "Requested", "Committed", "Received", "Respond by", "Status"]}>
          {rfqs.map((r) => (
            <tr key={r.id}>
              <Td className="font-medium">{r.reference}</Td>
              <Td>{r.buyer_name}</Td>
              <Td>{r.mineral}</Td>
              <Td>{tonnes(r.quantity_requested)}</Td>
              <Td>{r.committed_quantity ? tonnes(r.committed_quantity) : "—"}</Td>
              <Td className="text-xs text-muted-foreground">{r.received_at}</Td>
              <Td className="text-xs text-muted-foreground">{r.respond_by ?? "—"}</Td>
              <Td><StatusPill value={r.status} /></Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
