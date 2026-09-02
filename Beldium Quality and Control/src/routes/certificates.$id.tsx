import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, BadgeCheck, Link2, ShieldX } from "lucide-react";
import { AppShell } from "@/components/beldium/shell";
import {
  EmptyState,
  Field,
  PageHeader,
  Pill,
  SectionTitle,
  StatusPill,
  Surface,
} from "@/components/beldium/ui";
import { useBeldium } from "@/lib/beldium/store";

export const Route = createFileRoute("/certificates/$id")({
  head: () => ({
    meta: [
      { title: "Certificate verification — Beldium" },
      {
        name: "description",
        content:
          "Full verification detail for a material certificate: issuing partner, sealed sample, analytical basis and revocation status.",
      },
      { property: "og:title", content: "Certificate verification — Beldium" },
      {
        property: "og:description",
        content: "Trace a certificate back to its sealed sample and accredited analytical basis.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <CertificateDetail />
    </AppShell>
  ),
});

function CertificateDetail() {
  const { id } = useParams({ from: "/certificates/$id" });
  const { state, role, revokeCertificate } = useBeldium();
  const cert = state.certificates.find((c) => c.id === id);

  if (!cert) {
    return (
      <Surface>
        <EmptyState title="Certificate not found" />
      </Surface>
    );
  }

  const sample = state.samples.find((s) => s.ref === cert.sampleRef);
  const canRevoke = role === "operator" || role === "partner";

  return (
    <>
      <Link
        to="/certificates"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-link hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to certificates
      </Link>

      <PageHeader
        eyebrow={cert.ref}
        title={`${cert.material} certificate`}
        description={`Issued by ${cert.issuedBy} on ${cert.issuedAt}, valid until ${cert.validUntil}.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill value={cert.status} />
            {canRevoke && cert.status === "active" ? (
              <button
                type="button"
                onClick={() => {
                  revokeCertificate(cert.id);
                  toast("Certificate revoked — public verification will now fail");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-danger bg-danger/15 px-4 py-2 text-sm font-semibold text-danger-foreground"
              >
                <ShieldX className="size-4" /> Revoke
              </button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Surface
            className={
              cert.status === "active"
                ? "border-success bg-success/25 p-6"
                : "border-danger bg-danger/10 p-6"
            }
          >
            <div className="flex items-start gap-4">
              {cert.status === "active" ? (
                <BadgeCheck className="size-8 shrink-0 text-success-foreground" />
              ) : (
                <ShieldX className="size-8 shrink-0 text-danger-foreground" />
              )}
              <div>
                <p className="font-display text-lg font-semibold text-navy">
                  {cert.status === "active"
                    ? "Verification successful"
                    : "This certificate has been revoked"}
                </p>
                <p className="mt-1 text-sm text-navy/80">
                  {cert.status === "active"
                    ? "The certificate hash matches the sealed record and the issuing partner is a listed Quality & Control Partner."
                    : "The issuing record was withdrawn. Do not rely on this document for material acceptance."}
                </p>
                <p className="mt-3 font-mono text-xs break-all text-navy/70">
                  {cert.verificationHash}
                </p>
              </div>
            </div>
          </Surface>

          <Surface>
            <SectionTitle title="Certificate detail" />
            <dl className="grid gap-5 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Reference" value={cert.ref} />
              <Field label="Material" value={cert.material} />
              <Field label="Sample" value={cert.sampleRef} />
              <Field label="Issued by" value={cert.issuedBy} />
              <Field label="Issued" value={cert.issuedAt} />
              <Field label="Valid until" value={cert.validUntil} />
              <Field label="Public scans" value={String(cert.scans)} />
            </dl>
          </Surface>

          <Surface>
            <SectionTitle title="Analytical basis" hint="The results this certificate attests to" />
            {sample ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                      <th className="px-6 py-3 font-semibold">Analyte</th>
                      <th className="px-6 py-3 font-semibold">Result</th>
                      <th className="px-6 py-3 font-semibold">Specification</th>
                      <th className="px-6 py-3 font-semibold">Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sample.results.map((r) => (
                      <tr key={r.id}>
                        <td className="px-6 py-3 font-medium text-navy">{r.analyte}</td>
                        <td className="px-6 py-3 text-navy">
                          {r.value} {r.unit}
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{r.spec}</td>
                        <td className="px-6 py-3">
                          <StatusPill value={r.verdict} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="Source sample archived" hint="The linked sample record is not in this workspace." />
            )}
          </Surface>
        </div>

        <div className="space-y-6">
          <Surface>
            <SectionTitle title="Traceability" hint="Follow the certificate back to the pit face" />
            <div className="space-y-4 px-6 py-5">
              {sample ? (
                <>
                  {sample.custody.map((c) => (
                    <div key={c.id} className="relative border-l-2 border-pale pl-4">
                      <span className="absolute -left-[7px] top-1.5 size-3 rounded-full bg-link" />
                      <p className="text-sm font-medium text-navy">{c.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.location} · {c.at}
                      </p>
                    </div>
                  ))}
                  <Link
                    to="/samples/$id"
                    params={{ id: sample.id }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-link hover:underline"
                  >
                    <Link2 className="size-4" /> Open sample dossier
                  </Link>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No custody data available.</p>
              )}
            </div>
          </Surface>

          <Surface>
            <SectionTitle title="Issuing partner standing" />
            <div className="space-y-3 px-6 py-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Listing</span>
                <Pill tone="success">approved partner</Pill>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Accreditation</span>
                <span className="font-medium text-navy">ISO/IEC 17025</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Open non-conformities</span>
                <span className="font-medium text-navy">
                  {state.nonConformities.filter((n) => n.against === cert.issuedBy && n.status !== "closed").length}
                </span>
              </div>
            </div>
          </Surface>
        </div>
      </div>
    </>
  );
}
