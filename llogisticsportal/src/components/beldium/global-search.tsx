import { useState } from "react";
import { Search } from "lucide-react";

import { useOps, type Target } from "@/lib/ops-store";
import { useOpenTarget } from "./ops-ui";

export function GlobalSearch() {
  const s = useOps();
  const open = useOpenTarget();
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const results: { label: string; sub: string; target: Target }[] = needle
    ? [
        ...s.movements.map((m) => ({ label: m.id, sub: `Movement · ${m.movementType}`, hay: `${m.id} ${m.txnId} ${m.vehicleId} ${m.sampleId ?? ""}`, target: { kind: "movement", id: m.id } as Target })),
        ...s.requests.map((r) => ({ label: r.id, sub: `Request · ${r.movementType}`, hay: `${r.id} ${r.txnId}`, target: { kind: "request", id: r.id } as Target })),
        ...s.transactions.map((t) => ({ label: t.id, sub: `Transaction · ${t.rfqId} · ${t.batchId}`, hay: `${t.id} ${t.rfqId} ${t.batchId} ${t.mineral}`, target: { kind: "transaction", id: t.id } as Target })),
        ...s.vehicles.map((v) => ({ label: v.id, sub: `Vehicle · ${v.registration}`, hay: `${v.id} ${v.registration}`, target: { kind: "vehicle", id: v.id } as Target })),
        ...s.drivers.map((d) => ({ label: d.name, sub: `Driver · ${d.id}`, hay: `${d.id} ${d.name}`, target: { kind: "driver", id: d.id } as Target })),
      ]
        .filter((x) => x.hay.toLowerCase().includes(needle))
        .slice(0, 8)
    : [];

  return (
    <div className="relative hidden max-w-sm flex-1 md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) {
            open(results[0].target);
            setQ("");
          }
          if (e.key === "Escape") setQ("");
        }}
        placeholder="Search movement, RFQ, batch, vehicle…"
        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
      />
      {needle ? (
        <ul className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {results.length === 0 ? <li className="px-3 py-2 text-sm text-muted-foreground">No matches</li> : null}
          {results.map((r) => (
            <li key={r.sub + r.label}>
              <button
                type="button"
                onClick={() => {
                  open(r.target);
                  setQ("");
                }}
                className="block w-full px-3 py-2 text-left hover:bg-secondary"
              >
                <span className="block text-sm font-semibold text-primary">{r.label}</span>
                <span className="beldium-small">{r.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
