import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode } from "lucide-react";
import { AppShell } from "@/components/beldium/shell";
import { EmptyState, PageHeader, Stat, StatusPill, Surface, SectionTitle } from "@/components/beldium/ui";
import { useBeldium } from "@/lib/beldium/store";

export const Route = createFileRoute("/certificates/")({
  head: () => ({
    meta: [
      { title: "Material certificates — Beldium" },
      {
        name: "description",
        content:
          "Issued material certificates with verification hashes, scan counts and revocation status for buyers and regulators.",
      },
      { property: "og:title", content: "Material certificates — Beldium" },
      {
        property: "og:description",
        content: "Verifiable, revocable certificates bound to sealed samples and accredited results.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <CertificatesPage />
    </AppShell>
  ),
});

function CertificatesPage() {
  const { state } = useBeldium();
  return (
    <>
      <PageHeader
        eyebrow="Proof of material"
        title="Certificates"
        description="A Beldium certificate is a pointer into the record: sealed sample, accredited method, reviewed result. It can be verified by anyone and revoked at any time."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Issued" value={state.certificates.length} />
        <Stat label="Active" value={state.certificates.filter((c) => c.status === "active").length} tone="pale" />
        <Stat label="Revoked" value={state.certificates.filter((c) => c.status === "revoked").length} />
        <Stat
          label="Verification scans"
          value={state.certificates.reduce((n, c) => n + c.scans, 0)}
          sub="public checks recorded"
        />
      </div>

      <Surface className="mt-6">
        <SectionTitle title="Certificate register" hint="Open a certificate for the full verification detail" />
        <div className="divide-y divide-border">
          {state.certificates.length === 0 ? (
            <EmptyState title="No certificates issued yet" />
          ) : (
            state.certificates.map((c) => (
              <Link
                key={c.id}
                to="/certificates/$id"
                params={{ id: c.id }}
                className="grid gap-2 px-6 py-4 transition hover:bg-accent/50 lg:grid-cols-12 lg:items-center"
              >
                <div className="lg:col-span-4">
                  <p className="font-display text-sm font-semibold text-navy">{c.ref}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.material} · sample {c.sampleRef}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground lg:col-span-3">{c.issuedBy}</p>
                <p className="text-xs text-muted-foreground lg:col-span-2">
                  {c.issuedAt} → {c.validUntil}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground lg:col-span-1">
                  <QrCode className="size-3.5" /> {c.scans}
                </p>
                <div className="lg:col-span-2 lg:text-right">
                  <StatusPill value={c.status} />
                </div>
              </Link>
            ))
          )}
        </div>
      </Surface>
    </>
  );
}
