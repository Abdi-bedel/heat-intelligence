'use client';

import { useEffect, useState } from 'react';
import { HeroScene } from './HeroScenes';

const SCENES = [
  {
    reading: (
      <>
        You&apos;re at <span className="font-medium text-coral">60% of the average heat</span>{' '}
        for bars in <span className="font-medium">El Born</span> this week.
      </>
    ),
  },
  {
    reading: (
      <>
        Tonight, <span className="font-medium">El Born</span> is at{' '}
        <span className="font-medium text-coral">1.4× its normal Tuesday baseline</span>.
      </>
    ),
  },
  {
    reading: (
      <>
        Your <span className="font-medium">Thursdays</span> are pulling{' '}
        <span className="font-medium text-teal">+18%</span> ahead of bars like yours.
      </>
    ),
  },
  {
    reading: (
      <>
        You&apos;re drifting. Down{' '}
        <span className="font-medium text-amber-text">−12%</span> against your neighbourhood
        over the last 4 weeks.
      </>
    ),
  },
];

const DURATION = 7000;

export function Hero({ initialUsers, initialVenues }: { initialUsers: number; initialVenues: number }) {
  const [scene, setScene] = useState(0);
  const [users, setUsers] = useState(initialUsers);
  const [venues, setVenues] = useState(initialVenues);
  const [time, setTime] = useState('');

  // Time tick
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  // Carousel auto-advance
  useEffect(() => {
    const id = setInterval(() => setScene((s) => (s + 1) % SCENES.length), DURATION);
    return () => clearInterval(id);
  }, []);

  // Live ticker
  useEffect(() => {
    const id = setInterval(() => {
      setUsers((u) => Math.max(2700, Math.min(3100, u + Math.floor(Math.random() * 7) - 2)));
    }, 1800);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.6) {
        setVenues((v) => Math.max(18, Math.min(31, v + (Math.random() > 0.5 ? 1 : -1))));
      }
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="mb-2 grid grid-cols-1 overflow-hidden rounded-lg border-hairline border-border bg-bg-card sm:mb-3 md:min-h-[540px] md:[grid-template-columns:1fr_1.05fr]">
      {/* LEFT */}
      <div className="flex flex-col justify-between p-6 sm:p-8 md:p-10">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-text-secondary sm:mb-6">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-coral" />
            <span>Live · Barcelona · {time}</span>
          </div>
          <h1 className="mb-4 font-serif text-[32px] font-medium leading-[1.1] tracking-tight sm:mb-5 sm:text-[36px] md:text-4xl">
            Your till tells you what happened inside.
            <br />
            <span className="text-text-secondary">
              Heat tells you what was happening everywhere else.
            </span>
          </h1>
          <p className="mb-5 max-w-md text-[15px] leading-relaxed text-text-secondary sm:mb-7">
            Live where Barcelona&apos;s going out tonight. Comparison data on how your venue
            stacks up. €49 a month, locked forever for the first 50 venues.
          </p>
          <div className="mb-6 flex flex-wrap items-center gap-3.5 sm:mb-8">
            <button className="rounded-md bg-text-primary px-5 py-3 text-sm font-medium text-white">
              Claim your venue
            </button>
            <a className="cursor-pointer text-[13px] text-text-secondary transition-colors hover:text-text-primary">
              See it live →
            </a>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 border-t-hairline border-border pt-5 sm:flex sm:gap-7">
          <div>
            <div className="font-serif text-[22px] font-medium tracking-tight tabular-nums">
              {users.toLocaleString()}
            </div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-text-tertiary">
              Users out now
            </div>
          </div>
          <div>
            <div className="font-serif text-[22px] font-medium tracking-tight tabular-nums">
              {venues}
            </div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-text-tertiary">
              Venues hot
            </div>
          </div>
          <div>
            <div className="font-serif text-[22px] font-medium tracking-tight tabular-nums">
              19<span className="font-normal text-text-tertiary">/50</span>
            </div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-text-tertiary">
              Founding spots
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — carousel */}
      <div className="flex flex-col overflow-hidden bg-bg-secondary p-5 sm:p-6 md:p-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-text-tertiary">
            Sample readings · From the dashboard
          </div>
          <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
            <span>{scene + 1}/{SCENES.length}</span>
            <button
              onClick={() => setScene((s) => (s - 1 + SCENES.length) % SCENES.length)}
              aria-label="Previous"
              className="rounded-md border-hairline border-border px-2 py-1 hover:text-text-primary"
            >
              ‹
            </button>
            <button
              onClick={() => setScene((s) => (s + 1) % SCENES.length)}
              aria-label="Next"
              className="rounded-md border-hairline border-border px-2 py-1 hover:text-text-primary"
            >
              ›
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <p className="mb-4 font-serif text-[20px] leading-snug tracking-tight sm:mb-5 sm:text-[22px]">
            {SCENES[scene]!.reading}
          </p>
          <div className="flex flex-1 items-center justify-center">
            <div className="h-[180px] w-full sm:h-[220px]" key={scene}>
              <HeroScene index={scene} />
            </div>
          </div>
        </div>

        <div className="mt-auto flex gap-1.5 pt-5">
          {SCENES.map((_, i) => (
            <button
              key={i}
              onClick={() => setScene(i)}
              className="h-0.5 flex-1 cursor-pointer overflow-hidden rounded-sm bg-border"
            >
              <div
                className="h-full bg-text-primary transition-[width]"
                style={{
                  width: i < scene ? '100%' : i === scene ? '0%' : '0%',
                  animation: i === scene ? 'progress 7s linear forwards' : 'none',
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
      `}</style>
    </section>
  );
}
