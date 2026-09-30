import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Copy, Truck } from "lucide-react";
import { toast } from "sonner";

import { BrandHeader } from "@/components/careers/BrandHeader";
import { Button } from "@/components/careers/ui/button";
import { LogisticsPartnerForm } from "@/components/careers/logistics/LogisticsPartnerForm";
import { StatusTracker } from "@/components/careers/logistics/StatusTracker";

export const Route = createFileRoute("/careers/logistics-partner-registration")({
  component: LogisticsPartnerRegistrationPage,
});

type View = { kind: "form" } | { kind: "submitted"; applicationId: string };

function LogisticsPartnerRegistrationPage() {
  const [view, setView] = useState<View>({ kind: "form" });

  return (
    <div className="bg-hero-radial min-h-screen">
      <BrandHeader />

      <main className="relative mx-auto w-full max-w-7xl px-6 pb-24">
        {view.kind === "form" && (
          <>
            <section className="mx-auto w-full max-w-4xl pt-10 pb-4 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-navy/15 bg-white/70 px-3 py-1 text-xs font-semibold tracking-[0.22em] text-brand-navy-deep uppercase backdrop-blur">
                <Truck className="h-3.5 w-3.5" />
                Beldium Logistics Partner Network
              </span>
              <h1 className="mt-4 font-display text-3xl font-bold text-brand-navy-deep sm:text-4xl">
                Become a verified logistics partner
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Once approved, your company can receive RFQs and transport assignments directly
                through the Beldium platform.
              </p>
            </section>

            <div className="pt-6">
              <LogisticsPartnerForm
                onSubmitted={(applicationId) => setView({ kind: "submitted", applicationId })}
              />
            </div>
          </>
        )}

        {view.kind === "submitted" && <SubmittedView applicationId={view.applicationId} />}
      </main>
    </div>
  );
}

function SubmittedView({ applicationId }: { applicationId: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(applicationId);
      toast.success("Application ID copied");
    } catch {
      toast.error("Copy failed, please save it manually");
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl pt-10">
      <div className="glass-card rounded-3xl p-8 text-center sm:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-navy-deep text-white shadow-glow">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="mt-6 text-xs font-semibold tracking-[0.28em] text-brand-navy-soft uppercase">
          Application received
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold text-brand-navy-deep sm:text-4xl">
          Thank you for applying to become a logistics partner.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Our team will review your submitted documents and be in touch by email.
        </p>

        <div className="mt-8 rounded-2xl border border-brand-navy/15 bg-brand-mist/60 p-5">
          <p className="text-xs font-semibold tracking-[0.22em] text-brand-navy-soft uppercase">
            Your application ID
          </p>
          <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <code className="rounded-lg bg-white px-4 py-2 font-display text-xl font-bold tracking-widest text-brand-navy-deep shadow-sm">
              {applicationId}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copy}
              className="rounded-full"
            >
              <Copy className="mr-2 h-3.5 w-3.5" /> Copy
            </Button>
          </div>
        </div>
      </div>

      <div className="glass-card mt-6 rounded-3xl p-8 sm:p-10">
        <h3 className="font-display text-xl font-bold text-brand-navy-deep">Application status</h3>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Track your progress towards becoming an active logistics partner.
        </p>
        <StatusTracker status="submitted" />
      </div>
    </div>
  );
}
