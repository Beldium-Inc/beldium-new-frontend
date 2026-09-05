import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { AuthShell, InfoRow } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/lib/onboarding/store";

export const Route = createFileRoute("/onboarding/submitted")({
  component: SubmittedPage,
  head: () => ({
    meta: [
      { title: "Application Submitted · Beldium Mining Compliance" },
      { name: "description", content: "Your Beldium mining compliance application has been submitted and is now under review." },
      { property: "og:title", content: "Application Submitted · Beldium Mining Compliance" },
      { property: "og:description", content: "Your Beldium mining compliance application is under review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SubmittedPage() {
  const { role, application, professional, submittedAt, documents } = useOnboarding();
  const navigate = useNavigate();
  const isProfessional = role === "independent";
  const ref = (isProfessional ? professional.ref : application.ref) || "APP-PENDING";
  const applicant = isProfessional ? professional.fullName : application.legalName;

  return (
    <AuthShell
      eyebrow="Submission received"
      title="Application submitted successfully"
      description="Your application has been received by the Beldium verification team. You can sign in at any time to track progress, respond to information requests and view review activity."
    >
      <div className="flex items-start gap-3 rounded-[20px] border border-success/50 bg-success/20 p-5">
        <CheckCircle2 className="mt-0.5 size-6" />
        <div>
          <p className="font-display text-sm font-semibold">
            {isProfessional ? "Professional application" : "Organisation application"} received
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {applicant ? `${applicant}: ` : ""}we will contact you through the platform if anything further is required.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-1 rounded-[18px] border border-border p-5">
        <InfoRow label="Application reference" value={<span className="font-semibold">{ref}</span>} />
        <InfoRow label="Status" value={<span className="font-semibold uppercase tracking-wide">Under Review</span>} />
        <InfoRow label="Submitted" value={submittedAt ?? "Just now"} />
        <InfoRow label="Documents attached" value={`${documents.length}`} />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Operational compliance functions stay locked until Beldium completes verification. After approval, your Beldium Compliance ID is
        issued and only your approved capabilities are activated.
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button size="lg" onClick={() => navigate({ to: "/signin" })}>
          Go to Sign In
        </Button>
      </div>
    </AuthShell>
  );
}
