import { isSupabaseConfigured } from "@/lib/careers/supabase";

/** Shown above the careers forms when the build has no Supabase configuration. */
export function ApplicationsUnavailable() {
  if (isSupabaseConfigured) return null;
  return (
    <div
      role="status"
      className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
    >
      Applications are temporarily unavailable. You can read the form, but it can't be submitted
      right now. Please check back later.
    </div>
  );
}
