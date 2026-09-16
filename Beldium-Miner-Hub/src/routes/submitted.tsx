import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { useMiner } from "@/lib/miner-store";

const title = "Application submitted — Beldium Miner Hub";
const description = "Your mining organisation application has been submitted for verification. Sign in to track review progress.";

export const Route = createFileRoute("/submitted")({
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
  const { state } = useMiner();
  const app = state.application;
  const reference = `BMH-${app.org.registrationNo?.slice(-4) || "0001"}-${app.sites.length}${app.equipment.length}`;

  return (
    <AuthLayout
      title="Application submitted"
      subtitle="Your organisation is now queued for verification by the Beldium review team."
      footer={
        <span>
          Need to add something? You can respond to reviewer information requests from your dashboard.
        </span>
      }
    >
      <div className="space-y-5">
        <div className="rounded-md border border-success/30 bg-success/10 p-5">
          <div className="flex items-center gap-2 font-medium text-success">
            <CheckCircle2 className="h-4 w-4" /> Received
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Reference <span className="font-medium text-foreground">{reference}</span> · signed by{" "}
            {app.declaration.signatory || "authorised signatory"} on {app.declaration.signedOn || "today"}.
          </p>
        </div>

        <div className="rounded-md border border-border bg-card p-5 text-sm">
          <div className="font-medium text-card-foreground">What happens next</div>
          <ol className="mt-3 space-y-2 text-muted-foreground">
            <li>1. Completeness check on your documents and declared data.</li>
            <li>2. Technical review of licences, sites and equipment.</li>
            <li>3. Site verification, then a decision.</li>
          </ol>
          <p className="mt-3 text-muted-foreground">
            Sign in at any time to follow the review timeline and answer information requests.
          </p>
        </div>

        <Button asChild className="w-full">
          <Link to="/auth">Continue to sign in</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
