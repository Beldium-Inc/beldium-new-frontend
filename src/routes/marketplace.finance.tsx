import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell, Button, DemoNote, Metric, SectionCard } from "@/verticals/marketplace/AppShell";
import { StatusBadge } from "@/verticals/marketplace/StatusBadge";
import { fmtUsd, useDemo } from "@/verticals/marketplace/store";
import type { FinancePackage } from "@/verticals/marketplace/demo-data";

export const Route = createFileRoute("/marketplace/finance")({
  head: () => ({
    meta: [
      { title: "Trade & supply-chain finance | Beldium" },
      {
        name: "description",
        content:
          "Structure the $500m financing requirement on a $600m offtake commitment with a $100m buyer contribution.",
      },
      { property: "og:title", content: "Trade & supply-chain finance | Beldium" },
      {
        property: "og:description",
        content: "Financing gap, instrument selection and readiness checks for aggregated offtake.",
      },
    ],
  }),
  component: Finance,
});

const TOTAL = 600_000_000;
const BUYER = 100_000_000;
const REQUIRED = TOTAL - BUYER;

function Finance() {
  const { state, submitFinance } = useDemo();
  const rfq = state.rfqs.find((r) => r.status === "accepted") ?? state.rfqs[0]!;
  const existing = rfq.finance;

  const readiness: FinancePackage["readiness"] = [
    {
      label: "Buyer/offtaker compliance verified",
      ok: true,
      note: "KYC pack accepted; limits approved.",
    },
    {
      label: "Producers verified & aggregated",
      ok: rfq.allocations.length > 0,
      note: `${rfq.allocations.length} verified miners allocated.`,
    },
    {
      label: "Transaction services confirmed",
      ok: Boolean(rfq.services?.confirmed),
      note: "Logistics, insurance, quality and finance stack locked.",
    },
    {
      label: "Buyer contribution evidenced",
      ok: true,
      note: `${fmtUsd(BUYER)} cash confirmed by bank letter.`,
    },
    {
      label: "Offtake contract executed",
      ok: rfq.status === "contracted",
      note: "Signed contract required before drawdown.",
    },
    {
      label: "Insurance & security package",
      ok: Boolean(rfq.services?.insurance),
      note: "Marine cargo plus credit risk cover assigned to funder.",
    },
  ];
  const ready = readiness.filter((r) => r.ok).length;

  const pkg: FinancePackage = {
    totalCommitmentUsd: TOTAL,
    buyerContributionUsd: BUYER,
    requiredUsd: REQUIRED,
    instrument: "Borrowing-base supply-chain facility with receivables assignment",
    tenorMonths: 18,
    status: existing?.status === "submitted" ? "in_review" : "submitted",
    readiness,
  };

  return (
    <AppShell title="Finance" subtitle={`Programme funding for ${rfq.reference}`}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric
            label="Total offtake commitment"
            value={fmtUsd(TOTAL)}
            hint="1,000,000 t at $600/t"
          />
          <Metric
            label="Buyer contribution"
            value={fmtUsd(BUYER)}
            hint="Equity / cash margin"
            tone="success"
          />
          <Metric
            label="Financing required"
            value={fmtUsd(REQUIRED)}
            hint="Trade & supply-chain facility"
            tone="warning"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <SectionCard
            title="Financing readiness checks"
            description={`${ready} of ${readiness.length} conditions met`}
          >
            <ul className="space-y-3">
              {readiness.map((r) => (
                <li
                  key={r.label}
                  className="flex items-start gap-3 rounded-md border border-border p-3"
                >
                  <span
                    className={`mt-1 size-2.5 shrink-0 rounded-full ${r.ok ? "bg-success" : "bg-warning"}`}
                  />
                  <div>
                    <p className="text-sm font-medium">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.note}</p>
                  </div>
                  <span className="ml-auto">
                    <StatusBadge status={r.ok ? "verified" : "pending"} />
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            title="Financing request"
            description="Trade & supply-chain finance"
            actions={<StatusBadge status={existing ? "under_review" : "pending"} />}
          >
            <dl className="space-y-3 text-sm">
              <Row label="Facility size" value={fmtUsd(REQUIRED)} />
              <Row label="Structure" value="Borrowing base + receivables assignment" />
              <Row label="Tenor" value="18 months revolving" />
              <Row label="Security" value="Cargo, insurance proceeds, offtake contract" />
              <Row
                label="Status"
                value={existing ? existing.status.replace(/_/g, " ") : "not started"}
              />
            </dl>
            <Button
              className="mt-4 w-full"
              onClick={() => {
                submitFinance(rfq.id, pkg);
                toast.success("Financing request submitted", {
                  description: `${fmtUsd(REQUIRED)} routed to the Beldium funding panel for indicative terms.`,
                });
              }}
            >
              {existing ? "Resubmit to funding panel" : "Submit financing request"}
            </Button>
            <DemoNote>Illustrative only: no lender is contacted and no funds move here.</DemoNote>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium capitalize">{value}</dd>
    </div>
  );
}
