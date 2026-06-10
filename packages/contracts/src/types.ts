// Heat Intelligence — Venue API Contract v1
// Source of truth: ../API_CONTRACT.md
// Copy into apps/portal and apps/api once scaffolded, or extract to a shared package.

// ─── Common ──────────────────────────────────────────────────────────────────

export type ISODate = string;       // 'YYYY-MM-DD'
export type ISODateTime = string;   // ISO8601 UTC

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Monday

export type PendingReason =
  | {
      kind: 'first_week_in_progress';
      checkins_so_far: number;
      estimated_unlock_at: ISODate;
    }
  | {
      kind: 'insufficient_pattern_weeks';
      weeks_complete: number;
      weeks_required: 4;
      estimated_unlock_at: ISODate;
    }
  | {
      kind: 'neighbourhood_density_below_threshold';
      qualifying_venues: number;
      venues_required: 10;
      checkins_per_venue_required: 20;
      estimated_unlock_at: null;
    }
  | { kind: 'no_data'; estimated_unlock_at: null };

export type MetricResponse<T> =
  | { status: 'ready'; data: T; computed_at: ISODateTime }
  | { status: 'pending'; reason: PendingReason; computed_at: ISODateTime };

// ─── Errors ──────────────────────────────────────────────────────────────────

export type ApiError =
  | { error: 'unauthorized' }
  | { error: 'rate_limited'; retry_after_seconds: number }
  | { error: 'internal_error' }
  | { error: 'invalid_token' };

// ─── Profile (§2.1) ──────────────────────────────────────────────────────────

export type ProfileResponse = {
  venue_id: string;
  display_short_id: string;
  name: string;
  neighbourhood: string;
  city: string;
  category: string;
  status: 'verified_founding_50' | 'verified';
  verified_since: ISODate;
  pilot_started_at: ISODate;
  founding_50_number: number | null;
  user_email: string;
};

// ─── Check-ins (§2.2) ────────────────────────────────────────────────────────

export type CheckInsData = {
  week_start: ISODate;
  count: number;
  previous_week: { week_start: ISODate; count: number } | null;
  delta_pct: number | null;
  history: Array<{ week_start: ISODate; count: number }>;
};

export type CheckInsResponse = MetricResponse<CheckInsData>;

// ─── Peak hours (§2.3) ───────────────────────────────────────────────────────

export type HourCell = {
  day_of_week: DayOfWeek;
  hour: number; // 0..23
  avg_count: number;
};

export type PeakHoursData = {
  cells: HourCell[]; // always 168 entries
  top_3_hours: Array<{ day_of_week: DayOfWeek; hour: number }>;
  weeks_used: 4;
  window_start: ISODate;
  window_end: ISODate;
};

export type PeakHoursResponse = MetricResponse<PeakHoursData>;

// ─── Day of week (§2.4) ──────────────────────────────────────────────────────

export type DayOfWeekData = {
  days: Array<{ day_of_week: DayOfWeek; avg_count: number }>; // always 7 entries
  busiest_day: DayOfWeek;
  weeks_used: 4;
  window_start: ISODate;
  window_end: ISODate;
};

export type DayOfWeekResponse = MetricResponse<DayOfWeekData>;

// ─── Neighbourhood comparison (§2.5) ─────────────────────────────────────────

export type ComparisonScope = 'neighbourhood_and_category' | 'category_only';

export type NeighbourhoodComparisonData = {
  week_start: ISODate;
  venue_count: number;
  comparison_avg: number;
  pct_of_average: number; // 0.6 == 60%
  comparison_set: {
    scope: ComparisonScope;
    neighbourhood: string | null;
    category: string;
    qualifying_venue_count: number;
  };
  daily_breakdown: Array<{
    date: ISODate;
    venue_count: number;
    comparison_avg: number;
  }>;
};

export type NeighbourhoodComparisonResponse = MetricResponse<NeighbourhoodComparisonData>;

// ─── Tile views (§2.6) ───────────────────────────────────────────────────────

export type TileViewsData = {
  week_start: ISODate;
  views: number;
  previous_week: { week_start: ISODate; views: number } | null;
  delta_pct: number | null;
};

export type TileViewsResponse = MetricResponse<TileViewsData>;

// ─── Tap-throughs (§2.7) ─────────────────────────────────────────────────────

export type TapThroughsData = {
  week_start: ISODate;
  hours: number;
  directions: number;
  website: number;
  previous_week: {
    week_start: ISODate;
    hours: number;
    directions: number;
    website: number;
  } | null;
};

export type TapThroughsResponse = MetricResponse<TapThroughsData>;

// ─── Public (§2.8) — no auth, drives marketing page ──────────────────────────

export type NeighbourhoodTier = 'hot' | 'warming' | 'ambient';

export type LiveCountsResponse = {
  total_users: number;
  city: 'Barcelona';
  neighbourhoods: Array<{
    name: string;
    tier: NeighbourhoodTier;
    users_now: number;
    sparkline_15min: number[];
  }>;
  generated_at: ISODateTime;
};

export type Founding50StatusResponse = {
  cap: 50;
  claimed: number;
  remaining: number;
  closed_at: ISODateTime | null;
};

// ─── Auth (§4) — Supabase Auth, types here are for reference only ────────────
// Frontend uses @supabase/supabase-js directly — no Hono auth endpoints.

// ─── Admin (§3) ──────────────────────────────────────────────────────────────

export type RecomputeRequest = {
  venue_ids?: string[];
  weeks_back?: number;
};

export type RecomputeResponse = {
  job_id: string;
  venues_queued: number;
  estimated_completion_seconds: number;
};

// ─── Endpoint route map (single source of truth for clients) ─────────────────

export const Routes = {
  profile: '/v1/venue/me/profile',
  checkIns: '/v1/venue/me/metrics/check-ins',
  peakHours: '/v1/venue/me/metrics/peak-hours',
  dayOfWeek: '/v1/venue/me/metrics/day-of-week',
  neighbourhoodComparison: '/v1/venue/me/metrics/neighbourhood-comparison',
  tileViews: '/v1/venue/me/metrics/tile-views',
  tapThroughs: '/v1/venue/me/metrics/tap-throughs',
  publicLiveCounts: '/v1/public/live-counts',
  publicFounding50Status: '/v1/public/founding-50-status',
  adminRecompute: '/v1/admin/jobs/recompute-metrics',
} as const;
