import { createFileRoute, Link } from "@tanstack/react-router";

import { ReviewTimeline } from "@/components/beldium/application-status";
import { PageHeader } from "@/components/beldium/shell";
import { StatusBadge } from "@/components/beldium/status-badge";
import { Button } from "@/components/ui/button";
import { useLogisticsApplication, useLogisticsDashboard } from "@/lib/api/logistics-queries";
import { isDemoMode } from "@/lib/data-mode";
import { useOperator } from "@/lib/onboarding-store";
import { useWorkspace } from "@/lib/workspace";

const title = "Submitted application - Beldium Logistics Hub";

export const Route = createFileRoute("/portal/application-record")({
  head: () => ({
    meta: [
      { title },
      {
        name: "description",
        content: "Read-only copy of your submitted logistics operator application.",
      },
    ],
  }),
  component: ApplicationRecordPage,
});

type Section = { title: string; rows: [string, string][] };

const text = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.map(text).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const label = (key: string) => key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function useDemoSections(): Section[] {
  const s = useOperator();
  const org = s.organisation;
  const cap = s.capability;
  return [
    {
      title: "Organisation",
      rows: org
        ? [
            ["Name", org.name],
            ["Registration number", org.registrationNumber],
            ["TIN", org.tin],
            ["Registered address", org.registeredAddress],
            ["State / LGA", `${org.state} / ${org.lga}`],
            ["Company email", org.email],
            ["Your role", org.requestedRole],
          ]
        : [],
    },
    {
      title: "Logistics capability",
      rows: cap
        ? [
            ["Services", cap.services.join(", ")],
            ["Operating states", cap.operatingStates],
            ["Vehicle categories", cap.vehicleCategories],
            ["Fleet size", cap.fleetSize],
            ["Max capacity (t)", cap.maxCapacity],
            [
              "Tracking / security / sample custody",
              `${cap.tracking} / ${cap.security} / ${cap.sampleCustody}`,
            ],
          ]
        : [],
    },
    {
      title: "Fleet",
      rows: s.vehicles.map((v) => [
        v.registration || v.id,
        `${v.type} · ${v.make} ${v.model} · ${v.capacity} t · ${v.reviewStatus}`,
      ]),
    },
    {
      title: "Drivers",
      rows: s.drivers.map((d) => [
        d.name || d.id,
        `Licence ${d.licenceNumber} (${d.licenceClass}) · expires ${d.expiryDate || "-"} · ${d.reviewStatus}`,
      ]),
    },
    {
      title: "Documents",
      rows: s.documents.map((d) => [d.type, `${d.related} · ${d.fileName} · ${d.status}`]),
    },
    { title: "Compliance answers", rows: Object.entries(s.compliance) },
  ];
}

function useApiSections(): Section[] {
  const dashboard = useLogisticsDashboard();
  const application = useLogisticsApplication(dashboard.data?.companies[0]?.application_id ?? null);
  return (application.data?.sections ?? [])
    .filter((section) => section.applicable)
    .map((section) => ({
      title: label(section.key),
      rows: Object.entries(section.data).map(([k, v]) => [label(k), text(v)] as [string, string]),
    }));
}

const useSubmittedSections = isDemoMode ? useDemoSections : useApiSections;

function ApplicationRecordPage() {
  const { record } = useWorkspace();
  const sections = useSubmittedSections();

  if (!record || record.stage === "draft") {
    return (
      <PageHeader
        title="No submitted application"
        description="Complete and submit your application to see it here."
        actions={
          <Button asChild>
            <Link to="/application">Go to application</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Submitted application"
        description={`${record.reference} · ${record.organisationName} · submitted ${record.submittedAt}`}
        actions={<StatusBadge value={record.statusLabel} />}
      />
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="rounded-md border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-card-foreground">{section.title}</h2>
              {section.rows.length ? (
                <dl className="mt-3 divide-y divide-border text-sm">
                  {section.rows.map(([k, v], i) => (
                    <div key={`${k}-${i}`} className="grid gap-1 py-2 sm:grid-cols-[200px_1fr]">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-foreground">{v || "-"}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Nothing submitted.</p>
              )}
            </div>
          ))}
        </div>
        <ReviewTimeline record={record} />
      </div>
    </>
  );
}
