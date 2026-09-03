import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Button, DemoNote, SectionCard } from "@/verticals/marketplace/AppShell";
import { StatusBadge } from "@/verticals/marketplace/StatusBadge";
import { fmtDate, fmtTonnes, fmtUsd, useDemo } from "@/verticals/marketplace/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/marketplace/orders")({
  head: () => ({
    meta: [
      { title: "Orders, contracts & transaction services | Beldium" },
      { name: "description", content: "Track contracted volume and configure logistics, insurance, quality and finance services." },
      { property: "og:title", content: "Orders, contracts & transaction services | Beldium" },
      { property: "og:description", content: "Set up transaction services for accepted aggregated supply." },
    ],
  }),
  component: Orders,
});

const OPTIONS = {
  logistics: ["Beldium Bulk Chartering (handysize programme)", "Kuehne bulk forwarding", "Producer-arranged FOB"],
  insurance: ["Marine cargo all-risk, Lloyd's syndicate", "Trade credit + political risk (MIGA)", "Buyer's own policy"],
  quality: ["SGS independent inspection at load & discharge", "Bureau Veritas draft survey", "Producer certificate of analysis only"],
  finance: ["Beldium supply-chain finance panel", "Bank-issued documentary LC", "Buyer prepayment"],
} as const;

function Orders() {
  const { state, saveServices } = useDemo();
  const rfq = state.rfqs.find((r) => r.status === "accepted") ?? state.rfqs[0]!;
  const [sel, setSel] = useState({
    logistics: rfq.services?.logistics ?? OPTIONS.logistics[0],
    insurance: rfq.services?.insurance ?? OPTIONS.insurance[0],
    quality: rfq.services?.quality ?? OPTIONS.quality[0],
    finance: rfq.services?.finance ?? OPTIONS.finance[0],
  });

  return (
    <AppShell title="Orders & contracts" subtitle="Contracted volume and transaction services setup">
      <div className="space-y-6">
        <SectionCard title="Contract book" description={`${state.orders.length} active and settled contracts`}>
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="py-2 pr-4 font-medium">Reference</th>
                  <th className="py-2 pr-4 font-medium">Counterparty</th>
                  <th className="py-2 pr-4 font-medium">Volume</th>
                  <th className="py-2 pr-4 font-medium">Value</th>
                  <th className="py-2 pr-4 font-medium">Updated</th>
                  <th className="py-2 font-medium">Stage</th>
                </tr>
              </thead>
              <tbody>
                {state.orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/70 last:border-0">
                    <td className="py-3 pr-4 font-medium">{o.reference}</td>
                    <td className="py-3 pr-4">{o.counterparty}</td>
                    <td className="py-3 pr-4">{fmtTonnes(o.tonnes)}</td>
                    <td className="py-3 pr-4">{fmtUsd(o.valueUsd)}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">{fmtDate(o.updatedAt)}</td>
                    <td className="py-3 capitalize">{o.stage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title={`Transaction services setup, ${rfq.reference}`}
          description="Choose the service stack for the accepted aggregated supply"
          actions={<StatusBadge status={rfq.services?.confirmed ? "verified" : "pending"} />}
        >
          <div className="grid gap-5 lg:grid-cols-2">
            {(Object.keys(OPTIONS) as (keyof typeof OPTIONS)[]).map((cat) => (
              <div key={cat}>
                <p className="text-sm font-medium capitalize">{cat}</p>
                <div className="mt-2 space-y-2">
                  {OPTIONS[cat].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSel((s) => ({ ...s, [cat]: opt }))}
                      className={cn(
                        "w-full rounded-md border px-3 py-2 text-left text-sm transition",
                        sel[cat] === opt
                          ? "border-primary bg-secondary/60 font-medium"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button
              onClick={() => {
                saveServices(rfq.id, { ...sel, confirmed: true });
                toast.success("Transaction services confirmed", {
                  description: "Logistics, insurance, quality and finance providers locked to the contract.",
                });
              }}
            >
              Confirm service stack
            </Button>
            <p className="text-xs text-muted-foreground">
              Next step: finance workspace to raise the financing request.
            </p>
          </div>
          <DemoNote>
            Aggregated pool: {fmtTonnes(rfq.allocations.reduce((s, a) => s + a.tonnes, 0))} across{" "}
            {rfq.allocations.length} verified producers, {rfq.incoterm} {rfq.destination}.
          </DemoNote>
        </SectionCard>
      </div>
    </AppShell>
  );
}
