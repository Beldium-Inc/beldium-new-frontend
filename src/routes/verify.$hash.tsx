import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ShieldAlert } from "lucide-react";

import { BeldiumLogo } from "@/components/beldium-logo";
import { ApiError } from "@/lib/api/errors";
import { verifyCertificate } from "@/lib/api/quality";

export const Route = createFileRoute("/verify/$hash")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Verify a certificate | Beldium Quality & Control" },
      {
        name: "description",
        content: "Check that a Beldium material certificate is genuine and still valid.",
      },
    ],
  }),
  component: VerifyPage,
});

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" }) : "No expiry";
}

function VerifyPage() {
  const { hash } = useParams({ from: "/verify/$hash" });
  const query = useQuery({
    queryKey: ["quality", "verify", hash],
    queryFn: () => verifyCertificate(hash),
    retry: false,
  });

  const cert = query.data;
  const notFound = query.error instanceof ApiError && query.error.status === 404;
  const valid =
    cert?.status === "active" && (!cert.valid_until || new Date(cert.valid_until) > new Date());

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-12">
      <BeldiumLogo className="size-10" />
      <p className="mt-3 text-xs tracking-wide text-muted-foreground uppercase">
        Beldium Quality &amp; Control
      </p>

      <div className="mt-8 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        {query.isPending ? (
          <p className="text-center text-sm text-muted-foreground">Checking certificate…</p>
        ) : notFound ? (
          <div className="text-center">
            <ShieldAlert className="mx-auto size-10 text-danger-foreground" />
            <h1 className="mt-3 font-display text-lg font-semibold text-navy">
              Certificate not found
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              No Beldium certificate matches this code. Treat the material as unverified.
            </p>
          </div>
        ) : query.error || !cert ? (
          <p className="text-center text-sm text-muted-foreground">
            {query.error instanceof ApiError && query.error.status === 429
              ? "Too many checks from this connection. Please wait a minute and try again."
              : "The certificate could not be checked right now. Please try again."}
          </p>
        ) : (
          <div>
            <div className="text-center">
              {valid ? (
                <BadgeCheck className="mx-auto size-10 text-link" />
              ) : (
                <ShieldAlert className="mx-auto size-10 text-danger-foreground" />
              )}
              <h1 className="mt-3 font-display text-lg font-semibold text-navy">
                {valid
                  ? "Genuine and valid"
                  : cert.status === "revoked"
                    ? "Certificate revoked"
                    : "Certificate not valid"}
              </h1>
            </div>
            <dl className="mt-5 divide-y divide-border text-sm">
              {[
                ["Certificate", cert.reference],
                ["Sample", cert.sample_reference],
                ["Material", cert.material],
                ["Issued", formatDate(cert.issued_at)],
                ["Valid until", formatDate(cert.valid_until)],
                ["Times verified", String(cert.scans)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium text-navy">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      <p className="mt-6 max-w-md text-center text-xs text-muted-foreground">
        Beldium issues an independent verification record. It is not a government permit or
        licence.
      </p>
    </div>
  );
}
