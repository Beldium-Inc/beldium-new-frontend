import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PackagePlus } from "lucide-react";
import { AppShell } from "@/verticals/quality/shell";
import { EmptyState, PageHeader, Pill, SectionTitle, Stat, StatusPill, Surface } from "@/verticals/quality/ui";
import { useBeldium, useBuyerSpecList } from "@/verticals/quality/store";

export const Route = createFileRoute("/quality/samples/")({
  head: () => ({
    meta: [
      { title: "Samples & chain of custody | Beldium" },
      {
        name: "description",
        content:
          "Register lot samples, follow sealed custody events from pit to accredited bench, and track testing status through certification.",
      },
      { property: "og:title", content: "Samples & chain of custody | Beldium" },
      {
        property: "og:description",
        content: "Sealed custody events from pit face to accredited laboratory bench.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <SamplesPage />
    </AppShell>
  ),
});

function SamplesPage() {
  const { state, role, registerSample } = useBeldium();
  const buyerSpecs = useBuyerSpecList();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    material: "Cassiterite concentrate",
    lot: "",
    mineSite: "Kivu Ridge Pit 4",
    origin: "South Kivu, DRC",
    massKg: "10",
    buyerSpecId: "",
  });

  React.useEffect(() => {
    if (!form.buyerSpecId && buyerSpecs.length > 0) {
      setForm((f) => ({ ...f, buyerSpecId: buyerSpecs[0]!.id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerSpecs]);

  const canRegister = role === "miner" || role === "operator";

  return (
    <>
      <PageHeader
        eyebrow="Traceability"
        title="Samples & chain of custody"
        description="A Beldium sample is only as trustworthy as the seal history behind it. Every handover is timestamped, attributed and hashed."
        actions={
          canRegister ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-navy-foreground hover:bg-navy/90"
            >
              <PackagePlus className="size-4" /> Register sample
            </button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total samples" value={state.samples.length} />
        <Stat label="In transit" value={state.samples.filter((s) => s.status === "in_transit").length} sub="custody open" />
        <Stat label="Under test" value={state.samples.filter((s) => s.status === "testing").length} tone="pale" />
        <Stat label="Certified" value={state.samples.filter((s) => s.status === "certified").length} sub="buyer-ready" />
      </div>

      {open && canRegister ? (
        <Surface className="mt-6">
          <SectionTitle title="Register a new sample" hint="Creates the first custody event and seals the lot" />
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["Lot reference", "lot", "e.g. KRM-LOT-1200"],
                ["Mine site", "mineSite", ""],
                ["Origin", "origin", ""],
                ["Mass (kg)", "massKg", ""],
              ] as const
            ).map(([label, key, ph]) => (
              <label key={key} className="block">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {label}
                </span>
                <input
                  value={form[key]}
                  placeholder={ph}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-link"
                />
              </label>
            ))}
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Material
              </span>
              <select
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-link"
              >
                <option>Cassiterite concentrate</option>
                <option>Coltan concentrate</option>
                <option>Gold doré</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Buyer specification
              </span>
              <select
                value={form.buyerSpecId}
                onChange={(e) => setForm({ ...form, buyerSpecId: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-link"
              >
                {buyerSpecs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2 px-6 pb-6">
            <button
              type="button"
              onClick={async () => {
                if (!form.lot.trim()) {
                  toast.error("A lot reference is required");
                  return;
                }
                const id = await registerSample({
                  material: form.material,
                  lot: form.lot,
                  mineSite: form.mineSite,
                  origin: form.origin,
                  massKg: Number(form.massKg) || 0,
                  buyerSpecId: form.buyerSpecId,
                });
                toast.success("Sample registered and sealed");
                setOpen(false);
                navigate({ to: "/quality/samples/$id", params: { id } });
              }}
              className="rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-navy-foreground hover:bg-navy/90"
            >
              Seal &amp; register
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </Surface>
      ) : null}

      <Surface className="mt-6">
        <SectionTitle title="Sample register" hint="Click a sample for custody, tests and review" />
        <div className="divide-y divide-border">
          {state.samples.length === 0 ? (
            <EmptyState title="No samples registered yet" />
          ) : (
            state.samples.map((s) => (
              <Link
                key={s.id}
                to="/quality/samples/$id"
                params={{ id: s.id }}
                className="grid gap-2 px-6 py-4 transition hover:bg-accent/50 lg:grid-cols-12 lg:items-center"
              >
                <div className="lg:col-span-4">
                  <p className="font-display text-sm font-semibold text-navy">{s.ref}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.material} · lot {s.lot} · {s.massKg} kg
                  </p>
                </div>
                <p className="text-xs text-muted-foreground lg:col-span-3">{s.origin}</p>
                <p className="text-xs text-muted-foreground lg:col-span-2">{s.partnerOrg}</p>
                <div className="lg:col-span-1">
                  <Pill tone="info">{s.custody.length} events</Pill>
                </div>
                <div className="lg:col-span-2 lg:text-right">
                  <StatusPill value={s.status} />
                </div>
              </Link>
            ))
          )}
        </div>
      </Surface>
    </>
  );
}
