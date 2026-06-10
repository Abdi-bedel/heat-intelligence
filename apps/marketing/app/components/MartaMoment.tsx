export function MartaMoment() {
  return (
    <section className="mb-2 grid grid-cols-1 overflow-hidden rounded-lg border-hairline border-border bg-bg-card sm:mb-3 md:grid-cols-2">
      <div className="flex flex-col justify-center px-5 py-7 sm:px-8 sm:py-8 md:px-12 md:py-11">
        <div className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-text-tertiary">
          Tuesday morning
        </div>
        <h2 className="mb-6 font-serif text-[23px] font-medium leading-snug tracking-tight sm:mb-7 sm:text-2xl">
          A Tuesday opens. The till report comes in.
        </h2>
        <div className="space-y-4 text-[15px] leading-relaxed text-text-secondary">
          <p className="text-text-primary">
            Monday was quiet. The numbers say it. €1,840 across the bar, two-thirds of last
            Monday, half of the Monday before.
          </p>
          <p>
            So the question is the one every owner asks on a Tuesday morning.{' '}
            <em>Was it me, or was it the city?</em>
          </p>
          <p>The till has no answer for that. It only knows what crossed the counter.</p>
          <p className="font-medium text-text-primary">Heat does. El Born was at 60% of baseline.</p>
        </div>
        <div className="mt-6 border-t-hairline border-border pt-6 font-serif text-lg font-medium leading-snug">
          The till is honest. It is also <span className="text-coral">blind</span>.
        </div>
      </div>

      <div className="flex flex-col justify-center gap-3.5 bg-bg-secondary p-5 sm:p-7 md:p-9">
        <div className="rounded-md border-hairline border-border bg-bg-card px-5 py-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              Till report · Monday
            </span>
            <span className="text-[10px] text-text-tertiary">Tue 09:14</span>
          </div>
          <TillRow label="Bar revenue" value="€1,840" delta="−34%" />
          <TillRow label="Covers" value="62" delta="−28%" />
          <TillRow label="Avg. spend" value="€29.70" />
        </div>
        <div className="rounded-r-md border-l-2 border-border-strong bg-bg-card px-4 py-3 text-[13px] italic text-text-secondary">
          Was it me, or was it the whole neighbourhood?
        </div>
        <div className="rounded-md border-hairline border-border bg-bg-card px-5 py-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              Heat · El Born · Monday
            </span>
            <span className="text-[10px] text-text-tertiary">Tue 09:15</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="min-w-[64px] font-serif text-[32px] font-medium leading-none tracking-tight text-coral">
              60%
            </div>
            <div className="text-[13px] leading-relaxed">
              of the average heat for bars in El Born this week.
              <br />
              <span className="text-text-secondary">The whole neighbourhood was quiet. Not just you.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TillRow({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b-hairline border-border py-1.5 text-[13px] last:border-b-0">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium">
        {value}
        {delta && <span className="ml-1.5 text-[11px] text-coral">{delta}</span>}
      </span>
    </div>
  );
}
