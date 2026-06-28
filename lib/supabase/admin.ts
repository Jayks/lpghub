import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Use a module-level variable to avoid HMR connection exhaustion in dev.
// (globalThis typing with generic Supabase types is awkward — module scope is simpler.)
let _adminClient: SupabaseClient | undefined;

/**
 * Service-role Supabase client — SERVER ONLY.
 * Has full DB + Auth admin access. Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;

  _adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  return _adminClient;
}
