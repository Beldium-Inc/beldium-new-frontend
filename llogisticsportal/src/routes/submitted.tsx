import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/workspace";

const title = "Application submitted - Beldium Logistics Hub";
const description = "Your logistics operator application has been submitted for verification.";

export const Route = createFileRoute("/submitted")({
  ssr: false,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Submitted,
});

function Submitted() {
  const { record } = useWorkspace();

  return (
    <AuthLayout
      title="Application submitted"
      subtitle="Your organisation is now queued for verification by Beldium Logistics Compliance."
      footer={
        <span>
          Need to add something? You can respond to information requests from your workspace.
        </span>
      }
    >
      <div className="space-y-5">
        <div className="rounded-md border border-success/30 bg-success/10 p-5">
          <div className="flex items-center gap-2 font-medium text-success">
            <CheckCircle2 className="h-4 w-4" /> Received
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {record ? (
              <>
                Reference <span className="font-medium text-foreground">{record.reference}</span> ·{" "}
                {record.organisationName}
                {record.organisationRef !== "-" ? ` (${record.organisationRef})` : ""}.
              </>
            ) : (
              "Your application reference will appear in your workspace."
            )}
          </p>
        </div>

        <div className="rounded-md border border-border bg-card p-5 text-sm">
          <div className="font-medium text-card-foreground">What happens next</div>
          <ol className="mt-3 space-y-2 text-muted-foreground">
            <li>1. Completeness check on your organisation record and documents.</li>
            <li>2. Fleet and driver credential review.</li>
            <li>3. Compliance and safety review, then a decision.</li>
          </ol>
          <p className="mt-3 text-muted-foreground">
            Follow the review timeline and answer information requests from your workspace.
          </p>
        </div>

        <Button asChild className="w-full">
          <Link to="/portal">Continue to your workspace</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
