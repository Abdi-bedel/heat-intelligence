import type { Founding50StatusResponse } from '@heat/contracts';
import { Hono } from 'hono';
import { adminSupabase } from '../lib/supabase';
import { captureError } from '../lib/observability';
import { getLiveCounts } from '../lib/live-counts';

export const publicRouter = new Hono();

// Live counts — proxies to heat-app's /b2b/v1/live-counts with 30s cache.
// Falls back to last-known-good then to a fixture if the upstream is down.
publicRouter.get('/live-counts', async (c) => {
  const { value, source } = await getLiveCounts();
  c.header('Cache-Control', 'public, max-age=30, s-maxage=30');
  c.header('X-Live-Counts-Source', source);
  return c.json(value);
});

// Founding 50 status — read from our own `venues` table. The Founding 50 is
// just a tagged subscription on the €49/yr price ID; there is no coupon. The
// "claimed" count is the number of venues with `status = 'verified_founding_50'`.
// 5min cache is plenty — counter changes ~once per sale.
const FOUNDING_50_CAP = 50 as const;
let foundingCache: { value: Founding50StatusResponse; fetchedAt: number } | null = null;
const FOUNDING_TTL_MS = 5 * 60 * 1000;

publicRouter.get('/founding-50-status', async (c) => {
  c.header('Cache-Control', 'public, max-age=300, s-maxage=300');

  if (foundingCache && Date.now() - foundingCache.fetchedAt < FOUNDING_TTL_MS) {
    return c.json(foundingCache.value);
  }

  try {
    const { count, error } = await adminSupabase()
      .from('venues')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'verified_founding_50');

    if (error) throw error;

    const claimed = count ?? 0;
    const remaining = Math.max(0, FOUNDING_50_CAP - claimed);
    const value: Founding50StatusResponse = {
      cap: FOUNDING_50_CAP,
      claimed,
      remaining,
      // closed_at is left null until the founders manually mark it; we don't
      // try to infer it from the count crossing 50 because someone might be
      // reverted (refund, fraud, etc.) and we want the date stable.
      closed_at: null,
    };
    foundingCache = { value, fetchedAt: Date.now() };
    return c.json(value);
  } catch (err) {
    await captureError(err, { route: '/v1/public/founding-50-status' });
    if (foundingCache) return c.json(foundingCache.value);
    // First-load failure with no cache — degrade to a sensible static value
    // (cap + the marketing copy's current claim of 19) rather than 500.
    return c.json({ cap: FOUNDING_50_CAP, claimed: 19, remaining: 31, closed_at: null });
  }
});
