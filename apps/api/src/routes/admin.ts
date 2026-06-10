import { Hono } from 'hono';
import type { RecomputeRequest, RecomputeResponse } from '@heat/contracts';
import { recomputeMetrics } from '../cron/recompute';

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
