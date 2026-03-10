import { createClient } from "@supabase/supabase-js";

// Service role client — ONLY use in server-side code (API routes, webhooks)
// Never import this in any file that could be bundled client-side
export function getSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
