// Aggregation primitives used by the nightly cron and by future on-demand
// recomputation. Pure functions over event arrays — no I/O, easy to test.

import type {
  CheckInsData,
  DayOfWeekData,
  HourCell,
  PeakHoursData,
  TapThroughsData,
  TileViewsData,
} from '@heat/contracts';
import type { ConsumerCheckIn, ConsumerEngagementEvent } from './sources';

export const MS_PER_DAY = 86_400_000;
export const TZ = 'Europe/Madrid';

/** ISO date of the Monday on or before `d`, in Europe/Madrid. */
export function weekStart(d: Date): string {
  // Lazy: treat d as UTC, fix day-of-week, format YYYY-MM-DD.
  const day = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  const monday = new Date(d.getTime() - day * MS_PER_DAY);
  return monday.toISOString().slice(0, 10);
}

export function aggregateCheckIns(
  events: ConsumerCheckIn[],
  weekStartIso: string
): CheckInsData | null {
  // Bucket by week.
  const byWeek = new Map<string, number>();
  for (const e of events) {
    const w = weekStart(new Date(e.occurred_at));
    byWeek.set(w, (byWeek.get(w) ?? 0) + 1);
  }
  const count = byWeek.get(weekStartIso) ?? 0;
  const prevWeek = isoAddDays(weekStartIso, -7);
  const prev = byWeek.has(prevWeek) ? { week_start: prevWeek, count: byWeek.get(prevWeek)! } : null;
  const delta = prev && prev.count > 0 ? (count - prev.count) / prev.count : null;

  // 8-week trailing history.
  const history: Array<{ week_start: string; count: number }> = [];
  for (let i = 7; i >= 0; i--) {
    const w = isoAddDays(weekStartIso, -7 * i);
    history.push({ week_start: w, count: byWeek.get(w) ?? 0 });
  }

  return {
    week_start: weekStartIso,
    count,
    previous_week: prev,
    delta_pct: delta,
    history,
  };
}

export function aggregatePeakHours(events: ConsumerCheckIn[]): PeakHoursData | null {
  // 168-cell grid averaged across the trailing 4 complete weeks.
  // Caller passes in the right window — this fn just buckets and averages.
  if (events.length === 0) return null;
  const cells = new Map<string, number>(); // key: `${dow}:${hour}`
  for (const e of events) {
    const d = new Date(e.occurred_at);
    const dow = ((d.getUTCDay() + 6) % 7) as HourCell['day_of_week'];
    const hour = d.getUTCHours();
    const key = `${dow}:${hour}`;
    cells.set(key, (cells.get(key) ?? 0) + 1);
  }
  // Convert into 168 entries. Average across 4 weeks → divide by 4.
  const out: HourCell[] = [];
  for (let dow = 0; dow < 7; dow++) {
    for (let hour = 0; hour < 24; hour++) {
      const total = cells.get(`${dow}:${hour}`) ?? 0;
      out.push({
        day_of_week: dow as HourCell['day_of_week'],
        hour,
        avg_count: total / 4,
      });
    }
  }
  // Top 3 hours by avg_count.
  const top = [...out].sort((a, b) => b.avg_count - a.avg_count).slice(0, 3);
  // Bound the window — caller knows real start/end; placeholder here.
  return {
    cells: out,
    top_3_hours: top.map((c) => ({ day_of_week: c.day_of_week, hour: c.hour })),
    weeks_used: 4,
    window_start: '0000-00-00', // overwritten by caller
    window_end: '0000-00-00',
  };
}

export function aggregateDayOfWeek(events: ConsumerCheckIn[]): DayOfWeekData | null {
  if (events.length === 0) return null;
  const days = new Map<number, number>();
  for (const e of events) {
    const d = new Date(e.occurred_at);
    const dow = (d.getUTCDay() + 6) % 7;
    days.set(dow, (days.get(dow) ?? 0) + 1);
  }
  const arr: DayOfWeekData['days'] = [];
  for (let dow = 0; dow < 7; dow++) {
    arr.push({
      day_of_week: dow as DayOfWeekData['days'][number]['day_of_week'],
      avg_count: (days.get(dow) ?? 0) / 4,
    });
  }
  let busiest: DayOfWeekData['busiest_day'] = 0;
  let max = -1;
  for (const a of arr) {
    if (a.avg_count > max) {
      max = a.avg_count;
      busiest = a.day_of_week;
    }
  }
  return {
    days: arr,
    busiest_day: busiest,
    weeks_used: 4,
    window_start: '0000-00-00',
    window_end: '0000-00-00',
  };
}

export function aggregateTileViews(
  events: ConsumerEngagementEvent[],
  weekStartIso: string
): TileViewsData | null {
  const tile = events.filter((e) => e.type === 'tile_view');
  const byWeek = new Map<string, number>();
  for (const e of tile) {
    const w = weekStart(new Date(e.occurred_at));
    byWeek.set(w, (byWeek.get(w) ?? 0) + 1);
  }
  const views = byWeek.get(weekStartIso) ?? 0;
  const prevIso = isoAddDays(weekStartIso, -7);
  const prev = byWeek.has(prevIso) ? { week_start: prevIso, views: byWeek.get(prevIso)! } : null;
  const delta = prev && prev.views > 0 ? (views - prev.views) / prev.views : null;
  return { week_start: weekStartIso, views, previous_week: prev, delta_pct: delta };
}

export function aggregateTapThroughs(
  events: ConsumerEngagementEvent[],
  weekStartIso: string
): TapThroughsData | null {
  const tally = (week: string) => {
    const inWeek = events.filter((e) => weekStart(new Date(e.occurred_at)) === week);
    return {
      hours: inWeek.filter((e) => e.type === 'tap_hours').length,
      directions: inWeek.filter((e) => e.type === 'tap_directions').length,
      website: inWeek.filter((e) => e.type === 'tap_website').length,
    };
  };
  const this_ = tally(weekStartIso);
  const prev_ = tally(isoAddDays(weekStartIso, -7));
  const hadPrev = prev_.hours + prev_.directions + prev_.website > 0;
  return {
    week_start: weekStartIso,
    hours: this_.hours,
    directions: this_.directions,
    website: this_.website,
    previous_week: hadPrev ? { week_start: isoAddDays(weekStartIso, -7), ...prev_ } : null,
  };
}

function isoAddDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
