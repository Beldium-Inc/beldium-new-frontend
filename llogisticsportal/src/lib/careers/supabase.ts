import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** False when the build was made without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("Applications are temporarily unavailable. Please try again later.");
    this.name = "SupabaseNotConfiguredError";
  }
}

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  // createClient throws on an empty URL, so it must not run at import time:
  // that took the whole /careers section down when the env vars were missing.
  if (!supabaseUrl || !supabaseAnonKey) throw new SupabaseNotConfiguredError();
  return (client ??= createClient(supabaseUrl, supabaseAnonKey));
}

/** Created on first use, so a missing configuration only fails the submit, not the page. */
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => Reflect.get(getClient(), prop),
});

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.",
  );
}

export const APPLICATION_DOCUMENTS_BUCKET = "application-documents";
export const PARTNER_DOCUMENTS_BUCKET = "partner-documents";
