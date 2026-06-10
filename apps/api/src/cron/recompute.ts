import type { RecomputeRequest } from '@heat/contracts';
import { adminSupabase } from '../lib/supabase';
import { notifyCronResult } from '../lib/observability';
import {
  aggregateCheckIns,
  aggregateDayOfWeek,
  aggregatePeakHours,
  aggregateTapThroughs,
  aggregateTileViews,
  weekStart,
} from './aggregate';
import { consumerEvents } from './sources';

// Nightly aggregation job. Run via Fly scheduled machine at 06:00 Europe/Madrid,
// or manually via POST /v1/admin/jobs/recompute-metrics.
//
// Status:
//   - Aggregation primitives: done (cron/aggregate.ts).
//   - Source: gated by ConsumerEventsSource — falls back to a stub that throws
//     "not configured" until CONSUMER_API_BASE_URL/_TOKEN are set (E7).
//
// When E7 lands, this function should work end-to-end without changes.

type Result = {
  jobId: string;
  venuesProcessed: number;
  venuesQueued: number;
  estimatedCompletionSeconds: number;
  errors: string[];
};

export async function recomputeMetrics(req: RecomputeRequest): Promise<Result> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const start = Date.now();
  const weeksBack = Math.min(12, req.weeks_back ?? 8);
  const errors: string[] = [];

  let venueIds = req.venue_ids;
  if (!venueIds) {
    const { data, error } = await adminSupabase()
      .from('venues')
      .select('id')
      .in('status', ['verified', 'verified_founding_50']);
    if (error) {
      const msg = `failed to list venues: ${error.message}`;
      console.error('[cron]', msg);
      await notifyCronResult({ jobId, ok: false, message: msg });
      return { jobId, venuesProcessed: 0, venuesQueued: 0, estimatedCompletionSeconds: 0, errors: [msg] };
    }
    venueIds = ((data ?? []) as Array<{ id: string }>).map((v) => v.id);
  }

  const now = new Date();
  const currentWeek = weekStart(now);
  const windowStart = new Date(now.getTime() - weeksBack * 7 * 86_400_000);
  const source = consumerEvents();

  let processed = 0;
  for (const venueId of venueIds) {
    try {
      // Pull events for this venue's window.
      const [checkIns, engagement] = await Promise.all([
        source.fetchCheckIns(windowStart, now, [venueId]),
        source.fetchEngagementEvents(windowStart, now, [venueId]),
      ]);

      // Aggregate.
      const checkInsData = aggregateCheckIns(checkIns, currentWeek);
      const peakHoursData = aggregatePeakHours(checkIns);
      const dayOfWeekData = aggregateDayOfWeek(checkIns);
      const tileViewsData = aggregateTileViews(engagement, currentWeek);
      const tapThroughsData = aggregateTapThroughs(engagement, currentWeek);

      // Upsert.
      const sb = adminSupabase();
      const writes = [
        ['check_ins', checkInsData],
        ['peak_hours', peakHoursData],
        ['day_of_week', dayOfWeekData],
        ['tile_views', tileViewsData],
        ['tap_throughs', tapThroughsData],
      ] as const;

      for (const [key, data] of writes) {
        if (!data) continue;
        const { error } = await sb.from('venue_metrics').upsert(
          {
            venue_id: venueId,
            week_start: currentWeek,
            metric_key: key,
            value: data,
            computed_at: new Date().toISOString(),
          },
          { onConflict: 'venue_id,week_start,metric_key' }
        );
        if (error) errors.push(`${venueId}/${key}: ${error.message}`);
      }

      processed++;
    } catch (err) {
      const msg = `${venueId}: ${(err as Error).message}`;
      errors.push(msg);
      console.error('[cron]', msg);
    }
  }

  const ok = errors.length === 0;
  await notifyCronResult({
    jobId,
    ok,
    message: ok
      ? `Processed ${processed}/${venueIds.length} venues in ${Math.round((Date.now() - start) / 1000)}s.`
      : `${processed}/${venueIds.length} venues processed; ${errors.length} errors.`,
    errors: errors.slice(0, 10),
  });

  return {
    jobId,
    venuesProcessed: processed,
    venuesQueued: venueIds.length,
    estimatedCompletionSeconds: Math.max(2, venueIds.length * 0.4),
    errors,
  };
}
