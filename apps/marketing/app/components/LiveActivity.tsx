'use client';

import type { LiveCountsResponse } from '@heat/contracts';
import { useEffect, useState } from 'react';

const TIER_CLASS = {
  hot: 'bg-coral-soft text-coral-text',
  warming: 'bg-amber-soft text-amber-text',
  ambient: 'bg-purple-soft text-purple-text',
} as const;

const TIER_LABEL = {
  hot: 'Hot',
  warming: 'Warming',
  ambient: 'Ambient',
} as const;

export function LiveActivity({ initial }: { initial: LiveCountsResponse }) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8787';
        const res = await fetch(`${base}/v1/public/live-counts`, { cache: 'no-store' });
        if (res.ok) setData(await res.json());
      } catch {
        // network blip — keep the last good data on screen
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="mb-2 rounded-lg border-hairline border-border bg-bg-card px-5 py-7 sm:mb-3 sm:px-8 sm:py-8 md:px-11 md:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
        <div>
          <div className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-text-tertiary">
            Live activity
          </div>
          <h2 className="mb-2.5 font-serif text-[26px] font-medium leading-tight tracking-tight">
            Right now, across Barcelona.
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-text-secondary">
            This isn&apos;t a forecast or a stock screenshot. These are the people on Heat, in
            the city, this minute.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border-hairline border-border bg-bg-secondary px-3.5 py-2 text-[11px] uppercase tracking-wider text-text-secondary">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-coral" />
          <span>Live</span>
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto pb-1 md:mx-0 md:overflow-visible md:pb-0">
        <div className="flex gap-3 md:grid md:[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
          {data.neighbourhoods.map((n) => (
            <div
              key={n.name}
              className="flex min-h-[205px] min-w-[220px] flex-col rounded-md bg-bg-secondary px-5 py-5 sm:px-6 sm:py-6 md:min-h-[220px] md:min-w-0"
            >
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-[13px] font-medium">{n.name}</span>
                <span
                  className={`rounded-[4px] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] ${TIER_CLASS[n.tier]}`}
                >
                  {TIER_LABEL[n.tier]}
                </span>
              </div>
              <div className="font-serif text-[28px] font-medium leading-[1.1] tracking-tight tabular-nums">
                {n.users_now.toLocaleString()}
              </div>
              <div className="text-[11px] text-text-tertiary">users out now</div>
              <Spark values={n.sparkline_15min} tier={n.tier} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t-hairline border-border pt-4 text-[11px] text-text-tertiary">
        <span>
          <span className="font-serif text-sm font-medium text-text-primary">
            {data.total_users.toLocaleString()}
          </span>{' '}
          people on Heat in Barcelona right now
        </span>
        <span>Sample reading · Numbers refresh every 5 seconds</span>
      </div>
    </section>
  );
}

function Spark({ values, tier }: { values: number[]; tier: 'hot' | 'warming' | 'ambient' }) {
  const stroke = tier === 'hot' ? 'var(--coral)' : tier === 'warming' ? 'var(--amber)' : 'var(--purple)';
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${26 - ((v - min) / range) * 19}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="mt-auto h-8 w-full pt-4">
      <polyline fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" points={points} />
    </svg>
  );
}
