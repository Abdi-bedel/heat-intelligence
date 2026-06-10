import type { LiveCountsResponse } from '@heat/contracts';
import { liveCounts_ready } from '@heat/contracts/fixtures';
import { captureError } from './observability';

// Edge-cached proxy for /v1/public/live-counts.
//
// Calls heat-app's `/b2b/v1/live-counts` (B2BLiveCountsResponse) — in the
// shape the heat-intelligence marketing site expects — and caches in memory
// for 30s. If the consumer endpoint is unreachable or returns 503/pre_launch,
// we serve the last known good payload. If we've never had a good payload,
// we fall back to the fixture so the marketing page still renders.

type CacheEntry = { value: LiveCountsResponse; fetchedAt: number };
let cache: CacheEntry | null = null;
const TTL_MS = 30_000;

const HEAT_APP_BASE = () => process.env.HEAT_APP_API_BASE_URL;
const TOKEN = () => process.env.HEAT_APP_B2B_TOKEN;
const CLIENT_NAME = () => process.env.HEAT_APP_B2B_CLIENT_NAME ?? 'heat-intelligence';

type B2BLiveCountsResponse = {
  total_users: number;
  city: 'Barcelona';
  neighbourhoods: Array<{
    name: string;
    tier: 'hot' | 'warming' | 'ambient';
    users_now: number;
    sparkline_15min: number[];
  }>;
  generated_at: string;
};

async function fetchUpstream(): Promise<LiveCountsResponse | null> {
  const base = HEAT_APP_BASE();
  const token = TOKEN();
  if (!base || !token) return null;

  try {
    const res = await fetch(`${base}/b2b/v1/live-counts`, {
      headers: {
        authorization: `Bearer ${token}`,
        'x-heat-b2b-client': CLIENT_NAME(),
      },
      // Bun supports the standard fetch options here; abort after 3s so we
      // don't hold the request thread on a slow upstream.
      signal: AbortSignal.timeout(3000),
    });

    if (res.status === 503) {
      // pre_launch — let caller decide what to render
      return null;
    }
    if (!res.ok) {
      await captureError(new Error(`live-counts upstream ${res.status}`));
      return null;
    }
    const body = (await res.json()) as B2BLiveCountsResponse;
    return body satisfies LiveCountsResponse;
  } catch (err) {
    await captureError(err, { source: 'live-counts upstream' });
    return null;
  }
}

export async function getLiveCounts(): Promise<{
  value: LiveCountsResponse;
  source: 'fresh' | 'cache' | 'fallback';
}> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < TTL_MS) {
    return { value: cache.value, source: 'cache' };
  }

  const fresh = await fetchUpstream();
  if (fresh) {
    cache = { value: fresh, fetchedAt: now };
    return { value: fresh, source: 'fresh' };
  }

  // Upstream unreachable / pre-launch / not configured.
  // Prefer last known good over the fixture.
  if (cache) return { value: cache.value, source: 'cache' };
  return { value: liveCounts_ready, source: 'fallback' };
}
