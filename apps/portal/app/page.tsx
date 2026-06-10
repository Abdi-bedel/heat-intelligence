import type {
  CheckInsResponse,
  DayOfWeekResponse,
  NeighbourhoodComparisonResponse,
  PeakHoursResponse,
  ProfileResponse,
  TapThroughsResponse,
  TileViewsResponse,
} from '@heat/contracts';
import { Routes } from '@heat/contracts';
import { apiFetch } from '@/lib/api-client';
import {
  copyForCheckIns,
  copyForDayOfWeek,
  copyForNeighbourhood,
  copyForPeakHours,
  type EmptyStateCopy,
} from '@/lib/copy';
import { formatNumber, formatPct, formatSignedPct, pilotLabel } from '@/lib/format';

type ScenarioKey = 'day1' | 'week2' | 'month3';

async function fetchAll(scenario: string | undefined) {
  const q = scenario ? `?scenario=${encodeURIComponent(scenario)}` : '';
  const [profile, checkIns, peakHours, dayOfWeek, neighbourhoodComparison, tileViews, tapThroughs] =
    await Promise.all([
      apiFetch<ProfileResponse>(Routes.profile),
      apiFetch<CheckInsResponse>(`${Routes.checkIns}${q}`),
      apiFetch<PeakHoursResponse>(`${Routes.peakHours}${q}`),
      apiFetch<DayOfWeekResponse>(`${Routes.dayOfWeek}${q}`),
      apiFetch<NeighbourhoodComparisonResponse>(`${Routes.neighbourhoodComparison}${q}`),
      apiFetch<TileViewsResponse>(`${Routes.tileViews}${q}`),
      apiFetch<TapThroughsResponse>(`${Routes.tapThroughs}${q}`),
    ]);
  return { profile, checkIns, peakHours, dayOfWeek, neighbourhoodComparison, tileViews, tapThroughs };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  const params = await searchParams;
  const key: ScenarioKey =
    params.scenario === 'day1' || params.scenario === 'week2' ? params.scenario : 'month3';
  const data = await fetchAll(key);
  const isDay1 = key === 'day1';

  return (
    <main className="dashboard-shell mx-auto max-w-[1200px] p-3 sm:p-5 md:p-6">
      <div className="dashboard-frame overflow-hidden rounded-lg bg-bg-card border-hairline border-border">
        <Topbar email={data.profile.user_email} />
        <Header profile={data.profile} />
        <div className="flex flex-col gap-4 px-4 pb-5 pt-5 sm:px-6 sm:pb-7 sm:pt-6 md:gap-[22px] md:px-9 md:pb-9 md:pt-7">
          <ScenarioSwitcher current={key} />
          <MobileJumpNav />
          {isDay1 && <WelcomeRibbon name={data.profile.name} />}

          <Section
            id="tile-metrics"
            tag="Tile metrics · Live from Day 1"
            helper="Live counts from your tile this week: views and taps to hours, directions, and website."
            defaultOpen
          >
            <TileMetrics tileViews={data.tileViews} tapThroughs={data.tapThroughs} />
          </Section>

          <Section
            id="check-ins"
            tag="Check-ins this week"
            helper="Confirmed check-ins captured from your venue over the last 7 days."
          >
            <CheckInsBlock res={data.checkIns} />
          </Section>

          <Section
            id="neighbourhood"
            tag="Neighbourhood comparison · The killer line"
            helper="How your weekly heat compares to similar venues in your neighbourhood."
          >
            <NeighbourhoodBlock res={data.neighbourhoodComparison} />
          </Section>

          <Section
            id="peak-hours"
            tag="Peak hours"
            helper="Average activity by hour, based on your recent check-in patterns."
          >
            <PeakHoursBlock res={data.peakHours} />
          </Section>

          <Section
            id="day-of-week"
            tag="Day-of-week pattern"
            helper="Average activity by weekday so you can spot your strongest days."
          >
            <DayOfWeekBlock res={data.dayOfWeek} />
          </Section>
        </div>
        <Footer profile={data.profile} />
      </div>
    </main>
  );
}

// ─── Layout primitives ───────────────────────────────────────────────────────

function Topbar({ email }: { email: string }) {
  const initial = email[0]?.toUpperCase() ?? 'V';
  return (
    <div className="flex items-center justify-between border-b-hairline border-border bg-bg-secondary px-4 py-3 sm:px-5 sm:py-3.5 md:px-6">
      <div className="flex items-center gap-2.5">
        <span className="font-serif text-base font-medium tracking-tight">Heat</span>
        <span className="rounded-[3px] border-hairline border-border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-text-secondary">
          venues
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span className="hidden cursor-pointer sm:inline">Help</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border-hairline border-border bg-bg-card text-[10px] font-medium">
            {initial}
          </span>
          <span className="hidden sm:inline">{email}</span>
        </span>
      </div>
    </div>
  );
}

function Header({ profile }: { profile: ProfileResponse }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b-hairline border-border px-4 pb-5 pt-5 sm:gap-4 sm:px-6 sm:pb-6 sm:pt-6 md:px-9 md:pb-7 md:pt-8">
      <div>
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-text-tertiary">
          Verified venue · {profile.neighbourhood}
        </div>
        <div className="mb-3 flex items-center gap-3">
          <span className="font-serif text-[28px] font-medium leading-tight tracking-tight sm:text-3xl">
            {profile.name}
          </span>
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal text-sm font-semibold text-white">
            ✓
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {profile.founding_50_number !== null && (
            <span className="rounded-[4px] bg-coral-soft px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-coral-text">
              Founding 50 · #{profile.founding_50_number}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-teal-soft px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-teal-text">
            🔒 €49/mo locked forever
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center justify-end gap-1.5 text-[11px] text-text-tertiary">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          <span>Last updated · today, 06:02</span>
        </div>
        <div className="mt-1 font-serif text-sm font-medium">
          {pilotLabel(profile.pilot_started_at)}
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  tag,
  helper,
  children,
  defaultOpen,
}: {
  id: string;
  tag: string;
  helper?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <details
        open={defaultOpen}
        className="group rounded-md border-hairline border-border bg-bg-secondary px-4 py-3 md:hidden"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.14em] text-text-tertiary">
          <span>{tag}</span>
          <span className="text-base leading-none transition-transform group-open:rotate-45">+</span>
        </summary>
        {helper && <p className="mt-2 text-[12px] leading-snug text-text-secondary">{helper}</p>}
        <div className="mt-3">{children}</div>
      </details>

      <div className="hidden md:block">
        <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-text-tertiary">
          {tag}
        </div>
        {helper && <p className="mb-2.5 text-[11px] leading-snug text-text-secondary">{helper}</p>}
        {children}
      </div>
    </section>
  );
}

function MobileJumpNav() {
  const links = [
    { href: '#tile-metrics', label: 'Tile metrics' },
    { href: '#check-ins', label: 'Check-ins' },
    { href: '#neighbourhood', label: 'Neighbourhood' },
    { href: '#peak-hours', label: 'Peak hours' },
    { href: '#day-of-week', label: 'Day pattern' },
  ];
  return (
    <div className="-mx-1 overflow-x-auto pb-1 md:hidden">
      <div className="flex w-max gap-2 px-1">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-full border-hairline border-border bg-bg-secondary px-3 py-1.5 text-[11px] font-medium text-text-secondary"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function ScenarioSwitcher({ current }: { current: ScenarioKey }) {
  const link = (key: ScenarioKey, label: string) => (
    <a
      key={key}
      href={`?scenario=${key}`}
      className={`rounded-md border-hairline px-3 py-1 text-xs ${
        current === key
          ? 'border-coral bg-coral-soft text-coral-text'
          : 'border-border text-text-secondary hover:border-border-strong'
      }`}
    >
      {label}
    </a>
  );
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md bg-bg-secondary px-3 py-2 text-xs text-text-tertiary">
      <span className="w-full uppercase tracking-[0.12em] sm:w-auto">Preview scenario:</span>
      {link('day1', 'Day 1')}
      {link('week2', 'Week 2')}
      {link('month3', 'Month 3')}
    </div>
  );
}

function WelcomeRibbon({ name }: { name: string }) {
  return (
    <div className="flex items-start gap-3 rounded-md border-hairline border-coral/25 bg-coral-soft px-4 py-3 sm:gap-3.5 sm:px-5 sm:py-4">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-coral text-base text-white">
        ✦
      </div>
      <div>
        <div className="mb-1 font-serif text-base font-medium tracking-tight">
          Welcome to your dashboard, {name}.
        </div>
        <p className="text-[13px] leading-relaxed text-text-secondary">
          Your tile is live in the consumer app. Tile metrics are real from today. The
          neighbourhood comparison line and pattern data unlock as Heat data accumulates
          over the next few weeks. We&apos;ll show you exactly when.{' '}
          <a className="font-medium text-coral hover:underline" href="/data-journey">
            Read the data journey →
          </a>
        </p>
      </div>
    </div>
  );
}

function Footer({ profile }: { profile: ProfileResponse }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t-hairline border-border px-4 py-3 text-[11px] text-text-tertiary sm:px-6 sm:py-4 md:px-9">
      <span>
        Heat Intelligence · {profile.name} · venue ID {profile.display_short_id}
      </span>
      <div className="flex gap-3 sm:gap-4">
        <a className="hover:text-text-primary" href="#">Buy a Spotlight</a>
        <a className="hover:text-text-primary" href="mailto:support@getheatapp.com">Email support</a>
        <form action="/logout" method="post" className="inline">
          <button type="submit" className="cursor-pointer hover:text-text-primary">
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Tile metrics ────────────────────────────────────────────────────────────

function TileMetrics({
  tileViews,
  tapThroughs,
}: {
  tileViews: TileViewsResponse;
  tapThroughs: TapThroughsResponse;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:[grid-template-columns:1.2fr_1fr_1fr_1fr]">
      <Tile
        label="Tile views this week"
        helper="How many times people saw your venue tile in the app."
        value={tileViews.status === 'ready' ? tileViews.data.views : 0}
        delta={tileViews.status === 'ready' ? tileViews.data.delta_pct : null}
      />
      <Tile
        label="Hours tap-throughs"
        helper="Taps from your tile that opened your opening-hours details."
        value={tapThroughs.status === 'ready' ? tapThroughs.data.hours : 0}
        delta={tapThroughs.status === 'ready' ? deltaForTaps(tapThroughs, 'hours') : null}
      />
      <Tile
        label="Directions tap-throughs"
        helper="Taps from your tile that opened directions or navigation."
        value={tapThroughs.status === 'ready' ? tapThroughs.data.directions : 0}
        delta={tapThroughs.status === 'ready' ? deltaForTaps(tapThroughs, 'directions') : null}
      />
      <Tile
        label="Website tap-throughs"
        helper="Taps from your tile that sent people to your website."
        value={tapThroughs.status === 'ready' ? tapThroughs.data.website : 0}
        delta={tapThroughs.status === 'ready' ? deltaForTaps(tapThroughs, 'website') : null}
      />
    </div>
  );
}

function deltaForTaps(
  res: TapThroughsResponse,
  key: 'hours' | 'directions' | 'website'
): number | null {
  if (res.status !== 'ready') return null;
  const prev = res.data.previous_week;
  if (!prev || prev[key] === 0) return null;
  return (res.data[key] - prev[key]) / prev[key];
}

function Tile({
  label,
  helper,
  value,
  delta,
}: {
  label: string;
  helper?: string;
  value: number;
  delta: number | null;
}) {
  const deltaColor =
    delta === null
      ? 'text-text-tertiary'
      : delta > 0
        ? 'text-teal'
        : delta < 0
          ? 'text-coral'
          : 'text-text-tertiary';
  return (
    <div className="flex min-h-[154px] flex-col justify-center rounded-md bg-bg-secondary px-5 py-5 text-center sm:px-6 sm:py-6">
      <div className="mb-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-text-tertiary">
          {label}
        </div>
        {helper && (
          <div className="mx-auto mt-1 max-w-[30ch] text-[10px] leading-snug text-text-secondary">
            {helper}
          </div>
        )}
      </div>
      <div className="mb-2 font-serif text-3xl font-medium leading-none tracking-tight tabular-nums">
        {formatNumber(value)}
      </div>
      <div className={`text-[11px] ${deltaColor}`}>
        {delta === null ? '—' : `${formatSignedPct(delta)} vs. last week`}
      </div>
    </div>
  );
}

// ─── Check-ins ───────────────────────────────────────────────────────────────

function CheckInsBlock({ res }: { res: CheckInsResponse }) {
  if (res.status === 'pending') {
    return <EmptyState copy={copyForCheckIns(res.reason)} />;
  }
  const { count, delta_pct } = res.data;
  return (
    <div className="grid grid-cols-1 items-center gap-7 rounded-md bg-bg-secondary px-6 py-6 sm:px-7 sm:py-7 md:[grid-template-columns:1fr_1.5fr]">
      <div className="text-center md:text-left">
        <div className="font-serif text-[64px] font-medium leading-none tracking-tight tabular-nums">
          {formatNumber(count)}
        </div>
        <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-text-tertiary">
          Last 7 days
        </div>
        {delta_pct !== null && (
          <div className={`mt-2.5 text-[13px] font-medium ${delta_pct >= 0 ? 'text-teal' : 'text-coral'}`}>
            {formatSignedPct(delta_pct)} vs. last week
          </div>
        )}
      </div>
      <SparkArea history={res.data.history.map((h) => h.count)} />
    </div>
  );
}

function SparkArea({ history }: { history: number[] }) {
  if (history.length < 2) return <div className="h-20" />;
  const max = Math.max(...history);
  const min = Math.min(...history);
  const range = Math.max(1, max - min);
  const points = history
    .map((v, i) => {
      const x = (i / (history.length - 1)) * 280;
      const y = 70 - ((v - min) / range) * 60;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg viewBox="0 0 280 80" className="mx-auto h-24 w-full max-w-[520px] overflow-visible">
      <polyline
        fill="none"
        stroke="var(--text-secondary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        points={points}
      />
      <circle
        cx={280}
        cy={70 - ((history[history.length - 1]! - min) / range) * 60}
        r={3}
        fill="var(--text-primary)"
      />
    </svg>
  );
}

// ─── Neighbourhood comparison (the killer line) ──────────────────────────────

function NeighbourhoodBlock({ res }: { res: NeighbourhoodComparisonResponse }) {
  if (res.status === 'pending') {
    return <EmptyState copy={copyForNeighbourhood(res.reason)} />;
  }
  const { pct_of_average, comparison_set, daily_breakdown } = res.data;
  const above = pct_of_average >= 1;
  const accentClass = above ? 'text-coral' : 'text-amber-text';
  return (
    <div className="grid grid-cols-1 items-center gap-8 rounded-md bg-bg-secondary px-6 py-6 sm:px-7 sm:py-7 md:[grid-template-columns:1.4fr_1fr]">
      <div className="text-center md:text-left">
        <p className="mb-3.5 font-serif text-[26px] font-normal leading-snug tracking-tight">
          You&apos;re at{' '}
          <span className={`${accentClass} font-medium`}>{formatPct(pct_of_average)}</span>{' '}
          of the average heat for {comparison_set.category}s in{' '}
          <span className="font-medium">
            {comparison_set.neighbourhood ?? comparison_set.category}
          </span>{' '}
          this week.
        </p>
        <div className="flex flex-wrap justify-center gap-5 text-xs text-text-secondary md:justify-start">
          <span>
            <strong className="font-medium text-text-primary">
              {formatSignedPct(pct_of_average - 1)}
            </strong>{' '}
            vs neighbourhood
          </span>
          <span>
            <strong className="font-medium text-text-primary">
              {comparison_set.qualifying_venue_count} venues
            </strong>{' '}
            in comparison set
          </span>
          <span>Trailing 7 days</span>
        </div>
      </div>
      <DualLineChart breakdown={daily_breakdown} above={above} />
    </div>
  );
}

function DualLineChart({
  breakdown,
  above,
}: {
  breakdown: NeighbourhoodComparisonResponse extends infer R
    ? R extends { status: 'ready'; data: { daily_breakdown: infer B } }
      ? B
      : never
    : never;
  above: boolean;
}) {
  const all = [...breakdown.flatMap((d) => [d.venue_count, d.comparison_avg])];
  const max = Math.max(...all, 1);
  const venueLine = breakdown
    .map((d, i) => `${(i / (breakdown.length - 1)) * 280},${80 - (d.venue_count / max) * 60}`)
    .join(' ');
  const compLine = breakdown
    .map((d, i) => `${(i / (breakdown.length - 1)) * 280},${80 - (d.comparison_avg / max) * 60}`)
    .join(' ');
  const stroke = above ? 'var(--coral)' : 'var(--amber)';
  return (
    <div className="h-32 rounded-sm bg-bg-card p-4">
      <svg viewBox="0 0 280 100" className="w-full h-full overflow-visible">
        <polyline
          fill="none"
          stroke="var(--text-tertiary)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          points={compLine}
        />
        <polyline fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" points={venueLine} />
      </svg>
    </div>
  );
}

// ─── Peak hours ──────────────────────────────────────────────────────────────

function PeakHoursBlock({ res }: { res: PeakHoursResponse }) {
  if (res.status === 'pending') {
    return <EmptyState copy={copyForPeakHours(res.reason)} />;
  }
  const { cells, top_3_hours } = res.data;
  const peak = top_3_hours[0];
  const peakLabel = peak ? `${String(peak.hour).padStart(2, '0')}:00` : '—';

  // Reduce 168 cells to 24 by taking the avg across days for each hour, for a one-line preview.
  const byHour = Array.from({ length: 24 }, (_, h) => {
    const slice = cells.filter((c) => c.hour === h);
    return slice.reduce((sum, c) => sum + c.avg_count, 0) / Math.max(1, slice.length);
  });
  const max = Math.max(...byHour, 1);
  const points = byHour
    .map((v, i) => `${(i / 23) * 600},${100 - (v / max) * 80}`)
    .join(' ');
  return (
    <div className="rounded-md bg-bg-secondary px-6 py-6 sm:px-7 sm:py-7">
      <div className="mb-5 flex flex-wrap items-baseline justify-center gap-2 text-center md:justify-between md:text-left">
        <div className="font-serif text-base font-medium tracking-tight">When you peak</div>
        <div className="text-xs text-text-secondary">
          Avg. peak: <span className="font-medium text-coral">{peakLabel}</span>
        </div>
      </div>
      <svg viewBox="0 0 600 130" className="h-32 w-full overflow-visible">
        <line x1="0" y1="100" x2="600" y2="100" stroke="var(--border)" strokeWidth="0.5" />
        <polyline fill="none" stroke="var(--coral)" strokeWidth="2" points={points} strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ─── Day of week ─────────────────────────────────────────────────────────────

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function DayOfWeekBlock({ res }: { res: DayOfWeekResponse }) {
  if (res.status === 'pending') {
    return <EmptyState copy={copyForDayOfWeek(res.reason)} />;
  }
  const { days, busiest_day } = res.data;
  const max = Math.max(...days.map((d) => d.avg_count), 1);
  return (
    <div className="rounded-md bg-bg-secondary px-6 py-6 sm:px-7 sm:py-7">
      <div className="mb-5 flex flex-wrap items-baseline justify-center gap-2 text-center md:justify-between md:text-left">
        <div className="font-serif text-base font-medium tracking-tight">Average heat per weekday</div>
        <div className="text-xs text-text-secondary">
          Strongest:{' '}
          <span className="font-medium text-coral">{DAY_LABELS[busiest_day]}</span>
        </div>
      </div>
      <div className="flex h-36 items-end gap-2 px-1">
        {days.map((d) => {
          const isPeak = d.day_of_week === busiest_day;
          const heightPct = Math.max(6, Math.round((d.avg_count / max) * 92));
          return (
            <div key={d.day_of_week} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`relative w-full max-w-[60px] rounded-sm ${
                  isPeak ? 'bg-coral opacity-100' : 'bg-text-secondary opacity-45'
                }`}
                style={{ height: `${heightPct}%` }}
              >
                <span className="absolute -top-[18px] left-1/2 -translate-x-1/2 whitespace-nowrap font-serif text-[11px] font-medium">
                  {Math.round(d.avg_count)}
                </span>
              </div>
              <div className="text-[11px] tracking-wider text-text-tertiary">
                {DAY_LABELS[d.day_of_week]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ copy }: { copy: EmptyStateCopy }) {
  return (
    <div className="grid grid-cols-1 items-center gap-7 rounded-md bg-bg-secondary px-6 py-6 sm:px-7 sm:py-7 md:[grid-template-columns:1.7fr_1fr]">
      <div className="text-center md:text-left">
        <div className="mb-2.5 flex items-center justify-center gap-3 md:justify-start">
          <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-purple-soft px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-purple-text">
            <span className="h-1 w-1 rounded-full bg-purple animate-pulse-dot" />
            Building
          </span>
          <span className="font-serif text-[17px] font-medium tracking-tight">{copy.title}</span>
        </div>
        <p className="mb-2 font-serif text-base leading-snug">{copy.killerLine}</p>
        <p className="mb-4 text-xs leading-relaxed text-text-secondary">{copy.detail}</p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] uppercase tracking-wider text-text-tertiary md:justify-between">
          <span>
            <span className="font-medium text-text-primary">{copy.progressLabel}</span>
          </span>
          <span>{copy.unlockHint}</span>
        </div>
      </div>
      <div className="flex h-[110px] items-center justify-center rounded-sm border-hairline border-border-strong border-dashed bg-bg-card p-4">
        <svg viewBox="0 0 200 80" className="h-full w-full opacity-35">
          <path
            d="M 10 50 Q 50 40 100 35 Q 150 30 190 25"
            stroke="var(--text-tertiary)"
            strokeDasharray="3 3"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}
