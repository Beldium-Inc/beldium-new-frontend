import { apiFetch } from "@/lib/api/client";
import type { CompanyInfoValues, DocumentKey } from "@/lib/careers/logistics-schemas";

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
  }[];
}

type StatusResponse = { application_id: string; status: PartnerApplicationStatus };

/**
 * Submits a logistics partner registration application in three steps: open
 * the application, upload each document on its own request (up to fourteen
 * files of 10MB do not fit in one on a slow connection), then submit. Staff
 * are only notified, and the status tracker only sees it, after the last step.
 */
export async function submitPartnerApplication(
  payload: SubmitPartnerApplicationPayload,
): Promise<PartnerApplicationResult> {
  const draft = await apiFetch<{ application_id: string; upload_token: string }>(
    "/careers/partner-applications/",
    {
      method: "POST",
      body: { company: payload.company, agreements: payload.agreements },
      auth: false,
    },
  );
  const base = `/careers/partner-applications/${draft.application_id}`;

  for (const [key, file] of Object.entries(payload.documents)) {
    if (!file) continue;
    const body = new FormData();
    body.set("upload_token", draft.upload_token);
    body.set("key", key);
    body.set("file", file);
    await apiFetch(`${base}/documents/`, { method: "POST", body, auth: false });
  }

  const submitted = await apiFetch<StatusResponse>(`${base}/submit/`, {
    method: "POST",
    body: { upload_token: draft.upload_token },
    auth: false,
  });
  return { applicationId: submitted.application_id, status: submitted.status };
}

/**
 * Fetches the current status of a submitted application.
 */
export async function getPartnerApplicationStatus(
  applicationId: string,
): Promise<PartnerApplicationResult> {
  const data = await apiFetch<StatusResponse>(
    `/careers/partner-applications/${encodeURIComponent(applicationId)}/`,
    { auth: false },
  );
  return { applicationId: data.application_id, status: data.status };
}
