import { createClient } from '@supabase/supabase-js';

// Service-role client — full DB access, never exposed to clients.
// Used for: admin venue creation, RLS-bypassing reads inside trusted server code,
// and the cron's writes to venue_metrics.

let cached: ReturnType<typeof createClient> | null = null;

export function adminSupabase() {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Set them in apps/api/.env.'
    );
  }
  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
