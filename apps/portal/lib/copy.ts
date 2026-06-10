// Empty-state copy. Backend ships facts; frontend ships strings.
// Keep this file as the single source of truth for what the venue reads.

import type { PendingReason } from '@heat/contracts';

export type EmptyStateCopy = {
  title: string;
  killerLine: string;       // may contain "__%" or other placeholder marker
  detail: string;
  progressLabel: string;    // "6 of 10 venues active" / "Day 3 of 7"
  unlockHint: string;       // "Unlocks ~ May 11" / "Unlocks at 10"
};

const formatUnlockDate = (iso: string | null): string => {
  if (!iso) return 'Unlocks once neighbourhood density is sufficient';
  const d = new Date(iso + 'T00:00:00');
  return `Unlocks ~ ${d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`;
};

export function copyForCheckIns(reason: PendingReason): EmptyStateCopy {
  if (reason.kind === 'first_week_in_progress') {
    const day = reason.checkins_so_far; // backend ships count, not day; FE may compute day client-side from pilot_started_at instead
    return {
      title: 'Check-in count',
      killerLine: "You'll see check-in counts as soon as the consumer app accumulates a stable baseline for your venue.",
      detail:
        "Check-ins are organic signals from Heat users picking your venue tonight. We hold the number until 7 days of activity — not because the data isn't there, but because tiny early counts are misleading.",
      progressLabel: `${day} check-in${day === 1 ? '' : 's'} so far`,
      unlockHint: formatUnlockDate(reason.estimated_unlock_at),
    };
  }
  return defaultCopy(reason);
}

export function copyForPeakHours(reason: PendingReason): EmptyStateCopy {
  if (reason.kind === 'insufficient_pattern_weeks') {
    return {
      title: '4-week peak hours pattern',
      killerLine: 'When does your venue actually peak? Hourly heat across the last 4 weeks.',
      detail:
        'Peak hours need 4 full weeks to filter out one-off events. Partial data shows after Week 1.',
      progressLabel: `Week ${reason.weeks_complete} of ${reason.weeks_required}`,
      unlockHint: formatUnlockDate(reason.estimated_unlock_at),
    };
  }
  return defaultCopy(reason);
}

export function copyForDayOfWeek(reason: PendingReason): EmptyStateCopy {
  if (reason.kind === 'insufficient_pattern_weeks') {
    return {
      title: '7-day rhythm',
      killerLine: 'Which night of the week is yours? Average heat per weekday.',
      detail: 'Day-of-week patterns require 4 full weeks so each weekday has a fair sample.',
      progressLabel: `Week ${reason.weeks_complete} of ${reason.weeks_required}`,
      unlockHint: formatUnlockDate(reason.estimated_unlock_at),
    };
  }
  return defaultCopy(reason);
}

export function copyForNeighbourhood(reason: PendingReason): EmptyStateCopy {
  if (reason.kind === 'neighbourhood_density_below_threshold') {
    return {
      title: 'El Born baseline',
      killerLine: '"You\'re at __% of the average heat for bars in El Born this week."',
      detail:
        "This is the line you're paying for. We unlock it when the comparison is statistically honest — at least 10 venues with 20+ check-ins each in your neighbourhood.",
      progressLabel: `${reason.qualifying_venues} of ${reason.venues_required} venues active`,
      unlockHint: `Unlocks at ${reason.venues_required}`,
    };
  }
  return defaultCopy(reason);
}

function defaultCopy(reason: PendingReason): EmptyStateCopy {
  return {
    title: 'Building',
    killerLine: 'Data is on its way.',
    detail: `Status: ${reason.kind}. The dashboard will populate as data accumulates.`,
    progressLabel: '—',
    unlockHint: '',
  };
}
