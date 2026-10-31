import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { ContinueApplicationBanner } from "@/components/setup-banner";
import { ApiError } from "@/lib/api";
import {
  useCreateApplication,
  useLogisticsApplications,
  useLogisticsCompanies,
  useLogisticsDocuments,
  useUploadLogisticsApplicationDocument,
} from "@/lib/api/logistics-queries";
import { logisticsDocumentCatalogue } from "@/lib/onboarding/logistics";
import { Panel, Pill } from "./bits";
import { useApp } from "./store";

const STATUS_LABEL = {
  pending: "Under review",
  verified: "Verified",
  rejected: "Rejected",
} as const;
const STATUS_TONE = { pending: "info", verified: "success", rejected: "danger" } as const;

/** The signed-in company's application and where each checklist document stands. */
export function usePartnerChecklist() {
  const { myCompany } = useApp();
  const companies = useLogisticsCompanies();
  const applications = useLogisticsApplications();
  const documents = useLogisticsDocuments();

  const companyId = companies.data?.results.find((c) => c.reference === myCompany?.id)?.id ?? null;
  const application = applications.data?.results.find((a) => a.company === companyId) ?? null;
  const current = (documents.data?.results ?? []).filter(
    (d) => d.application === application?.id && d.is_current,
  );
  const rows = logisticsDocumentCatalogue.map((item) => ({
    ...item,
    document: current.find((d) => d.document_type === item.type) ?? null,
  }));
  const missing = rows.filter(
    (r) => r.required && (!r.document || r.document.status === "rejected"),
  );

  return {
    companyId,
    application,
    rows,
    missing,
    loading: companies.isLoading || applications.isLoading || documents.isLoading,
  };
}

/** Top of the partner workspace while a required document is still missing. */
export function PartnerApplicationBanner() {
  const { missing, loading, companyId } = usePartnerChecklist();
  const onDocuments = useRouterState({
    select: (state) => state.location.pathname === "/logistics/partner/documents",
  });
  if (onDocuments || loading || !companyId || missing.length === 0) return null;
  return (
    <ContinueApplicationBanner
      title={`${missing.length} required ${missing.length === 1 ? "document is" : "documents are"} still needed`}
      body="The Logistics document requirements have changed. Upload what's missing to complete your application."
    >
      <Link to="/logistics/partner/documents">
        Continue application <ArrowRight className="size-4" />
      </Link>
    </ContinueApplicationBanner>
  );
}

export function RequiredDocumentsPanel() {
  const { companyId, application, rows, missing } = usePartnerChecklist();
  const createApplication = useCreateApplication();
  const upload = useUploadLogisticsApplicationDocument();
  const [uploading, setUploading] = React.useState<string | null>(null);

  const onFile = async (row: (typeof rows)[number], file: File) => {
    if (!companyId) return;
    setUploading(row.type);
    try {
      const id =
        application?.id ?? (await createApplication.mutateAsync({ company: companyId })).id;
      await upload.mutateAsync({
        id,
        domain: row.domain,
        document_type: row.type,
        title: row.title,
        file,
      });
      toast.success(`${row.title} uploaded.`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "That file could not be uploaded.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <Panel
      className="mb-4"
      title="Required documents"
      description={
        missing.length
          ? `${missing.length} required still needed. Upload the optional ones if they apply to you.`
          : "All required documents supplied. Upload the optional ones if they apply to you."
      }
      bodyClassName="p-0"
    >
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li
            key={row.type}
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--brand)]">{row.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {row.required ? "Required" : "Optional"}
                {row.appliesWhen ? ` · ${row.appliesWhen}` : ""}
                {row.document ? ` · ${row.document.original_name}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {row.document ? (
                <Pill tone={STATUS_TONE[row.document.status]}>
                  {STATUS_LABEL[row.document.status]}
                </Pill>
              ) : null}
              {row.document?.status === "verified" ? null : (
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-[var(--brand)] hover:border-[var(--link)]/60">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    disabled={uploading !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void onFile(row, file);
                    }}
                  />
                  {uploading === row.type ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3" />
                  )}
                  {row.document ? "Replace" : "Upload"}
                </label>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
