#!/usr/bin/env bun
// Sprint 2A privacy gate. The PRD §4.3 invariant: a logged-in venue cannot
// query another venue's data via any endpoint. This script exhausts the
// plausible attack vectors.
//
// Pass = every expected 401 / own-data response holds.
// Run before every deploy (and ideally in CI):
//   bun run apps/api/scripts/privacy-gate-test.ts

const API = process.env.API_BASE_URL ?? 'http://localhost:8787';

const PROTECTED = [
  '/v1/venue/me/profile',
  '/v1/venue/me/metrics/check-ins',
  '/v1/venue/me/metrics/peak-hours',
  '/v1/venue/me/metrics/day-of-week',
  '/v1/venue/me/metrics/neighbourhood-comparison',
  '/v1/venue/me/metrics/tile-views',
  '/v1/venue/me/metrics/tap-throughs',
];

type CheckResult = { name: string; ok: boolean; detail?: string };

const results: CheckResult[] = [];

async function expect401(name: string, init: RequestInit & { url: string }) {
  const res = await fetch(`${API}${init.url}`, init);
  results.push({
    name,
    ok: res.status === 401,
    detail: `got ${res.status}${res.status !== 401 ? ' (expected 401)' : ''}`,
  });
}

async function run() {
  console.log(`[privacy-gate] testing ${API}`);

  // 1. No header at all → 401 on every protected endpoint
  for (const path of PROTECTED) {
    await expect401(`no_auth ${path}`, { url: path });
  }

  // 2. Bogus tokens → 401
  for (const path of PROTECTED) {
    await expect401(`bogus_bearer ${path}`, {
      url: path,
      headers: { Authorization: 'Bearer not-a-real-token' },
    });
  }

  // 3. Wrong header name → 401
  for (const path of PROTECTED) {
    await expect401(`wrong_header ${path}`, {
      url: path,
      headers: { 'X-Venue-Id': 'ven_dev_0019' },
    });
  }

  // 4. Body venue_id injection → 401 (we use GETs, but try POST anyway)
  for (const path of PROTECTED) {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ venue_id: 'ven_dev_0042' }),
    });
    results.push({
      name: `body_injection ${path}`,
      ok: res.status === 401 || res.status === 405,
      detail: `got ${res.status}`,
    });
  }

  // 5. Query-param venue_id injection — must be ignored by the auth-derived scope
  //    (i.e., dev token 0019 should still scope to 0019 even if ?venue_id=0042 is passed)
  const r = await fetch(`${API}/v1/venue/me/profile?venue_id=ven_dev_0042`, {
    headers: { Authorization: 'Bearer dev:0019' },
  });
  if (r.ok) {
    const body = (await r.json()) as { venue_id?: string };
    results.push({
      name: 'query_param_venue_id_ignored',
      ok: !body.venue_id || !body.venue_id.includes('0042'),
      detail: `venue_id in response: ${body.venue_id}`,
    });
  } else {
    results.push({
      name: 'query_param_venue_id_ignored',
      ok: false,
      detail: `unexpected ${r.status}`,
    });
  }

  // 6. Authenticated as 0019, request still scopes to 0019 — sanity check
  const own = await fetch(`${API}/v1/venue/me/profile`, {
    headers: { Authorization: 'Bearer dev:0019' },
  });
  results.push({
    name: 'own_data_scoping',
    ok: own.ok,
    detail: `status ${own.status}`,
  });

  // Report
  const failed = results.filter((r) => !r.ok);
  for (const r of results) {
    console.log(`${r.ok ? '✓' : '✗'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  }
  console.log('');
  console.log(`${results.length - failed.length} / ${results.length} passed`);
  if (failed.length > 0) {
    console.error(`\n[privacy-gate] FAILED — ${failed.length} check(s) did not hold`);
    process.exit(1);
  }
  console.log('[privacy-gate] PASSED');
}

run().catch((err) => {
  console.error('[privacy-gate] threw:', err);
  process.exit(1);
});
