import type { CompanyInfoValues, DocumentKey } from "@/lib/careers/logistics-schemas";
import {
  generateApplicationId,
  OPTIONAL_DOCUMENTS,
  REQUIRED_DOCUMENTS,
} from "@/lib/careers/logistics-schemas";
import { PARTNER_DOCUMENTS_BUCKET, supabase } from "@/lib/careers/supabase";

const DOCUMENT_LABELS: Record<DocumentKey, string> = Object.fromEntries(
  [...REQUIRED_DOCUMENTS, ...OPTIONAL_DOCUMENTS].map((doc) => [doc.key, doc.label]),
) as Record<DocumentKey, string>;

export type PartnerApplicationStatus =
  "submitted" | "under_review" | "info_requested" | "approved" | "dashboard_active";

export interface PartnerApplicationResult {
  applicationId: string;
  status: PartnerApplicationStatus;
}

export interface SubmitPartnerApplicationPayload {
  company: CompanyInfoValues;
  documents: Partial<Record<DocumentKey, File>>;
  agreements: {
    key: string;
    signedName: string;
    signedAt: string;
  }[];
}

/**
 * Submits a logistics partner registration application: uploads each document
 * to the private `partner-documents` storage bucket, then inserts the
 * application row into `logistics_partner_applications`.
 */
export async function submitPartnerApplication(
  payload: SubmitPartnerApplicationPayload,
): Promise<PartnerApplicationResult> {
  const applicationId = generateApplicationId();

  const documentPaths: Partial<Record<DocumentKey, string>> = {};
  for (const [key, file] of Object.entries(payload.documents)) {
    if (!file) continue;
    const path = `${applicationId}/${key}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from(PARTNER_DOCUMENTS_BUCKET)
      .upload(path, file, { upsert: false });
    if (uploadError) throw uploadError;
    documentPaths[key as DocumentKey] = path;
  }

  const { error } = await supabase.from("logistics_partner_applications").insert({
    application_id: applicationId,
    status: "submitted",
    company: payload.company,
    document_paths: documentPaths,
    agreements: payload.agreements,
  });
  if (error) throw error;

  const documents = Object.entries(documentPaths).map(([key, path]) => ({
    label: DOCUMENT_LABELS[key as DocumentKey] ?? key,
    bucket: PARTNER_DOCUMENTS_BUCKET,
    path: path as string,
  }));

  supabase.functions
    .invoke("bright-api", {
      body: {
        kind: "partner-application",
        referenceId: applicationId,
        answers: {
          "Company name": payload.company.companyName,
          "RC number": payload.company.rcNumber,
          Email: payload.company.companyEmail,
          Phone: payload.company.phoneNumber,
          "Business address": payload.company.businessAddress,
          "Contact person": payload.company.contactPerson,
          "Agreements signed": payload.agreements
            .map((a) => `${a.key} (${a.signedName}, ${a.signedAt})`)
            .join("; "),
        },
        documents,
      },
    })
    .catch((err) => console.error("bright-api notify failed", err));

  return { applicationId, status: "submitted" };
}

/**
 * Fetches the current status of a submitted application.
 */
export async function getPartnerApplicationStatus(
  applicationId: string,
): Promise<PartnerApplicationResult> {
  const { data, error } = await supabase
    .from("logistics_partner_applications")
    .select("application_id, status")
    .eq("application_id", applicationId)
    .single();
  if (error) throw error;
  return { applicationId: data.application_id, status: data.status as PartnerApplicationStatus };
}
