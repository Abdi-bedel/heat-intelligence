export const formatPct = (ratio: number): string => `${Math.round(ratio * 100)}%`;

export const formatSignedPct = (ratio: number): string => {
  const pct = Math.round(ratio * 100);
  if (pct > 0) return `+${pct}%`;
  if (pct < 0) return `${pct}%`;
  return '0%';
};

export const formatNumber = (n: number): string => n.toLocaleString('en-GB');

export const daysBetween = (fromIso: string, toIso: string): number => {
  const a = Date.parse(fromIso + 'T00:00:00');
  const b = Date.parse(toIso + 'T00:00:00');
  return Math.max(0, Math.round((b - a) / 86400000));
};

export const pilotLabel = (pilotStartedAt: string, today = new Date()): string => {
  const todayIso = today.toISOString().slice(0, 10);
  const days = daysBetween(pilotStartedAt, todayIso) + 1;
  if (days < 8) return `Day ${days} of pilot`;
  const week = Math.ceil(days / 7);
  return `Week ${week} of pilot`;
};
