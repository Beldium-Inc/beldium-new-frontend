import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { AppShell, Button, SectionCard } from "@/verticals/marketplace/AppShell";
import { StatusBadge } from "@/verticals/marketplace/StatusBadge";
import { Input } from "@/components/ui/input";
import { fmtTonnes, useDemo } from "@/verticals/marketplace/store";

export const Route = createFileRoute("/marketplace/marketplace")({
  head: () => ({
    meta: [
      { title: "Find supply | Beldium Marketplace" },
      { name: "description", content: "Search verified mine supply by commodity, grade, origin and available capacity." },
      { property: "og:title", content: "Find supply | Beldium Marketplace" },
      { property: "og:description", content: "Verified producer capacity indexed for aggregation into offtake RFQs." },
    ],
  }),
  component: Marketplace,
});

function Marketplace() {
  const { state } = useDemo();
  const [q, setQ] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const miners = state.miners.filter(
    (m) =>
      (!verifiedOnly || m.compliance === "verified") &&
      [m.name, m.country, m.region, m.grade].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell
      title="Find supply"
      subtitle="Verified producer capacity available for aggregation"
      actions={
        <Button asChild size="sm">
          <Link to="/marketplace/rfqs">Create RFQ</Link>
        </Button>
      }
    >
      <SectionCard title="Producers" description={`${miners.length} of ${state.miners.length} shown`}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search miner, origin or grade" className="pl-9" />
          </div>
          <Button variant={verifiedOnly ? "default" : "outline"} size="sm" onClick={() => setVerifiedOnly((v) => !v)}>
            {verifiedOnly ? "Verified only" : "All producers"}
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {miners.map((m) => (
            <article key={m.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{m.name}</h3>
                <StatusBadge status={m.compliance} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {m.region}, {m.country} · {m.grade}
              </p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Capacity p.a.</dt>
                  <dd className="font-medium">{fmtTonnes(m.capacityTpa)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Available</dt>
                  <dd className="font-medium">{fmtTonnes(m.availableTonnes)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">ESG score</dt>
                  <dd className="font-medium">{m.esgScore}/100</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                Reachable via {m.channels.map((c) => (c === "in_app" ? "in-app" : c)).join(", ")}
              </p>
            </article>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
