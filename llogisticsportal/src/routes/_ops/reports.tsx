import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader } from "@/components/beldium/shell";
import { Panel, StatCard } from "@/components/beldium/stat-card";
import { Btn, QueueView } from "@/components/beldium/ops-ui";
import { movementColumns, movementFilters, movementSearch } from "@/components/beldium/movement-columns";
import { distanceKm, driverOf, naira, partyName, siteName, txnOf, useOps, vehicleAvailability } from "@/lib/ops-store";

export const Route = createFileRoute("/_ops/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Intelligence | Beldium Logistics" },
      { name: "description", content: "Fleet utilisation, on-time performance, transit times, variances, incidents, tonnes moved and cost per tonne." },
      { property: "og:title", content: "Reports & Intelligence | Beldium Logistics" },
      { property: "og:description", content: "Operational intelligence computed from live Beldium movement records." },
    ],
  }),
  component: Page,
});

const periods = { Today: 1, "7 Days": 7, "30 Days": 30, "90 Days": 90 } as const;

function Page() {
  const s = useOps();
  const [period, setPeriod] = useState<keyof typeof periods>("30 Days");
  const since = Date.now() - periods[period] * 86_400_000;
  const inPeriod = s.movements.filter((m) => new Date(m.createdAt).getTime() >= since || (m.completedAt && new Date(m.completedAt).getTime() >= since));
  const done = inPeriod.filter((m) => m.stage === "Completed");
  const onTime = done.filter((m) => m.completedAt && m.completedAt <= m.deliverBy).length;
  const tonnes = done.filter((m) => m.unit === "t").reduce((a, m) => a + (m.received ?? m.quantity), 0);
  const revenue = s.invoices.filter((i) => done.some((m) => m.id === i.movementId)).reduce((a, i) => a + i.amount, 0);
  const variance = done.filter((m) => m.loaded && m.received && m.loaded !== m.received).length;
  const util = Math.round((s.vehicles.filter((v) => ["Assigned", "In Transit"].includes(vehicleAvailability(v, s))).length / s.vehicles.length) * 100);
  const incidents = s.incidents.filter((i) => new Date(i.reportedAt).getTime() >= since);

  const metrics: [string, string][] = [
    ["Fleet utilisation", `${util}%`],
    ["Vehicle availability", `${s.vehicles.filter((v) => vehicleAvailability(v, s) === "Available").length}/${s.vehicles.length}`],
    ["Movement volume", String(inPeriod.length)],
    ["Completed", String(done.length)],
    ["On-time delivery", done.length ? `${Math.round((onTime / done.length) * 100)}%` : "-"],
    ["Tonnes moved", `${tonnes.toFixed(1)} t`],
    ["Cost per tonne", tonnes ? naira(revenue / tonnes) : "-"],
    ["Delayed movements", String(inPeriod.filter((m) => m.delayed).length)],
    ["Route deviations", String(inPeriod.filter((m) => m.deviated).length)],
    ["Quantity variances", String(variance)],
    ["Incidents", String(incidents.length)],
    ["Active routes", String(new Set(inPeriod.filter((m) => m.stage !== "Completed").map((m) => `${m.originId}-${m.destinationId}`)).size)],
  ];

  const exportCsv = () => {
    const header = ["Movement", "Transaction", "RFQ", "Type", "Origin", "Destination", "Vehicle", "Driver", "Buyer", "Quantity", "Received", "Distance km", "Stage"];
    const lines = inPeriod.map((m) => {
      const t = txnOf(s, m.txnId);
      return [m.id, m.txnId, t?.rfqId, m.movementType, siteName(s, m.originId), siteName(s, m.destinationId), m.vehicleId ?? "", driverOf(s, m.driverId)?.name ?? "", partyName(s, t?.buyerId), m.loaded ?? m.quantity, m.received ?? "", distanceKm(s, m), m.stage]
        .map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`)
        .join(",");
    });
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `beldium-movements-${period.replace(" ", "")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <PageHeader title="Reports">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(periods) as (keyof typeof periods)[]).map((p) => (
            <Btn key={p} variant={p === period ? "primary" : "outline"} onClick={() => setPeriod(p)}>
              {p}
            </Btn>
          ))}
          <Btn variant="outline" onClick={exportCsv}>
            Export CSV
          </Btn>
        </div>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {metrics.map(([l, v]) => (
          <StatCard key={l} label={l} value={v} />
        ))}
      </div>
      <div className="mt-5">
        <Panel title={`Movements · ${period}`}>
          <QueueView rows={inPeriod} getKey={(m) => m.id} columns={movementColumns(s)} searchText={movementSearch(s)} filters={[...movementFilters(s), { label: "Driver", get: (m) => driverOf(s, m.driverId)?.name ?? "" }, { label: "Miner", get: (m) => partyName(s, txnOf(s, m.txnId)?.minerId) }, { label: "Status", get: (m) => m.stage }]} />
        </Panel>
      </div>
    </>
  );
}
