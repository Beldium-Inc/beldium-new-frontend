import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { AppShell, Button, DemoNote, SectionCard } from "@/verticals/marketplace/AppShell";
import { StatusBadge } from "@/verticals/marketplace/StatusBadge";
import { Input } from "@/components/ui/input";
import { fmtDate, fmtTonnes, useDemo } from "@/verticals/marketplace/store";

export const Route = createFileRoute("/marketplace/rfqs/")({
  head: () => ({
    meta: [
      { title: "RFQs | Beldium Marketplace" },
      {
        name: "description",
        content:
          "Create offtake RFQs and track aggregation of verified mine capacity against target volume.",
      },
      { property: "og:title", content: "RFQs | Beldium Marketplace" },
      {
        property: "og:description",
        content:
          "Publish a million-tonne offtake request and aggregate verified supply to fill it.",
      },
    ],
  }),
  component: RfqsPage,
});

function RfqsPage() {
  const { state, createRfq, autoAggregate } = useDemo();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    commodity: "Manganese ore",
    grade: "≥ 36% Mn",
    volumeTonnes: "1000000",
    incoterm: "CIF",
    destination: "Rotterdam, NL",
    deliveryWindow: "Jan 2027: Dec 2027",
    targetPriceUsd: "600",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    const volume = Number(form.volumeTonnes);
    const price = Number(form.targetPriceUsd);
    if (!volume || !price) {
      toast.error("Volume and target price are required.");
      return;
    }
    const id = await createRfq({
      commodity: form.commodity,
      grade: form.grade,
      volumeTonnes: volume,
      incoterm: form.incoterm,
      destination: form.destination,
      deliveryWindow: form.deliveryWindow,
      targetPriceUsd: price,
    });
    autoAggregate(id);
    toast.success(`${id} published to verified supply`, {
      description: "Matching verified miners aggregated by available capacity.",
    });
    navigate({ to: "/marketplace/rfqs/$id", params: { id } });
  };

  return (
    <AppShell
      title="Requests for quotation"
      subtitle="Publish demand, aggregate verified mine capacity and take it to contract"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <SectionCard title="Open & historic RFQs" description={`${state.rfqs.length} record(s)`}>
          <ul className="divide-y divide-border">
            {state.rfqs.map((r) => {
              const filled = r.allocations.reduce((s, a) => s + a.tonnes, 0);
              return (
                <li key={r.id} className="py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to="/marketplace/rfqs/$id"
                      params={{ id: r.id }}
                      className="font-medium hover:underline"
                    >
                      {r.reference}
                    </Link>
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-muted-foreground">
                      raised {fmtDate(r.createdAt)} by {r.createdByName}
                    </span>
                    <span className="ml-auto text-sm font-medium">
                      {fmtTonnes(filled)} / {fmtTonnes(r.volumeTonnes)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.commodity} {r.grade} · {r.incoterm} {r.destination} · {r.deliveryWindow} ·
                    target ${r.targetPriceUsd}/t
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (filled / r.volumeTonnes) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard
          title="Create offtake RFQ"
          description="Pre-filled with the 1,000,000 t demo scenario"
        >
          <div className="grid gap-3">
            <Field label="Commodity" value={form.commodity} onChange={set("commodity")} />
            <Field label="Grade / specification" value={form.grade} onChange={set("grade")} />
            <Field
              label="Volume (tonnes)"
              value={form.volumeTonnes}
              onChange={set("volumeTonnes")}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Incoterm" value={form.incoterm} onChange={set("incoterm")} />
              <Field
                label="Target price ($/t)"
                value={form.targetPriceUsd}
                onChange={set("targetPriceUsd")}
              />
            </div>
            <Field label="Destination" value={form.destination} onChange={set("destination")} />
            <Field
              label="Delivery window"
              value={form.deliveryWindow}
              onChange={set("deliveryWindow")}
            />
            <Button onClick={submit}>
              <Sparkles className="size-4" /> Publish & aggregate supply
            </Button>
            <DemoNote>
              At 1,000,000 t and $600/t the commitment is $600m, the finance workspace assumes a
              $100m buyer contribution and a $500m financing requirement.
            </DemoNote>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <Input value={value} onChange={onChange} />
    </label>
  );
}
