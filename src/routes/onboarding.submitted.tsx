import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthShell, InfoRow } from "@/components/onboarding/ui";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUS_LABELS, useComplianceApplication } from "@/lib/api";
import { useApplicationContext } from "@/lib/onboarding/application";
import { useOnboarding } from "@/lib/onboarding/store";

export const Route = createFileRoute("/onboarding/submitted")({
  component: SubmittedPage,
  // The flow passes the id it just submitted; falling back to the resolved
  // application keeps a direct visit or a refresh working.
  validateSearch: (search: Record<string, unknown>): { id?: string } => {
    const id = search["id"];
    return typeof id === "string" && id.trim() ? { id: id.trim() } : {};
  },
  head: () => ({
    meta: [
      { title: "Application Submitted · Beldium Mining Compliance" },
      {
        name: "description",
        content:
          "Your Beldium mining compliance application has been submitted and is now under review.",
      },
      { property: "og:title", content: "Application Submitted · Beldium Mining Compliance" },
      {
        property: "og:description",
        content: "Your Beldium mining compliance application is under review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SubmittedPage() {
  const { role, professional } = useOnboarding();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const context = useApplicationContext();
  const requested = useComplianceApplication(search.id ?? null);
  const application = requested.data ?? context.application;
  const organisation = context.organisation;

  const isProfessional = role === "independent";

  // The independent-professional flow is still the local prototype; only the
  // organisation application has a backend record to read from.
  if (isProfessional) {
    return (
      <SubmittedShell
        heading="Professional application received"
        applicant={professional.fullName}
        reference={professional.ref || "APP-PENDING"}
        status="Under Review"
        submitted="Just now"
        documentCount={0}
        onSignIn={() => navigate({ to: "/signin" })}
      />
    );
  }

  if (context.loading || requested.isLoading) {
    return (
      <AuthShell eyebrow="Submission received" title="Confirming your submission" width="md">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Reading the submission back from the API…
        </div>
      </AuthShell>
    );
  }

  const submittedAt = application?.submitted_at
    ? new Date(application.submitted_at).toLocaleString()
    : "Just now";

  return (
    <SubmittedShell
      heading="Organisation application received"
      applicant={application?.organisation_profile?.name ?? organisation?.name ?? ""}
      // The application itself carries no human-readable reference; the
      // organisation's Beldium ID is the identifier the backend does issue.
      reference={organisation?.beldium_id ?? application?.id ?? "APP-PENDING"}
      status={application ? APPLICATION_STATUS_LABELS[application.status] : "Under review"}
      submitted={submittedAt}
      documentCount={application?.documents.length ?? 0}
      onSignIn={() => navigate({ to: "/signin" })}
    />
  );
}

function SubmittedShell({
  heading,
  applicant,
  reference,
  status,
  submitted,
  documentCount,
  onSignIn,
}: {
  heading: string;
  applicant: string;
  reference: string;
  status: string;
  submitted: string;
  documentCount: number;
  onSignIn: () => void;
}) {
  return (
    <AuthShell
      eyebrow="Submission received"
      title="Application submitted successfully"
      description="Your application has been received by the Beldium verification team. You can sign in at any time to track progress, respond to information requests and view review activity."
    >
      <div className="flex items-start gap-3 rounded-[20px] border border-success/50 bg-success/20 p-5">
        <CheckCircle2 className="mt-0.5 size-6" />
        <div>
          <p className="font-display text-sm font-semibold">{heading}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {applicant ? `${applicant}: ` : ""}we will contact you through the platform if anything
            further is required.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-1 rounded-[18px] border border-border p-5">
        <InfoRow
          label="Application reference"
          value={<span className="font-semibold">{reference}</span>}
        />
        <InfoRow
          label="Status"
          value={<span className="font-semibold uppercase tracking-wide">{status}</span>}
        />
        <InfoRow label="Submitted" value={submitted} />
        <InfoRow label="Documents attached" value={`${documentCount}`} />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Operational compliance functions stay locked until Beldium completes verification. After
        approval, your Beldium Compliance ID is issued and only your approved capabilities are
        activated.
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button size="lg" onClick={onSignIn}>
          Go to Sign In
        </Button>
      </div>
    </AuthShell>
  );
}
