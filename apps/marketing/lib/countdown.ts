// Phase 2 countdown — pulls a target ISO date from env, falls back to "October 2026"
// (sensible early-2026 default that matches the bundle copy).

export type Countdown = { months: number; days: number; isPast: boolean };

const FALLBACK_TARGET = '2026-10-15'; // mid-October placeholder until Abdi locks the date

export function phaseTwoTarget(): Date {
  const raw = process.env.NEXT_PUBLIC_PHASE_2_DATE ?? FALLBACK_TARGET;
  return new Date(`${raw}T00:00:00Z`);
}

export function countdownTo(target: Date, now = new Date()): Countdown {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return { months: 0, days: 0, isPast: true };

  const days = Math.floor(diffMs / 86_400_000);
  const months = Math.floor(days / 30);
  const remDays = days - months * 30;
  return { months, days: remDays, isPast: false };
}
