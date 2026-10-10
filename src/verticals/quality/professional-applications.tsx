import * as React from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import {
  ApiError,
  openProfessionalDocument,
  useDecideQualityProfessionalApplication,
  useQualityProfessionalApplications,
  type QualityApplicationStatus,
  type QualityProfessionalApplication,
} from "@/lib/api";
import { EmptyState, Field, SectionTitle, StatusPill, Surface } from "./ui";

/**
 * Individuals (officers, inspectors) who applied to work under a Q&C
 * organisation. Operators decide them here; the organisation's own
 * administrator answers the membership request separately.
 */
export function ProfessionalApplications({ canDecide }: { canDecide: boolean }) {
  const applications = useQualityProfessionalApplications();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const rows = applications.data?.results ?? [];

  return (
    <Surface className="mt-6">
      <SectionTitle
        title="Professional applications"
        hint="Officers and inspectors applying to work under a Q&C organisation"
      />
      <div className="divide-y divide-border">
        {rows.length === 0 ? (
          <EmptyState
            title={applications.isPending ? "Loading…" : "No professional applications"}
            hint={applications.isError ? "The list could not be loaded." : undefined}
          />
        ) : (
          rows.map((row) => (
            <div key={row.id}>
              <button
                type="button"
                onClick={() => setOpenId(openId === row.id ? null : row.id)}
                className="grid w-full grid-cols-1 gap-2 px-6 py-4 text-left transition hover:bg-accent/50 lg:grid-cols-12 lg:items-center lg:gap-3"
              >
                <div className="lg:col-span-5">
                  <p className="font-display text-sm font-semibold text-navy">
                    {row.personal.full_legal_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.personal.job_title} · {row.organisation_name || "No organisation"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground lg:col-span-3">{row.reference}</p>
                <p className="text-xs text-muted-foreground lg:col-span-2">
                  {new Date(row.submitted_at).toLocaleDateString()}
                </p>
                <div className="lg:col-span-2 lg:text-right">
                  <StatusPill value={row.status} />
                </div>
              </button>
              {openId === row.id ? <Detail application={row} canDecide={canDecide} /> : null}
            </div>
          ))
        )}
      </div>
    </Surface>
  );
}

function Detail({
  application,
  canDecide,
}: {
  application: QualityProfessionalApplication;
  canDecide: boolean;
}) {
  const decide = useDecideQualityProfessionalApplication();
  const [note, setNote] = React.useState("");
  const final = application.status === "approved" || application.status === "rejected";

  const run = async (status: QualityApplicationStatus) => {
    try {
      await decide.mutateAsync({ id: application.id, status, note: note.trim() || undefined });
      toast.success(`Application ${status.replaceAll("_", " ")}.`);
      setNote("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "The decision could not be saved.");
    }
  };

  const lines = (items: string[]) =>
    items.length
      ? items.map((item) => (
          <span key={item} className="block">
            {item}
          </span>
        ))
      : "-";

  return (
    <div className="border-t border-border bg-accent/30 px-6 py-5">
      <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Email" value={application.applicant_email} />
        <Field label="Date of birth" value={application.personal.date_of_birth} />
        <Field label="National ID (NIN)" value={application.personal.national_id} />
        <Field label="Base city" value={application.personal.base_city || "-"} />
        <Field label="Capabilities" value={application.capability.capabilities.join(", ")} />
        <Field label="Minerals / materials" value={application.capability.minerals.join(", ")} />
        <Field label="Years of experience" value={application.experience.years_experience} />
        <Field label="Previous employer" value={application.experience.previous_employer || "-"} />
        <Field label="Experience summary" value={application.experience.summary} />
        <Field
          label="Qualifications"
          value={lines(
            application.qualifications.map((q) =>
              [q.qualification, q.institution, q.year].filter(Boolean).join(" · "),
            ),
          )}
        />
        <Field
          label="Certifications"
          value={lines(
            application.certifications.map((c) =>
              [c.name, c.certificate_number, c.expiry && `expires ${c.expiry}`]
                .filter(Boolean)
                .join(" · "),
            ),
          )}
        />
        <Field label="Signed by" value={application.declaration.signature} />
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        {application.documents.map((document) => (
          <button
            key={document.id}
            type="button"
            onClick={() =>
              openProfessionalDocument(application.id, document.id).catch((error: Error) =>
                toast.error(error.message),
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-navy hover:border-link hover:text-link"
          >
            <FileText className="size-3.5" /> {document.title}
          </button>
        ))}
      </div>

      {application.decision_note ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Decision note: {application.decision_note}
        </p>
      ) : null}

      {canDecide && !final ? (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note to the applicant (optional)"
            className="min-w-64 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-link"
          />
          {(
            [
              ["approved", "Approve"],
              ["info_requested", "Request information"],
              ["rejected", "Reject"],
            ] as const
          ).map(([status, label]) => (
            <button
              key={status}
              type="button"
              disabled={decide.isPending}
              onClick={() => void run(status)}
              className={
                status === "approved"
                  ? "rounded-xl bg-navy px-3 py-2 text-xs font-semibold text-navy-foreground disabled:opacity-60"
                  : "rounded-xl border border-border px-3 py-2 text-xs font-medium text-navy hover:border-link hover:text-link disabled:opacity-60"
              }
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
