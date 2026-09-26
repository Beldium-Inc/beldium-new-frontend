import { useState } from "react";
import { toast } from "sonner";
import { Radio } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { partyName, runSim, simEvents, useOps } from "@/lib/ops-store";
import { StatusBadge } from "./status-badge";
import { IdLink } from "./ops-ui";

/** Beldium network event simulator: other sectors emitting events into the shared chain. */
export function NetworkSimulator() {
  const s = useOps();
  const [open, setOpen] = useState(false);
  const [txnId, setTxnId] = useState("TXN-2041");
  const t = s.transactions.find((x) => x.id === txnId) ?? s.transactions[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:border-primary"
      >
        <Radio className="size-4" />
        <span className="hidden sm:inline">Beldium Network</span>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-primary">Beldium Network Events</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Transaction</span>
              <select value={t?.id} onChange={(e) => setTxnId(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                {s.transactions.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.id} · {x.mineral} · {partyName(s, x.buyerId)}
                  </option>
                ))}
              </select>
            </label>
            {t ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <IdLink kind="transaction" id={t.id} />
                <StatusBadge value={t.stage} />
                <span className="beldium-small">Quality: {t.quality}</span>
              </div>
            ) : null}
            <ul className="space-y-2">
              {simEvents.map((e) => {
                const block = e.available(s, t);
                return (
                  <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary">{e.label}</p>
                      <p className="beldium-small">{block ?? e.sector}</p>
                    </div>
                    <button
                      type="button"
                      disabled={!!block}
                      onClick={() => {
                        const r = runSim(e.id, t?.id);
                        if (e.id === "rfq" && r) {
                          setTxnId(r);
                          toast.success(`${r} opened`);
                        } else if (r) toast.error(r);
                        else toast.success(e.label);
                      }}
                      className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Send
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
