import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { Pathway } from "@/lib/careers/application-schemas";

// The careers forms are public: every call here goes out without a bearer token.

export interface SubmitApplicationPayload {
  pathway: Pathway;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  linkedin: string;
  portfolio?: string | undefined;
  /** The pathway-specific questions, stored as submitted. */
  answers: Record<string, unknown>;
  resume: File;
  headshot?: File | null | undefined;
  companyProfile?: File | null | undefined;
}

/**
 * Submits an internship, volunteer or partnership application in one multipart
 * request. The API stores the files, emails the careers inbox and returns the
 * reference the applicant is shown.
 */
export async function submitApplication(payload: SubmitApplicationPayload): Promise<string> {
  const body = new FormData();
  body.set("pathway", payload.pathway);
  body.set("full_name", payload.fullName);
  body.set("email", payload.email);
  body.set("phone", payload.phone);
  body.set("country", payload.country);
  body.set("state", payload.state);
  body.set("city", payload.city);
  body.set("linkedin", payload.linkedin);
  if (payload.portfolio) body.set("portfolio", payload.portfolio);
  body.set("answers", JSON.stringify(payload.answers));
  body.set("resume", payload.resume);
  if (payload.headshot) body.set("headshot", payload.headshot);
  if (payload.companyProfile) body.set("company_profile", payload.companyProfile);

  const created = await apiFetch<{ reference_id: string }>("/careers/applications/", {
    method: "POST",
    body,
    auth: false,
  });
  return created.reference_id;
}

/** What to tell an applicant when a submission fails. */
export function submissionErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;
  if (err.status === 429) return "Too many attempts. Please wait a while and try again.";
  if (err.isNetworkError)
    return "We couldn't reach our servers. Check your connection and try again.";
  // 4xx messages are written by the API to be shown (e.g. a rejected file).
  return err.status >= 400 && err.status < 500 ? err.message : fallback;
}
