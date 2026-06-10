'use client';

import type { Founding50StatusResponse } from '@heat/contracts';
import { useState } from 'react';

type Mode = 'monthly' | 'yearly';

export function Pricing({ founding50 }: { founding50: Founding50StatusResponse }) {
  const [mode, setMode] = useState<Mode>('yearly'); // default to the locked-rate story
  const [activePlan, setActivePlan] = useState<'free-claim' | 'verified'>('verified');

  const isYearly = mode === 'yearly';
  const price = isYearly ? '€49' : '€79';
  const billed = isYearly ? 'Billed yearly · €588 / year' : 'Billed monthly · cancel any time';
  const jumpToPlan = (planId: 'free-claim' | 'verified') => {
    const el = document.getElementById(planId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActivePlan(planId);
    }
  };

  return (
    <section id="pricing" className="mb-2 rounded-lg border-hairline border-border bg-bg-card px-5 py-7 sm:mb-3 sm:px-8 sm:py-8 md:px-11 md:py-10">
      <div className="mb-6 sm:mb-7">
        <div className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-text-tertiary">
          Pricing
        </div>
        <h2 className="mb-2.5 font-serif text-[23px] font-medium leading-tight tracking-tight sm:text-[26px]">
          Start free. Upgrade when the data starts paying for itself.
        </h2>
        <p className="max-w-lg text-sm leading-relaxed text-text-secondary">
          Free Claim gets you on the map and in control of how you show up. Verified is the
          bundle: data, status, locked rate, Spotlight access.
        </p>
      </div>

      <div className="mb-6 flex justify-center">
        <div className="inline-flex gap-1 rounded-md bg-bg-secondary p-1">
          <button
            onClick={() => setMode('monthly')}
            className={`rounded-md px-5 py-2 text-xs font-medium transition-colors ${
              mode === 'monthly' ? 'bg-bg-card text-text-primary' : 'text-text-secondary'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setMode('yearly')}
            className={`flex items-center gap-2 rounded-md px-5 py-2 text-xs font-medium transition-colors ${
              mode === 'yearly' ? 'bg-bg-card text-text-primary' : 'text-text-secondary'
            }`}
          >
            Yearly
            <span className="rounded-[3px] bg-coral-soft px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-coral-text">
              −38%
            </span>
          </button>
        </div>
      </div>

      <div className="mb-4 flex justify-center md:hidden">
        <div className="inline-flex gap-1 rounded-md border-hairline border-border bg-bg-secondary/70 p-1">
          <button
            onClick={() => jumpToPlan('free-claim')}
            className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors ${
              activePlan === 'free-claim' ? 'bg-bg-card text-text-primary' : 'text-text-secondary'
            }`}
          >
            Free Claim
          </button>
          <button
            onClick={() => jumpToPlan('verified')}
            className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors ${
              activePlan === 'verified' ? 'bg-bg-card text-text-primary' : 'text-text-secondary'
            }`}
          >
            Verified
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Plan
          id="free-claim"
          name="Free Claim"
          tag="Free forever"
          tagClass="bg-teal-soft text-teal-text"
          price="€0"
          per="forever"
          billed="Takes 5 minutes"
          features={[
            { text: 'Tile on the map', has: true },
            { text: 'Control your photos, hours, description', has: true },
            { text: 'Tile views and tap-throughs', has: true },
            { text: 'Verified badge', has: false },
            { text: 'Neighbourhood comparison data', has: false },
            { text: 'Spotlight access', has: false },
          ]}
          ctaLabel="Claim your venue"
          ctaOutline
          mobileFeatureLimit={3}
        />
        <Plan
          id="verified"
          featured
          best="Founding 50"
          name="Verified"
          tag="Bundle"
          tagClass="bg-coral-soft text-coral-text"
          price={price}
          per="/ month"
          strike={isYearly ? '€79' : undefined}
          billed={billed}
          locked={isYearly}
          features={[
            { text: 'Verified badge + Verified surfaces', has: true },
            { text: 'Custom tile · EN/ES/CA', has: true },
            { text: 'Dashboard · 4 data points + tile metrics', has: true },
            { text: 'Neighbourhood comparison line', has: true },
            { text: 'Spotlight access · €80 / event', has: true },
            { text: 'Phase 2 features included at launch', has: true },
          ]}
          ctaLabel="Become Verified"
          mobileFeatureLimit={4}
        />
      </div>
    </section>
  );
}

type Feature = { text: string; has: boolean };

function Plan({
  id,
  name,
  tag,
  tagClass,
  price,
  per,
  strike,
  billed,
  locked,
  features,
  ctaLabel,
  ctaOutline,
  featured,
  best,
  mobileFeatureLimit,
}: {
  id: string;
  name: string;
  tag: string;
  tagClass: string;
  price: string;
  per: string;
  strike?: string;
  billed: string;
  locked?: boolean;
  features: Feature[];
  ctaLabel: string;
  ctaOutline?: boolean;
  featured?: boolean;
  best?: string;
  mobileFeatureLimit: number;
}) {
  const [showAllMobile, setShowAllMobile] = useState(false);
  const mobileFeatures = showAllMobile ? features : features.slice(0, mobileFeatureLimit);
  const canExpandMobile = features.length > mobileFeatureLimit;

  return (
    <div
      id={id}
      className={`relative flex flex-col rounded-lg ${
        featured ? 'border border-coral bg-bg-card' : 'border-hairline border-transparent bg-bg-secondary'
      } scroll-mt-24 p-6 text-center sm:p-8 sm:text-left md:p-9`}
    >
      {best && (
        <span className="absolute right-0 top-0 rounded-bl-md bg-coral px-3 py-1.5 text-[9px] font-medium uppercase tracking-wider text-white">
          {best}
        </span>
      )}
      <div className="mb-1.5 flex items-center justify-center gap-2.5 font-serif text-[18px] font-medium tracking-tight sm:justify-start">
        {name}
        <span className={`rounded-[4px] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider ${tagClass}`}>
          {tag}
        </span>
      </div>
      <div className="mb-3 flex items-baseline justify-center gap-2 sm:justify-start">
        <span className="font-serif text-[44px] font-medium leading-none tracking-tight">{price}</span>
        <span className="text-xs text-text-secondary">{per}</span>
        {strike && <span className="text-sm text-text-tertiary line-through">{strike}</span>}
      </div>
      <div className="mb-1 text-xs text-text-secondary">{billed}</div>
      {locked && (
        <div className="mb-3 text-[11px] font-medium text-coral-text">
          🔒 Locked forever, even after Phase 2
        </div>
      )}
      <ul className="mb-5 mt-3 space-y-2 text-[13px] sm:mb-7">
        {mobileFeatures.map((f) => (
          <li
            key={f.text}
            className={`flex items-center justify-center gap-2 sm:justify-start ${f.has ? '' : 'text-text-tertiary line-through opacity-60'}`}
          >
            <span className={f.has ? 'text-teal' : 'text-text-tertiary'}>{f.has ? '✓' : '−'}</span>
            {f.text}
          </li>
        ))}
      </ul>
      {canExpandMobile && (
        <button
          type="button"
          onClick={() => setShowAllMobile((s) => !s)}
          className="mb-4 self-start text-[12px] font-medium text-text-secondary underline-offset-4 hover:text-text-primary hover:underline md:hidden"
        >
          {showAllMobile ? 'Show fewer features' : `Show all ${features.length} features`}
        </button>
      )}
      <button
        className={`mt-auto rounded-md px-4 py-3 text-sm font-medium ${
          ctaOutline
            ? 'border-hairline border-border bg-bg-card text-text-primary'
            : 'bg-text-primary text-white'
        }`}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
