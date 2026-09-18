import { Link } from "@tanstack/react-router";

import { StatusChip, complianceTone, prettify, type ChipTone } from "@/components/status-chip";
import { cn } from "@/lib/utils";
import { domainLabel, type EcosystemDomain, type MaterialBatch, type Transaction } from "@/lib/ecosystem-data";

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-card-foreground">{title}</h2>
            {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function DataTable({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {head.map((h) => (
              <th key={h} className="px-2 py-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-border/60 px-2 py-2.5 align-middle text-card-foreground", className)}>{children}</td>;
}

export function StageChip({ stage }: { stage: string }) {
  return <StatusChip tone={stageTone(stage)}>{prettify(stage)}</StatusChip>;
}

export function stageTone(stage: string): ChipTone {
  if (stage === "payment_settlement" || stage === "delivered") return "success";
  if (stage === "rfq_received") return "info";
  return "warning";
}

export function StatusPill({ value }: { value: string }) {
  return <StatusChip tone={complianceTone(value)}>{prettify(value)}</StatusChip>;
}

export function TxLink({ id, reference }: { id: string; reference: string }) {
  return (
    <Link
      to="/portal/transactions/$transactionId"
      params={{ transactionId: id }}
      className="font-medium text-primary underline-offset-4 hover:underline"
    >
      {reference}
    </Link>
  );
}

export function DomainChip({ domain }: { domain: EcosystemDomain | "compliance" }) {
  return <StatusChip tone="info">{domain === "compliance" ? "Compliance" : domainLabel[domain]}</StatusChip>;
}

export function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{label}</p>;
}
