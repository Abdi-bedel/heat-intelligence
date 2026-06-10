// Heat Intelligence — Mock fixtures for the Venue API Contract v1
// Lets the frontend build the full dashboard before the backend ships.
//
// Two fixture sets per endpoint where applicable:
//   - `*_ready`      a realistic populated response
//   - `*_pending_*`  an empty-state response for each plausible PendingReason
//
// Test venue: "Bar Salvaje" — a bar in El Born, Barcelona.

import type {
  CheckInsResponse,
  DayOfWeekResponse,
  Founding50StatusResponse,
  HourCell,
  LiveCountsResponse,
  NeighbourhoodComparisonResponse,
  PeakHoursResponse,
  ProfileResponse,
  TapThroughsResponse,
  TileViewsResponse,
} from './types';

const COMPUTED_AT = '2026-05-07T05:00:00.000Z'; // 06:00 Madrid → 05:00 UTC after DST

// ─── Profile ─────────────────────────────────────────────────────────────────

export const profile_founding50: ProfileResponse = {
  venue_id: 'ven_2N9pXq8sLKr',
  display_short_id: '0019',
  name: 'Bar Marsella',
  neighbourhood: 'El Born',
  city: 'Barcelona',
  category: 'bar',
  status: 'verified_founding_50',
  verified_since: '2026-05-04',
  pilot_started_at: '2026-05-04',
  founding_50_number: 19,
  user_email: 'marsella@example.com',
};

// ─── Check-ins ───────────────────────────────────────────────────────────────

export const checkIns_ready: CheckInsResponse = {
  status: 'ready',
  computed_at: COMPUTED_AT,
  data: {
    week_start: '2026-04-27',
    count: 47,
    previous_week: { week_start: '2026-04-20', count: 42 },
    delta_pct: 0.119, // +11.9%
    history: [
      { week_start: '2026-03-09', count: 18 },
      { week_start: '2026-03-16', count: 24 },
      { week_start: '2026-03-23', count: 29 },
      { week_start: '2026-03-30', count: 33 },
      { week_start: '2026-04-06', count: 36 },
      { week_start: '2026-04-13', count: 39 },
      { week_start: '2026-04-20', count: 42 },
      { week_start: '2026-04-27', count: 47 },
    ],
  },
};

export const checkIns_ready_negative: CheckInsResponse = {
  status: 'ready',
  computed_at: COMPUTED_AT,
  data: {
    week_start: '2026-04-27',
    count: 31,
    previous_week: { week_start: '2026-04-20', count: 42 },
    delta_pct: -0.262, // -26.2% — must render clearly, not hidden
    history: [
      { week_start: '2026-03-30', count: 48 },
      { week_start: '2026-04-06', count: 45 },
      { week_start: '2026-04-13', count: 44 },
      { week_start: '2026-04-20', count: 42 },
      { week_start: '2026-04-27', count: 31 },
    ],
  },
};

export const checkIns_pending_first_week: CheckInsResponse = {
  status: 'pending',
  computed_at: COMPUTED_AT,
  reason: {
    kind: 'first_week_in_progress',
    checkins_so_far: 6,
    estimated_unlock_at: '2026-05-11', // next Monday after Bar Marsella's 2026-05-04 pilot start
  },
};

// ─── Peak hours ──────────────────────────────────────────────────────────────

// Generates a realistic 168-cell grid for a Barcelona late-night bar:
// - Quiet during weekday daytimes
// - Builds Thu–Sat 21:00 onward, peaking ~23:00–01:00
// - Sunday tapers
function generatePeakHourCells(): HourCell[] {
  const cells: HourCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      let avg = 0;
      const isLateWeekend = day >= 3 && day <= 5; // Thu/Fri/Sat
      if (hour >= 21 || hour <= 1) {
        avg = isLateWeekend ? 8 + Math.random() * 4 : 2 + Math.random() * 2;
      } else if (hour >= 18) {
        avg = isLateWeekend ? 3 + Math.random() * 2 : 1 + Math.random();
      } else if (hour >= 12) {
        avg = day === 6 ? 2 + Math.random() : 0.5 + Math.random() * 0.5;
      }
      cells.push({
        day_of_week: day as HourCell['day_of_week'],
        hour,
        avg_count: Math.round(avg * 10) / 10,
      });
    }
  }
  return cells;
}

export const peakHours_ready: PeakHoursResponse = {
  status: 'ready',
  computed_at: COMPUTED_AT,
  data: {
    cells: generatePeakHourCells(),
    top_3_hours: [
      { day_of_week: 5, hour: 23 }, // Sat 23:00
      { day_of_week: 5, hour: 0 },  // Sat 00:00 (Sunday early am, but bucketed by start)
      { day_of_week: 4, hour: 23 }, // Fri 23:00
    ],
    weeks_used: 4,
    window_start: '2026-03-30',
    window_end: '2026-04-26',
  },
};

export const peakHours_pending_week2: PeakHoursResponse = {
  status: 'pending',
  computed_at: COMPUTED_AT,
  reason: {
    kind: 'insufficient_pattern_weeks',
    weeks_complete: 2,
    weeks_required: 4,
    estimated_unlock_at: '2026-06-01',
  },
};

export const peakHours_pending_week0: PeakHoursResponse = {
  status: 'pending',
  computed_at: COMPUTED_AT,
  reason: {
    kind: 'insufficient_pattern_weeks',
    weeks_complete: 0,
    weeks_required: 4,
    estimated_unlock_at: '2026-06-01',
  },
};

// ─── Day of week ─────────────────────────────────────────────────────────────

export const dayOfWeek_ready: DayOfWeekResponse = {
  status: 'ready',
  computed_at: COMPUTED_AT,
  data: {
    days: [
      { day_of_week: 0, avg_count: 8.5 },   // Mon
      { day_of_week: 1, avg_count: 11.2 },  // Tue
      { day_of_week: 2, avg_count: 13.8 },  // Wed
      { day_of_week: 3, avg_count: 22.4 },  // Thu
      { day_of_week: 4, avg_count: 38.1 },  // Fri
      { day_of_week: 5, avg_count: 51.7 },  // Sat — busiest
      { day_of_week: 6, avg_count: 17.3 },  // Sun
    ],
    busiest_day: 5,
    weeks_used: 4,
    window_start: '2026-03-30',
    window_end: '2026-04-26',
  },
};

export const dayOfWeek_pending: DayOfWeekResponse = {
  status: 'pending',
  computed_at: COMPUTED_AT,
  reason: {
    kind: 'insufficient_pattern_weeks',
    weeks_complete: 1,
    weeks_required: 4,
    estimated_unlock_at: '2026-06-01',
  },
};

// ─── Neighbourhood comparison ────────────────────────────────────────────────

// Month-3 case: venue is 12% above neighbourhood, matches the wireframe
export const neighbourhoodComparison_ready: NeighbourhoodComparisonResponse = {
  status: 'ready',
  computed_at: COMPUTED_AT,
  data: {
    week_start: '2026-04-27',
    venue_count: 79,
    comparison_avg: 70.5,
    pct_of_average: 1.12, // 112% — matches the killer-line wireframe
    comparison_set: {
      scope: 'neighbourhood_and_category',
      neighbourhood: 'El Born',
      category: 'bar',
      qualifying_venue_count: 14,
    },
    daily_breakdown: [
      { date: '2026-04-27', venue_count: 9,  comparison_avg: 9.8 },
      { date: '2026-04-28', venue_count: 11, comparison_avg: 10.2 },
      { date: '2026-04-29', venue_count: 13, comparison_avg: 11.1 },
      { date: '2026-04-30', venue_count: 16, comparison_avg: 12.6 },
      { date: '2026-05-01', venue_count: 14, comparison_avg: 12.0 },
      { date: '2026-05-02', venue_count: 11, comparison_avg: 9.8 },
      { date: '2026-05-03', venue_count: 5,  comparison_avg: 5.0 },
    ],
  },
};

export const neighbourhoodComparison_ready_fallback: NeighbourhoodComparisonResponse = {
  status: 'ready',
  computed_at: COMPUTED_AT,
  data: {
    week_start: '2026-04-27',
    venue_count: 47,
    comparison_avg: 71.5,
    pct_of_average: 0.657,
    comparison_set: {
      scope: 'category_only',
      neighbourhood: null,
      category: 'bar',
      qualifying_venue_count: 18,
    },
    daily_breakdown: [
      { date: '2026-04-27', venue_count: 5,  comparison_avg: 9.0 },
      { date: '2026-04-28', venue_count: 6,  comparison_avg: 10.0 },
      { date: '2026-04-29', venue_count: 7,  comparison_avg: 11.0 },
      { date: '2026-04-30', venue_count: 9,  comparison_avg: 12.5 },
      { date: '2026-05-01', venue_count: 8,  comparison_avg: 12.0 },
      { date: '2026-05-02', venue_count: 7,  comparison_avg: 10.0 },
      { date: '2026-05-03', venue_count: 5,  comparison_avg: 7.0 },
    ],
  },
};

export const neighbourhoodComparison_pending: NeighbourhoodComparisonResponse = {
  status: 'pending',
  computed_at: COMPUTED_AT,
  reason: {
    kind: 'neighbourhood_density_below_threshold',
    qualifying_venues: 6, // matches Day 1 wireframe ("6 of 10")
    venues_required: 10,
    checkins_per_venue_required: 20,
    estimated_unlock_at: null,
  },
};

// ─── Tile views ──────────────────────────────────────────────────────────────

export const tileViews_ready: TileViewsResponse = {
  status: 'ready',
  computed_at: COMPUTED_AT,
  data: {
    week_start: '2026-04-27',
    views: 312,
    previous_week: { week_start: '2026-04-20', views: 280 },
    delta_pct: 0.114,
  },
};

export const tileViews_ready_zero: TileViewsResponse = {
  status: 'ready',
  computed_at: COMPUTED_AT,
  data: {
    week_start: '2026-04-27',
    views: 0,
    previous_week: { week_start: '2026-04-20', views: 0 },
    delta_pct: 0,
  },
};

// ─── Tap-throughs ────────────────────────────────────────────────────────────

export const tapThroughs_ready: TapThroughsResponse = {
  status: 'ready',
  computed_at: COMPUTED_AT,
  data: {
    week_start: '2026-04-27',
    hours: 41,
    directions: 23,
    website: 7,
    previous_week: {
      week_start: '2026-04-20',
      hours: 38,
      directions: 19,
      website: 9,
    },
  },
};

export const tapThroughs_ready_zero: TapThroughsResponse = {
  status: 'ready',
  computed_at: COMPUTED_AT,
  data: {
    week_start: '2026-04-27',
    hours: 0,
    directions: 0,
    website: 0,
    previous_week: null,
  },
};

// ─── Public endpoints (marketing page) ───────────────────────────────────────

export const liveCounts_ready: LiveCountsResponse = {
  total_users: 2847,
  city: 'Barcelona',
  generated_at: '2026-05-07T20:47:00.000Z',
  neighbourhoods: [
    { name: 'El Born',     tier: 'hot',     users_now: 412, sparkline_15min: [380, 385, 390, 395, 398, 402, 405, 408, 410, 411, 412, 412] },
    { name: 'Gràcia',      tier: 'hot',     users_now: 378, sparkline_15min: [340, 348, 354, 360, 365, 369, 372, 374, 376, 377, 378, 378] },
    { name: 'Eixample',    tier: 'warming', users_now: 294, sparkline_15min: [280, 282, 284, 286, 288, 289, 290, 291, 292, 293, 294, 294] },
    { name: 'Poblenou',    tier: 'warming', users_now: 221, sparkline_15min: [210, 212, 214, 215, 216, 217, 218, 219, 220, 220, 221, 221] },
    { name: 'Gòtic',       tier: 'warming', users_now: 187, sparkline_15min: [180, 181, 182, 183, 184, 184, 185, 185, 186, 186, 187, 187] },
    { name: 'Raval',       tier: 'ambient', users_now: 142, sparkline_15min: [142, 142, 142, 142, 142, 142, 142, 142, 142, 142, 142, 142] },
    { name: 'Barceloneta', tier: 'ambient', users_now: 98,  sparkline_15min: [99,  99,  98,  98,  98,  98,  98,  98,  98,  98,  98,  98] },
    { name: 'Sant Antoni', tier: 'ambient', users_now: 73,  sparkline_15min: [73,  73,  73,  73,  73,  73,  73,  73,  73,  73,  73,  73] },
  ],
};

export const founding50Status_ready: Founding50StatusResponse = {
  cap: 50,
  claimed: 19,
  remaining: 31,
  closed_at: null,
};

export const founding50Status_closed: Founding50StatusResponse = {
  cap: 50,
  claimed: 50,
  remaining: 0,
  closed_at: '2026-08-15T14:00:00.000Z',
};

// ─── Scenario bundles for end-to-end frontend testing ────────────────────────
//
// Three named scenarios mirror the §7 acceptance gate:
//   - day1:  brand-new venue, only tile metrics populated
//   - week2: 2 weeks in, tile metrics + check-ins, patterns still locked
//   - month3: mature, every endpoint ready

export const scenario_day1 = {
  profile: profile_founding50,
  checkIns: checkIns_pending_first_week,
  peakHours: peakHours_pending_week0,
  dayOfWeek: {
    ...dayOfWeek_pending,
    reason: {
      kind: 'insufficient_pattern_weeks' as const,
      weeks_complete: 0,
      weeks_required: 4 as const,
      estimated_unlock_at: '2026-06-01',
    },
  },
  neighbourhoodComparison: neighbourhoodComparison_pending,
  tileViews: tileViews_ready,
  tapThroughs: tapThroughs_ready,
};

export const scenario_week2 = {
  profile: profile_founding50,
  checkIns: checkIns_ready,
  peakHours: peakHours_pending_week2,
  dayOfWeek: dayOfWeek_pending,
  neighbourhoodComparison: neighbourhoodComparison_pending,
  tileViews: tileViews_ready,
  tapThroughs: tapThroughs_ready,
};

export const scenario_month3 = {
  profile: profile_founding50,
  checkIns: checkIns_ready,
  peakHours: peakHours_ready,
  dayOfWeek: dayOfWeek_ready,
  neighbourhoodComparison: neighbourhoodComparison_ready,
  tileViews: tileViews_ready,
  tapThroughs: tapThroughs_ready,
};
