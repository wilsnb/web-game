import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for TRUSTED server-to-server writes only
 * (e.g. the Midtrans webhook, which has no user session).
 *
 * The service-role key bypasses Row Level Security, so this must NEVER be
 * imported into client code or any route that echoes data back to untrusted
 * callers. Keep SUPABASE_SERVICE_ROLE_KEY out of NEXT_PUBLIC_ and out of git.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL for admin client."
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
