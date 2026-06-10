import type {
  CheckInsResponse,
  DayOfWeekResponse,
  NeighbourhoodComparisonResponse,
  PeakHoursResponse,
  ProfileResponse,
  TapThroughsResponse,
  TileViewsResponse,
} from '@heat/contracts';
import {
  scenario_day1,
  scenario_month3,
  scenario_week2,
  profile_founding50,
} from '@heat/contracts/fixtures';
import { adminSupabase } from './supabase';

// Reads from Supabase venue_metrics; falls back to fixtures when:
//   1. The DB row is missing (cron hasn't run, or this venue is fresh), OR
//   2. We're in dev mode with `?scenario=` override.
//
// Real metric population happens via the cron (apps/api/src/cron/recompute.ts)
// once the consumer-app events API is available (E7).

type MetricKey =
  | 'check_ins'
  | 'tile_views'
  | 'tap_throughs'
  | 'peak_hours'
  | 'day_of_week'
  | 'neighbourhood_comparison';

type Scenario = {
  profile: ProfileResponse;
  checkIns: CheckInsResponse;
  peakHours: PeakHoursResponse;
  dayOfWeek: DayOfWeekResponse;
  neighbourhoodComparison: NeighbourhoodComparisonResponse;
  tileViews: TileViewsResponse;
  tapThroughs: TapThroughsResponse;
};
type ScenarioKey = 'day1' | 'week2' | 'month3';
const scenarios: Record<ScenarioKey, Scenario> = {
  day1: scenario_day1,
  week2: scenario_week2,
  month3: scenario_month3,
};

const isDev = () => process.env.NODE_ENV !== 'production';

export function pickScenario(scenarioParam?: string | null): Scenario {
  if (!isDev()) return scenarios.month3;
  const key = scenarioParam as ScenarioKey | undefined;
  return scenarios[key ?? 'month3'] ?? scenarios.month3;
}

async function readMetric<T>(venueId: string, key: MetricKey): Promise<T | null> {
  if (venueId.startsWith('ven_dev_')) return null; // dev path: skip DB
  const { data, error } = await adminSupabase()
    .from('venue_metrics')
    .select('value')
    .eq('venue_id', venueId)
    .eq('metric_key', key)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data.value as T;
}

export async function getProfile(venueId: string): Promise<ProfileResponse> {
  if (venueId.startsWith('ven_dev_')) return profile_founding50;
  const { data, error } = await adminSupabase()
    .from('venues')
    .select(
      'id, display_short_id, name, neighbourhood, city, category, status, founding_50_number, verified_since, pilot_started_at'
    )
    .eq('id', venueId)
    .single();
  if (error || !data) {
    // First-load case while we're still backfilling — return a degraded fixture.
    return profile_founding50;
  }
  return {
    venue_id: data.id as string,
    display_short_id: data.display_short_id as string,
    name: data.name as string,
    neighbourhood: data.neighbourhood as string,
    city: data.city as string,
    category: data.category as string,
    status: data.status as ProfileResponse['status'],
    verified_since: data.verified_since as string,
    pilot_started_at: data.pilot_started_at as string,
    founding_50_number: (data.founding_50_number as number | null) ?? null,
    user_email: '', // populated by route handler from auth context
  };
}

export async function getCheckIns(venueId: string, scenario?: string): Promise<CheckInsResponse> {
  const stored = await readMetric<CheckInsResponse>(venueId, 'check_ins');
  return stored ?? pickScenario(scenario).checkIns;
}

export async function getPeakHours(venueId: string, scenario?: string): Promise<PeakHoursResponse> {
  const stored = await readMetric<PeakHoursResponse>(venueId, 'peak_hours');
  return stored ?? pickScenario(scenario).peakHours;
}

export async function getDayOfWeek(venueId: string, scenario?: string): Promise<DayOfWeekResponse> {
  const stored = await readMetric<DayOfWeekResponse>(venueId, 'day_of_week');
  return stored ?? pickScenario(scenario).dayOfWeek;
}

export async function getNeighbourhood(
  venueId: string,
  scenario?: string
): Promise<NeighbourhoodComparisonResponse> {
  const stored = await readMetric<NeighbourhoodComparisonResponse>(
    venueId,
    'neighbourhood_comparison'
  );
  return stored ?? pickScenario(scenario).neighbourhoodComparison;
}

export async function getTileViews(venueId: string, scenario?: string): Promise<TileViewsResponse> {
  const stored = await readMetric<TileViewsResponse>(venueId, 'tile_views');
  return stored ?? pickScenario(scenario).tileViews;
}

export async function getTapThroughs(
  venueId: string,
  scenario?: string
): Promise<TapThroughsResponse> {
  const stored = await readMetric<TapThroughsResponse>(venueId, 'tap_throughs');
  return stored ?? pickScenario(scenario).tapThroughs;
}
