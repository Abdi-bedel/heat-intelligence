import type { Founding50StatusResponse } from '@heat/contracts';

export function Footer({ founding50 }: { founding50: Founding50StatusResponse }) {
  return (
    <section className="mb-2 rounded-lg border-hairline border-border bg-bg-card px-5 py-7 sm:mb-3 sm:px-8 sm:py-8 md:px-11 md:py-10">
      <div className="rounded-lg bg-bg-secondary px-5 py-7 sm:px-7 sm:py-8 md:px-9 md:py-10">
        <div className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-text-tertiary">
          Closing
        </div>
        <p className="font-serif text-[28px] font-medium leading-snug tracking-tight">
          {founding50.claimed} venues claimed. {founding50.remaining} left.{' '}
          <span className="text-text-secondary">After 50, the rate goes up.</span>
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button className="rounded-md bg-text-primary px-5 py-3 text-sm font-medium text-white">
            Claim your venue
          </button>
          <a className="cursor-pointer text-[13px] text-text-secondary transition-colors hover:text-text-primary">
            Email us instead →
          </a>
        </div>
        <div className="mt-5 inline-flex items-center gap-2 text-xs text-text-tertiary">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-coral" />
          <span>2,847 users on Heat in Barcelona right now</span>
        </div>
      </div>

      <div className="mt-6 hidden md:block">
        <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-text-tertiary">
          What&apos;s coming
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Step now when="May 2026 · Now" what="Founding 50 opens" detail="Verified badge, dashboard, Spotlight access." />
          <Step when="June 2026" what="Self-service dashboard" detail="Login portal, four data points, tile metrics." />
          <Step when="October 2026" what="Phase 2 ships" detail="Real-time, neighbourhood overview, crowd composition." />
          <Step when="2027" what="Groups & Enterprise" detail="Multi-venue dashboards, second-city expansion." />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 border-t-hairline border-border pt-6 md:mt-10 md:grid-cols-4 md:gap-8 md:pt-8">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="font-serif text-xl font-medium tracking-tight">Heat</span>
            <span className="rounded-[3px] border-hairline border-border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-text-secondary">
              Intelligence
            </span>
          </div>
          <p className="text-xs leading-relaxed text-text-secondary">
            Live where Barcelona&apos;s going out tonight. The intelligence layer for venues.
          </p>
          <div className="mt-4 text-[10px] uppercase tracking-wider text-text-tertiary">
            See Heat in action
          </div>
          <div className="mt-2 flex gap-2">
            <a className="cursor-pointer rounded-md border-hairline border-border bg-bg px-3 py-1.5 text-[11px]">App Store</a>
            <a className="cursor-pointer rounded-md border-hairline border-border bg-bg px-3 py-1.5 text-[11px]">Google Play</a>
          </div>
        </div>
        <Col title="Product" links={['How it works', 'Pricing', 'Spotlight', 'FAQ']} />
        <Col className="hidden md:block" title="Company" links={['About', 'The Founding 50', 'Press', 'Contact']} />
        <Col className="hidden md:block" title="For venues" links={['Login', 'Claim your venue', 'Book a call', 'Support']} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t-hairline border-border pt-5 text-[11px] text-text-tertiary">
        <span>© 2026 Heat. Built in Barcelona.</span>
        <div className="flex gap-4">
          <a className="cursor-pointer hover:text-text-primary">Privacy</a>
          <a className="cursor-pointer hover:text-text-primary">Terms</a>
          <a className="cursor-pointer hover:text-text-primary">Brand</a>
        </div>
      </div>
    </section>
  );
}

function Step({
  when,
  what,
  detail,
  now,
}: {
  when: string;
  what: string;
  detail: string;
  now?: boolean;
}) {
  return (
    <div className={`rounded-md ${now ? 'bg-coral-soft' : 'bg-bg-secondary'} px-4 py-4`}>
      <div className={`mb-1.5 text-[10px] font-medium uppercase tracking-wider ${now ? 'text-coral-text' : 'text-text-tertiary'}`}>
        {when}
      </div>
      <div className="mb-1 font-serif text-sm font-medium tracking-tight">{what}</div>
      <p className="text-[11px] leading-relaxed text-text-secondary">{detail}</p>
    </div>
  );
}

function Col({ title, links, className }: { title: string; links: string[]; className?: string }) {
  return (
    <div className={className}>
      <h4 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
        {title}
      </h4>
      <ul className="space-y-2 text-[13px]">
        {links.map((l) => (
          <li key={l}>
            <a className="cursor-pointer text-text-secondary hover:text-text-primary">{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
