// Supabase Edge Function: sends a notification email to the support inbox whenever
// a new job/pathway application or logistics partner application comes in.
// Includes the full set of submitted answers and a signed link for every uploaded
// document (buckets are private, so plain paths aren't browsable without a signed URL).
//
// Secrets required (set in Project Settings -> Edge Functions -> Secrets):
//   RESEND_API_KEY  - Resend API key
//   NOTIFY_EMAIL    - inbox to notify (e.g. support@beldium.com)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-provided by the Supabase runtime.

import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_EMAIL = Deno.env.get("NOTIFY_EMAIL") ?? "support@beldium.com";
const FROM_EMAIL = Deno.env.get("NOTIFY_FROM_EMAIL") ?? "Beldium Applications <applications@beldium.com>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface DocumentRef {
  label: string;
  bucket: string;
  path: string;
}

interface RequestPayload {
  kind: "application" | "partner-application";
  referenceId: string;
  answers: Record<string, unknown>;
  documents?: DocumentRef[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500,
      headers: { "content-type": "application/json", ...CORS_HEADERS },
    });
  }

  let payload: RequestPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json", ...CORS_HEADERS },
    });
  }

  const { kind, referenceId, answers, documents = [] } = payload;
  if (!referenceId || !answers) {
    return new Response(JSON.stringify({ error: "Missing referenceId or answers" }), {
      status: 400,
      headers: { "content-type": "application/json", ...CORS_HEADERS },
    });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const signedDocuments = await Promise.all(
    documents.map(async (doc) => {
      const { data, error } = await supabaseAdmin.storage
        .from(doc.bucket)
        .createSignedUrl(doc.path, SIGNED_URL_TTL_SECONDS);
      return { label: doc.label, url: error ? null : data?.signedUrl ?? null, error: error?.message };
    }),
  );

  const subject =
    kind === "partner-application"
      ? `New logistics partner application: ${referenceId}`
      : `New application: ${referenceId}`;

  const answerRows = Object.entries(answers)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(
      ([key, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top;white-space:nowrap;">${escapeHtml(
          humanize(key),
        )}</td><td style="padding:6px 0;">${escapeHtml(String(value)).replace(/\n/g, "<br/>")}</td></tr>`,
    )
    .join("");

  const documentRows = signedDocuments
    .map((doc) =>
      doc.url
        ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b;">${escapeHtml(doc.label)}</td><td style="padding:6px 0;"><a href="${doc.url}">Download</a> (link expires in 7 days)</td></tr>`
        : `<tr><td style="padding:6px 12px 6px 0;color:#64748b;">${escapeHtml(doc.label)}</td><td style="padding:6px 0;color:#b91c1c;">Could not generate link${doc.error ? `: ${escapeHtml(doc.error)}` : ""}</td></tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:640px;margin:0 auto;">
      <h2 style="color:#0f172a;">${escapeHtml(subject)}</h2>
      <table style="border-collapse:collapse;width:100%;">${answerRows}</table>
      ${
        documentRows
          ? `<h3 style="color:#0f172a;margin-top:24px;">Documents</h3>
             <table style="border-collapse:collapse;width:100%;">${documentRows}</table>`
          : ""
      }
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [NOTIFY_EMAIL],
      subject,
      html,
    }),
  });

  const resendBody = await res.text();
  if (!res.ok) {
    return new Response(JSON.stringify({ error: "Failed to send email", details: resendBody }), {
      status: 502,
      headers: { "content-type": "application/json", ...CORS_HEADERS },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
  });
});

function humanize(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
