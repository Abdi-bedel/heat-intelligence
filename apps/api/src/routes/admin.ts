import { Hono } from 'hono';
import type { RecomputeRequest, RecomputeResponse } from '@heat/contracts';
import { recomputeMetrics } from '../cron/recompute';
import { adminSupabase } from '../lib/supabase';

export const adminRouter = new Hono();

// Constant-time string comparison to defeat timing attacks.
// Always compares the same number of bytes regardless of input length.
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  // Pad the shorter one so the loop length leaks no info.
  const len = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

function isAdmin(req: Request): boolean {
  const expected = process.env.HEAT_ADMIN_TOKEN;
  if (!expected || expected.length < 32) {
    // Refuse to authenticate if the secret isn't a strong value.
    // Fail closed in production; warn loudly in dev.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[admin] HEAT_ADMIN_TOKEN missing or <32 chars — admin endpoints will refuse all requests.');
    }
    return false;
  }
  const provided = req.headers.get('x-admin-token') ?? '';
  return timingSafeEqual(provided, expected);
}

adminRouter.post('/jobs/recompute-metrics', async (c) => {
  if (!isAdmin(c.req.raw)) return c.json({ error: 'unauthorized' }, 401);

  const body = (await c.req.json().catch(() => ({}))) as RecomputeRequest;
  const result = await recomputeMetrics(body);
  const res: RecomputeResponse = {
    job_id: result.jobId,
    venues_queued: result.venuesQueued,
    estimated_completion_seconds: result.estimatedCompletionSeconds,
  };
  return c.json(res, 202);
});

/**
 * Claims review endpoints (now owned by heat-intelligence).
 * These mirror the previous direct actions that lived in heat-app's admin.
 * Protected by the same HEAT_ADMIN_TOKEN.
 *
 * For now the UI may still live in heat-app/admin, but the logic is here.
 */

// List recent claims (for the claims review page)
adminRouter.get('/claims', async (c) => {
  if (!isAdmin(c.req.raw)) return c.json({ error: 'unauthorized' }, 401);

  const url = new URL(c.req.url);
  const status = url.searchParams.get('status') || 'pending_review';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);

  const supabase = adminSupabase();
  const { data, error } = await supabase
    .from('hi_venue_claim_requests')
    .select('*')
    .eq('status', status === 'all' ? undefined : status)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return c.json({ error: 'failed to load claims' }, 500);
  return c.json({ claims: data ?? [] });
});

// Perform approve / needs_info / reject (similar transaction as the old bridge)
adminRouter.post('/claims/:id', async (c) => {
  if (!isAdmin(c.req.raw)) return c.json({ error: 'unauthorized' }, 401);

  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as {
    action?: 'approve' | 'needs_info' | 'reject';
    admin_notes?: string;
    reviewer?: string; // the admin identity (e.g. from heat-app admin)
  };

  const action = body.action;
  const adminNotes = body.admin_notes ?? null;
  const reviewer = body.reviewer ?? 'admin';

  if (!['approve', 'needs_info', 'reject'].includes(action || '')) {
    return c.json({ error: 'invalid action' }, 400);
  }

  const supabase = adminSupabase();

  try {
    // Minimal port of the old logic using service role
    const { data: claim } = await supabase
      .from('hi_venue_claim_requests')
      .select('id, venue_id, user_id, status, owner_email')
      .eq('id', id)
      .single();

    if (!claim) return c.json({ error: 'claim not found' }, 404);
    if (claim.status === 'approved' || claim.status === 'rejected') {
      return c.json({ error: `claim already ${claim.status}` }, 409);
    }

    if (action === 'approve') {
      const { data: venue } = await supabase
        .from('hi_venues')
        .select('id, claim_status')
        .eq('id', claim.venue_id)
        .single();

      if (!venue) return c.json({ error: 'venue not found' }, 404);
      if (venue.claim_status === 'claimed') {
        return c.json({ error: 'venue is already claimed' }, 409);
      }

      if (venue.claim_status !== 'claimed' && venue.claim_status !== 'verified') {
        await supabase
          .from('hi_venues')
          .update({ claim_status: 'claimed', updated_at: new Date().toISOString() })
          .eq('id', claim.venue_id);
      }

      await supabase.from('hi_venue_owner_venue_access').upsert(
        {
          user_id: claim.user_id,
          venue_id: claim.venue_id,
          claim_request_id: id,
          role: 'owner',
          access_status: 'active',
          granted_by: reviewer,
        },
        { onConflict: 'user_id,venue_id' },
      );

      await supabase
        .from('hi_venue_claim_requests')
        .update({
          status: 'approved',
          reviewed_by: reviewer,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    } else {
      const newStatus = action === 'reject' ? 'rejected' : 'needs_info';
      await supabase
        .from('hi_venue_claim_requests')
        .update({
          status: newStatus,
          reviewed_by: reviewer,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: 'claim action failed' }, 500);
  }
});
