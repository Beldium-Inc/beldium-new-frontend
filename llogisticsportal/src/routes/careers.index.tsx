import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Copy, Globe2, Home, Sparkles, Truck } from "lucide-react";
import { toast } from "sonner";

import { BrandHeader, BrandMark } from "@/components/careers/BrandHeader";
import { PathwayCard } from "@/components/careers/PathwayCard";
import { ApplicationForm } from "@/components/careers/ApplicationForm";
import { LogisticsPartnerForm } from "@/components/careers/logistics/LogisticsPartnerForm";
import { Button } from "@/components/careers/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PATHWAYS, PATHWAY_META, type Pathway } from "@/lib/careers/application-schemas";
import { CONTACT_EMAIL, CONTACT_NAME, CONTACT_ROLE } from "@/lib/careers/site-config";

export const Route = createFileRoute("/careers/")({
  component: TalentPortal,
});

type View =
  | { kind: "landing" }
  | { kind: "form"; pathway: Pathway }
  | { kind: "success"; pathway: Pathway; referenceId: string };

function TalentPortal() {
  const [view, setView] = useState<View>({ kind: "landing" });
  const formAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view.kind !== "landing") {
      formAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [view]);

  const selectPathway = (pathway: Pathway) => setView({ kind: "form", pathway });
  const goHome = () => setView({ kind: "landing" });

  return (
    <div className="bg-hero-radial min-h-screen">
      <BrandHeader onHome={goHome} />

      {view.kind === "landing" && <Hero onSelect={selectPathway} />}

      <main className="relative mx-auto w-full max-w-7xl px-6 pb-24">
        <div ref={formAnchorRef} className="scroll-mt-24" />

        {view.kind === "landing" && (
          <>
            <section id="pathways" className="mt-4">
              <div className="mb-10 max-w-2xl">
                <p className="text-xs font-semibold tracking-[0.28em] text-brand-navy-soft uppercase">
                  Three pathways · one mission
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold text-brand-navy-deep sm:text-4xl">
                  Choose how you want to build with Beldium
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Select a pathway to begin your application. Each track is reviewed by the
                  Logistics Department leadership team.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {PATHWAYS.map((p, i) => (
                  <PathwayCard
                    key={p}
                    pathway={p}
                    index={i}
                    id={p === "partnership" ? "pathway-partnership" : undefined}
                    onSelect={selectPathway}
                  />
                ))}
              </div>
            </section>

            <ValueStrip />
            <ReviewerNotes />
            <FooterBlock />
          </>
        )}

        {view.kind === "form" && view.pathway === "partnership" && (
          <div className="pt-6">
            <PartnershipRegistrationView
              onBack={goHome}
              onSubmitted={(referenceId) =>
                setView({ kind: "success", pathway: view.pathway, referenceId })
              }
            />
          </div>
        )}

        {view.kind === "form" && view.pathway !== "partnership" && (
          <div className="pt-6">
            <ApplicationForm
              pathway={view.pathway}
              onBack={goHome}
              onSubmitted={(referenceId) =>
                setView({ kind: "success", pathway: view.pathway, referenceId })
              }
            />
          </div>
        )}

        {view.kind === "success" && (
          <SuccessView pathway={view.pathway} referenceId={view.referenceId} onDone={goHome} />
        )}
      </main>
    </div>
  );
}

/* ---------- Partnership (logistics partner registration) ---------- */

function PartnershipRegistrationView({
  onBack,
  onSubmitted,
}: {
  onBack: () => void;
  onSubmitted: (applicationId: string) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-brand-navy-soft transition hover:text-brand-navy-deep"
          >
            <ArrowLeft className="h-4 w-4" />
            Choose a different pathway
          </button>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-navy/15 bg-white/70 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-brand-navy-deep uppercase">
            {PATHWAY_META.partnership.title}
          </span>
        </div>
        {/* <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-brand-navy-soft transition hover:text-brand-navy-deep"
        >
          <Home className="h-4 w-4" />
          Back to homepage
        </Link> */}
      </div>

      <LogisticsPartnerForm onSubmitted={onSubmitted} />
    </div>
  );
}

/* ---------- Hero ---------- */

function Hero({ onSelect }: { onSelect: (p: Pathway) => void }) {
  return (
    <section className="relative mx-auto w-full max-w-7xl overflow-hidden px-6 pt-6 pb-16 sm:pt-14 sm:pb-24">
      <div className="pointer-events-none absolute top-10 right-4 hidden lg:block">
        <div className="glass-panel animate-float-slow rounded-3xl p-6 shadow-elevated">
          <BrandMark size={180} className="opacity-90" />
        </div>
      </div>

      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-navy/15 bg-white/70 px-3 py-1 text-xs font-semibold tracking-[0.22em] text-brand-navy-deep uppercase backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          Beldium Logistics Talent Portal
        </span>

        <h1 className="mt-6 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-brand-navy-deep sm:text-6xl">
          Building the people powering{" "}
          <span className="text-brand-gradient">Africa&apos;s digital logistics</span>{" "}
          infrastructure.
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Join Beldium Corporation&apos;s Logistics Department as an intern, a volunteer, or a
          strategic partner. Every application powers the network moving Africa forward.
        </p>

        <dl className="mt-8 grid max-w-2xl grid-cols-3 gap-4 border-t border-brand-navy/10 pt-6 sm:gap-6">
          {[
            { k: "3", v: "Application pathways" },
            { k: "24h", v: "Acknowledgement window" },
            { k: "Pan-African", v: "Operating footprint" },
          ].map((s) => (
            <div key={s.v}>
              <dt className="font-display text-2xl font-bold text-brand-navy-deep sm:text-3xl">
                {s.k}
              </dt>
              <dd className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            onClick={() =>
              document.getElementById("pathways")?.scrollIntoView({ behavior: "smooth" })
            }
            className="rounded-full bg-brand-navy-deep px-7 hover:bg-brand-navy"
          >
            Explore pathways
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onSelect("partnership")}
            className="rounded-full border-brand-navy/25 bg-white/70 text-brand-navy-deep hover:bg-white"
          >
            I represent an organisation
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Value strip ---------- */

function ValueStrip() {
  const items = [
    {
      icon: Truck,
      title: "Real logistics, real impact",
      body: "Contribute to live fleet, dispatch, and last-mile projects across the continent.",
    },
    {
      icon: Globe2,
      title: "Built for Africa, for the world",
      body: "Work alongside engineers, operators, and partners scaling infrastructure globally.",
    },
    {
      icon: Sparkles,
      title: "AI-ready pipeline",
      body: "Every application is structured for future AI-assisted review and matching.",
    },
  ];
  return (
    <section className="mt-24">
      <div className="rounded-3xl bg-brand-mist/50 p-6 sm:p-10">
        <div className="grid gap-4 md:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="glass-panel rounded-2xl p-6 transition hover:shadow-elevated"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-mist text-brand-navy-deep">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-brand-navy-deep">
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Reviewer notes (FAQ) ---------- */

function ReviewerNotes() {
  const items: { pathway: Pathway; body: string }[] = [
    {
      pathway: "internship",
      body: "Reviewers weigh your motivation and areas of interest alongside the relevant skills and software experience you list. Practical readiness matters too: your weekly availability, a working laptop, and reliable internet all help us picture how you'd plug into a live team.",
    },
    {
      pathway: "volunteer",
      body: "We look at the professional background and area of expertise you bring, and the specific skills you'd contribute to the mission. Tell us the team you'd like to support and your weekly availability so we can match you to work that fits.",
    },
    {
      pathway: "partnership",
      body: "Reviewers verify your company registration, insurance, and fleet documents before approval. Complete company information, a full document set, and signed agreements all help us onboard you as an active logistics partner faster.",
    },
  ];
  return (
    <section className="mt-24">
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.28em] text-brand-navy-soft uppercase">
          Before you apply
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold text-brand-navy-deep sm:text-4xl">
          What reviewers look for
        </h2>
        <p className="mt-3 text-muted-foreground">
          A quick sense of what the Logistics Department leadership team weighs in each pathway.
        </p>
      </div>
      <div className="glass-panel rounded-3xl px-6 sm:px-8">
        <Accordion type="single" collapsible>
          {items.map(({ pathway, body }) => (
            <AccordionItem
              key={pathway}
              value={pathway}
              className="border-brand-navy/10 last:border-b-0"
            >
              <AccordionTrigger className="font-display text-base font-semibold text-brand-navy-deep">
                {PATHWAY_META[pathway].title}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {body}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */

function FooterBlock() {
  return (
    <footer className="mt-24 rounded-3xl bg-brand-gradient p-8 text-white sm:p-12">
      <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.28em] text-white/70 uppercase">
            Beldium Corporation
          </p>
          <h3 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
            Ready to help move Africa forward?
          </h3>
          <p className="mt-3 max-w-xl text-sm text-white/80">
            Applications are reviewed on a rolling basis. Reach out directly for executive
            partnership inquiries.
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-5 text-brand-navy-deep">
          <p className="text-xs font-semibold tracking-[0.22em] text-brand-navy-soft uppercase">
            Direct contact
          </p>
          <p className="mt-2 font-display text-base font-bold text-brand-navy-deep">
            {CONTACT_NAME} · {CONTACT_ROLE}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-1 block text-sm font-semibold text-brand-navy-soft hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="mt-1 text-xs text-muted-foreground">
            Logistics Department, Beldium Corporation
          </p>
        </div>
      </div>
      <p className="mt-10 text-xs text-white/60">
        © {new Date().getFullYear()} Beldium Corporation. All rights reserved.
      </p>
    </footer>
  );
}

/* ---------- Success ---------- */

function SuccessView({
  pathway,
  referenceId,
  onDone,
}: {
  pathway: Pathway;
  referenceId: string;
  onDone: () => void;
}) {
  const meta = PATHWAY_META[pathway];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referenceId);
      toast.success("Reference ID copied");
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
          Thank you, your {meta.title.toLowerCase()} is with us.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Our Logistics Department team will review your submission and respond by email. An
          acknowledgement has been sent to your inbox.
        </p>

        <div className="mt-8 rounded-2xl border border-brand-navy/15 bg-brand-mist/60 p-5">
          <p className="text-xs font-semibold tracking-[0.22em] text-brand-navy-soft uppercase">
            Your reference ID
          </p>
          <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <code className="rounded-lg bg-white px-4 py-2 font-display text-xl font-bold tracking-widest text-brand-navy-deep shadow-sm">
              {referenceId}
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
          <p className="mt-3 text-xs text-muted-foreground">
            Please keep this ID for your records; you may need it when we follow up with you.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onDone} className="rounded-full bg-brand-navy-deep hover:bg-brand-navy">
            Back to portal
          </Button>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-sm font-medium text-brand-navy-soft transition hover:text-brand-navy-deep"
          >
            Contact {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}
