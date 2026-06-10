# Heat Intelligence — Venue API Contract v1

*Source of truth for the Verified Login Portal API. Frontend (`venues.getheatapp.com`) and backend (Hono on Fly.io) both build against this. Mocked fixtures in [contracts/fixtures.ts](contracts/fixtures.ts) let the frontend start before the backend is ready.*

*Version: 1.0 — derived from PRD §4. Last updated 2026-05-06.*

---

## 1. Conventions

### 1.1 Base URL

```
Production:  https://api.getheatapp.com/v1
Staging:     https://api-staging.getheatapp.com/v1
Local:       http://localhost:8787/v1
```

### 1.2 Authentication

Every venue endpoint requires a session token in the `Authorization` header:

```
Authorization: Bearer <jwt>
```

The venue ID is **derived from the token only**. It is never accepted as a query/path parameter, body field, or header. This is a hard privacy invariant (PRD §4.3).

### 1.3 Response envelope

Every metric endpoint returns one of two shapes — a discriminated union on `status`:

```ts
type MetricResponse<T> =
  | { status: 'ready'; data: T; computed_at: string /* ISO8601 */ }
  | { status: 'pending'; reason: PendingReason; computed_at: string };
```

**`status: 'ready'`** — data is valid for display.
**`status: 'pending'`** — empty state should render. The `reason` object tells the frontend exactly what copy + progress indicator to show. Per PRD §3.7, the empty state must explain *why*, *where the venue is in the journey*, and *what unlocks*.

The contract NEVER returns 404 for missing data — that would leak information about what data exists (PRD §4.4). Always 200 with `status: 'pending'`.

### 1.4 Pending reasons

```ts
type PendingReason =
  | {
      kind: 'first_week_in_progress';
      checkins_so_far: number;
      estimated_unlock_at: ISODate;        // next Monday after the venue's first full week
    }
  | {
      kind: 'insufficient_pattern_weeks';
      weeks_complete: number;
      weeks_required: 4;
      estimated_unlock_at: ISODate;        // Monday after the 4th complete week
    }
  | {
      kind: 'neighbourhood_density_below_threshold';
      qualifying_venues: number;
      venues_required: 10;
      checkins_per_venue_required: 20;
      estimated_unlock_at: null;           // depends on other venues onboarding
    }
  | { kind: 'no_data'; estimated_unlock_at: null };
```

Frontend maps each `kind` to the empty-state copy from the design spec ("Unlocks ~ May 11", "Week 1 of 4", etc.). **Copy lives in the frontend**, not the backend — the backend only ships facts. The `estimated_unlock_at` is the date the FE renders next to the progress bar; backend computes it server-side based on the venue's `pilot_started_at`.

### 1.5 Time semantics

- All weeks are **Mon 00:00 → Sun 23:59 Europe/Madrid**.
- A "week identifier" is the Monday's date in ISO `YYYY-MM-DD`.
- "Trailing complete week" = the most recent fully-elapsed week.
- "Current week" alias = trailing complete week.
- All `computed_at` timestamps are ISO8601 UTC.

### 1.6 Error responses

| Status | Body | When |
|---|---|---|
| 401 | `{ "error": "unauthorized" }` | Missing/invalid/expired token. No detail leakage. |
| 429 | `{ "error": "rate_limited", "retry_after_seconds": number }` | >60 req/min on this session |
| 500 | `{ "error": "internal_error" }` | Anything else. Detail logged server-side only. |

Note: missing data is **never** 404. See §1.3.

---

## 2. Endpoints

### 2.1 `GET /v1/venue/me/profile`

Returns the authenticated venue's public profile fields. Drives the dashboard header (PRD §3.6).

**Response 200:**

```ts
type ProfileResponse = {
  venue_id: string;                          // opaque, for client-side keys only
  display_short_id: string;                  // 4-digit padded, e.g. "0019" — footer label
  name: string;                              // e.g. "Bar Marsella"
  neighbourhood: string;                     // e.g. "El Born"
  city: string;                              // e.g. "Barcelona"
  category: string;                          // e.g. "bar" — taxonomy controlled server-side
  status: 'verified_founding_50' | 'verified';
  verified_since: ISODate;
  pilot_started_at: ISODate;                 // drives "Day N of pilot" / "Week N of pilot" client-side
  founding_50_number: number | null;         // null for non-Founding-50 venues
  user_email: string;                        // for the topbar avatar/email display
};
```

This endpoint is not threshold-gated. It always returns 200 with data for an authenticated venue.

---

### 2.2 `GET /v1/venue/me/metrics/check-ins?week=current`

PRD §3.4 D1. Single number + week-over-week comparison.

**Query params:**

| Name | Type | Default | Notes |
|---|---|---|---|
| `week` | `'current'` \| ISO date | `current` | Monday ISO date of the week to fetch |

**Response 200:**

```ts
type CheckInsData = {
  week_start: ISODate;            // Monday
  count: number;                  // actual integer, never rounded
  previous_week: {
    week_start: ISODate;
    count: number;
  } | null;                       // null in venue's first week
  delta_pct: number | null;       // null if previous_week is null. Negative shown as-is.
  history: Array<{                // trailing 8 complete weeks for the Month-3 trend chart
    week_start: ISODate;
    count: number;
  }>;                             // empty array before any complete weeks exist
};

type CheckInsResponse = MetricResponse<CheckInsData>;
```

`history` powers the 8-week area chart in the Month 3 wireframe. Length grows from 0 → 8 as the venue accumulates weeks. FE renders the chart only when `history.length >= 2`.

**Pending cases:**
- `first_week_in_progress` when the venue hasn't completed its first full week yet. `checkins_so_far` is the live count.

**Acceptance:**
- Updates within 24h of each new check-in (cron-driven).
- `delta_pct` is the actual %, never floored or sweetened.
- Negative weeks display clearly — frontend must not hide them.

---

### 2.3 `GET /v1/venue/me/metrics/peak-hours`

PRD §3.4 D2. 168-cell heat strip averaged across the trailing 4 complete weeks.

**Response 200:**

```ts
type HourCell = {
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0 = Monday
  hour: number;                              // 0..23
  avg_count: number;                         // float, average per occurrence
};

type PeakHoursData = {
  cells: HourCell[];                         // 168 entries, all hours included
  top_3_hours: Array<{ day_of_week: number; hour: number }>;
  weeks_used: 4;
  window_start: string;                      // ISO date — Monday of earliest week
  window_end: string;                        // ISO date — Sunday of latest week
};

type PeakHoursResponse = MetricResponse<PeakHoursData>;
```

**Pending cases:**
- `insufficient_pattern_weeks` when fewer than 4 complete weeks of data exist. `weeks_complete` is 0..3.

**Acceptance:**
- Returns real Heat data only. No Google backfill. No synthetic data.
- All 168 cells always present in the array (even if `avg_count = 0`) so the frontend can render a uniform grid.
- Tooltip count shown in the UI is `avg_count` rounded to 1 decimal place by the frontend.

---

### 2.4 `GET /v1/venue/me/metrics/day-of-week`

PRD §3.4 D3. Bar chart of average check-ins per weekday across the trailing 4 weeks.

**Response 200:**

```ts
type DayOfWeekData = {
  days: Array<{
    day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0 = Monday
    avg_count: number;
  }>;                                          // always 7 entries, ordered Mon..Sun
  busiest_day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  weeks_used: 4;
  window_start: string;
  window_end: string;
};

type DayOfWeekResponse = MetricResponse<DayOfWeekData>;
```

**Pending cases:**
- `insufficient_pattern_weeks` (same as §2.3).

---

### 2.5 `GET /v1/venue/me/metrics/neighbourhood-comparison`

PRD §3.4 D4. The "killer line" — most data-hungry endpoint, threshold-gated.

**Response 200:**

```ts
type NeighbourhoodComparisonData = {
  week_start: ISODate;
  venue_count: number;                       // venue's own check-ins this week
  comparison_avg: number;                    // float, avg of qualifying peers
  pct_of_average: number;                    // 0.6 = 60%. Actual ratio, never sweetened.
  comparison_set: {
    scope: 'neighbourhood_and_category' | 'category_only';
    neighbourhood: string | null;            // null if scope is category_only
    category: string;
    qualifying_venue_count: number;
  };
  daily_breakdown: Array<{                   // trailing 7 days for the Month-3 dual-line chart
    date: ISODate;
    venue_count: number;
    comparison_avg: number;
  }>;                                        // always 7 entries on `ready`; never partial
};

type NeighbourhoodComparisonResponse = MetricResponse<NeighbourhoodComparisonData>;
```

`daily_breakdown` powers the dual-line "killer line" chart (dashed neighbourhood baseline + solid venue line) in Month 3. Always 7 entries on a `ready` response. The aggregate `pct_of_average` is the headline figure; the chart is the texture.

**Threshold logic (server-side enforced, PRD §3.4 D4):**

1. Primary: `neighbourhood_and_category` — requires ≥10 venues in the same neighbourhood + category, each with ≥20 check-ins in the trailing 4 weeks.
2. Fallback: `category_only` — when fewer than 3 same-category peers exist in the neighbourhood. Same ≥10 venues × ≥20 check-ins threshold applies, but scoped to the city.
3. Otherwise: `pending` with `neighbourhood_density_below_threshold`.

**Pending cases:**
- `neighbourhood_density_below_threshold` with the count of qualifying venues so the frontend can render "Your neighbourhood currently has [N] qualifying venues."

**Acceptance:**
- Threshold logic enforced server-side. Frontend cannot override or bypass.
- `pct_of_average` is the actual ratio. No flooring. No rounding into a friendlier number.
- `comparison_set` is always returned on `ready` so the venue knows what they're being compared against.

---

### 2.6 `GET /v1/venue/me/metrics/tile-views?week=current`

PRD §3.5. Day-1 hero data — works immediately because tile views are app engagement, not check-ins.

**Response 200:**

```ts
type TileViewsData = {
  week_start: string;
  views: number;
  previous_week: {
    week_start: string;
    views: number;
  } | null;
  delta_pct: number | null;
};

type TileViewsResponse = MetricResponse<TileViewsData>;
```

**Pending cases:**
- `no_data` only if the venue's tile is not yet live in the consumer app. In normal operation this endpoint is always `ready` from Day 1.

---

### 2.7 `GET /v1/venue/me/metrics/tap-throughs?week=current`

PRD §3.5. Counts of hours / directions / website taps. Zero is a valid `ready` response — "0 tap-throughs this week" is honest.

**Response 200:**

```ts
type TapThroughsData = {
  week_start: string;
  hours: number;
  directions: number;
  website: number;
  previous_week: {
    week_start: string;
    hours: number;
    directions: number;
    website: number;
  } | null;
};

type TapThroughsResponse = MetricResponse<TapThroughsData>;
```

**Pending cases:**
- `no_data` only if tile is not yet live.

---

## 2.8 Public endpoints (no auth)

These power the marketing page at `intelligence.getheatapp.com`. Unauthenticated, cached aggressively (30s edge cache), zero PII.

### `GET /v1/public/live-counts`

Drives the 8-cell live-activity widget in landing block B02.

```ts
type LiveCountsResponse = {
  total_users: number;                       // city-wide aggregate
  city: 'Barcelona';                         // hardcoded at MVP
  neighbourhoods: Array<{
    name: string;                            // e.g. "El Born"
    tier: 'hot' | 'warming' | 'ambient';
    users_now: number;
    sparkline_15min: number[];               // 12 values, one per 75-second slice over the last 15min
  }>;
  generated_at: ISODateTime;
};
```

**Tier thresholds** are server-side, derived from current vs typical baseline:
- `hot`: >1.2× typical for this hour-of-week
- `warming`: 0.85–1.2×
- `ambient`: <0.85×

**Cache:** `Cache-Control: public, max-age=30`. Frontend polls every 5s; CDN absorbs most traffic.

**Pre-launch fallback:** if the consumer app has no live users yet on launch day, this endpoint returns 503 with `{ error: 'pre_launch' }`. The marketing page swaps the widget for a "Launching [date]" frame — never fakes numbers (per design spec §2.B02).

### `GET /v1/public/founding-50-status`

Drives the cap counter on the landing pricing block and the closing CTA.

```ts
type Founding50StatusResponse = {
  cap: 50;
  claimed: number;                           // count of venues.status = 'verified_founding_50'
  remaining: number;                         // cap - claimed
  closed_at: ISODateTime | null;             // founders mark this manually when the cohort closes
};
```

**Source of truth:** the `venues` table — Founding 50 is a tagged subscription on the €49/yr price ID, not a coupon. We count rows where `status = 'verified_founding_50'`. No Stripe call required.

**Cache:** `max-age=300` (5min, in-memory) — counter changes ~once per sale.

---

## 3. Admin endpoint

### 3.1 `POST /v1/admin/jobs/recompute-metrics`

Forces a recomputation of `venue_metrics` for all Verified venues. Used by founders before sales calls and during testing.

**Auth:** separate admin token, not the venue session JWT.

**Request body:**

```ts
type RecomputeRequest = {
  venue_ids?: string[];   // omit to recompute all Verified venues
  weeks_back?: number;    // default 8, max 12
};
```

**Response 202:**

```ts
type RecomputeResponse = {
  job_id: string;
  venues_queued: number;
  estimated_completion_seconds: number;
};
```

The cron's nightly run (06:00 Europe/Madrid) hits this same code path internally.

---

## 4. Auth — Supabase Auth

Auth is delegated to Supabase Auth, not implemented in Hono. The frontend uses `@supabase/supabase-js` directly for login / logout / password reset, and obtains a JWT signed with the project's JWT secret. The Hono API verifies that JWT on every venue endpoint.

### 4.1 Frontend → Supabase (no Hono involvement)

```ts
// Login
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
// data.session.access_token is the JWT to put in Authorization headers

// Logout
await supabase.auth.signOut();

// Password reset request
await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://venues.getheatapp.com/auth/reset' });

// Password reset confirm
await supabase.auth.updateUser({ password: newPassword });
```

### 4.2 Hono JWT verification

Every `/v1/venue/*` request:
1. Extracts the bearer token from `Authorization`
2. Verifies signature using `SUPABASE_JWT_SECRET`
3. Reads `sub` (Supabase user ID) from the verified payload
4. Looks up `venue_id` via the `venue_users` mapping table
5. Scopes all DB queries to that `venue_id`

### 4.3 RLS as defence in depth

The `venue_metrics` table has RLS enabled with policy:

```sql
create policy "venue can read own metrics"
  on venue_metrics for select
  using (venue_id = (select venue_id from venue_users where user_id = auth.uid()));
```

Even if the API layer has a bug, RLS prevents cross-tenant reads. This is the second privacy layer required by PRD §4.3.

### 4.4 Founder-created accounts (no self-serve signup)

Per PRD §3.8 — venue logins are created by founders during in-person verification. The admin script in E5.1 calls `supabase.auth.admin.createUser()` with a generated password, then inserts the `venue_users` mapping row, then triggers a password-reset email so the venue sets their own password on first login.

---

## 5. Privacy invariants the API must enforce

These are testable assertions for the Sprint 2A privacy gate (PLANNING.md §3):

1. No endpoint accepts `venue_id` from the client. Period.
2. Every metric endpoint scopes its DB query by the venue ID derived from the JWT.
3. `neighbourhood-comparison` aggregates ≥10 venues — never reveals individual peer values.
4. No response includes any individual user's identity, even hashed.
5. 401 responses leak no information about whether the email/account exists.

The privacy gate test suite (to be written in Sprint 2A) iterates over every endpoint, attempts cross-tenant access via every plausible vector (header injection, body field, path traversal), and asserts 401 or own-data only.

---

## 6. Versioning

All endpoints are under `/v1`. Breaking changes require `/v2`. Additive changes (new optional fields, new pending `kind` values) are not breaking — frontends MUST tolerate unknown fields and unknown `kind` values (fall back to a generic empty state).

---

*Mocked fixtures live in [contracts/fixtures.ts](contracts/fixtures.ts). TypeScript types in [contracts/types.ts](contracts/types.ts) — copy-paste into both `apps/portal` and `apps/api` once those projects are scaffolded, or extract into a shared package.*
