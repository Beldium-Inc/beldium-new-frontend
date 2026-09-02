import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtTonnes, fmtUsd, useDemo } from "@/lib/store";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Offers — Beldium Marketplace" },
      { name: "description", content: "Indicative miner offers against your open RFQs, with price, volume and compliance state." },
      { property: "og:title", content: "Offers — Beldium Marketplace" },
      { property: "og:description", content: "Compare indicative allocations from verified producers." },
    ],
  }),
  component: Offers,
});

function Offers() {
  const { state } = useDemo();
  const rows = state.rfqs.flatMap((r) =>
    r.allocations.map((a) => ({ rfq: r, alloc: a, miner: state.miners.find((m) => m.id === a.minerId)! })),
  );

  return (
    <AppShell title="Offers" subtitle="Indicative allocations received from verified producers">
      <SectionCard title="Open offers" description={`${rows.length} allocation offer(s)`}>
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="py-2 pr-4 font-medium">RFQ</th>
                <th className="py-2 pr-4 font-medium">Producer</th>
                <th className="py-2 pr-4 font-medium">Volume</th>
                <th className="py-2 pr-4 font-medium">Price</th>
                <th className="py-2 pr-4 font-medium">Value</th>
                <th className="py-2 font-medium">State</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ rfq, alloc, miner }) => (
                <tr key={`${rfq.id}-${alloc.minerId}`} className="border-b border-border/70 last:border-0">
                  <td className="py-3 pr-4 font-medium">{rfq.reference}</td>
                  <td className="py-3 pr-4">
                    {miner.name}
                    <span className="block text-xs text-muted-foreground">{miner.country} · {miner.grade}</span>
                  </td>
                  <td className="py-3 pr-4">{fmtTonnes(alloc.tonnes)}</td>
                  <td className="py-3 pr-4">${alloc.priceUsdPerTonne}/t</td>
                  <td className="py-3 pr-4">{fmtUsd(alloc.tonnes * alloc.priceUsdPerTonne)}</td>
                  <td className="py-3">
                    <StatusBadge status={alloc.state === "accepted" ? "verified" : "pending"} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No offers yet — publish an RFQ to invite verified producers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}
