export function Bundle() {
  return (
    <section id="bundle" className="mb-2 rounded-lg border-hairline border-border bg-bg-card px-5 py-7 sm:mb-3 sm:px-8 sm:py-8 md:px-11 md:py-10">
      <div className="mb-6 sm:mb-8">
        <div className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-text-tertiary">
          The bundle
        </div>
        <h2 className="mb-2.5 font-serif text-[23px] font-medium leading-tight tracking-tight sm:text-[26px]">
          One subscription. Four layers.
        </h2>
        <p className="max-w-lg text-sm leading-relaxed text-text-secondary">
          Sold as one thing for €49 a month. Behind it, four ways Heat shows up for your venue.
        </p>
      </div>

      <div className="-mx-1 overflow-x-auto pb-1 md:mx-0 md:overflow-visible md:pb-0">
        <div className="flex gap-3 md:grid md:grid-cols-2 md:gap-2 xl:grid-cols-4">
          <Layer
          n="01"
          name="Visibility"
          desc="Verified badge on your tile, visible to users. Custom photos, hours, description in EN/ES/CA. Inclusion in Verified surfaces."
        >
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-md border-hairline border-border bg-bg-card px-3 py-2 text-[11px]">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal text-[10px] text-white">✓</span>
              <span className="font-medium">Bar Marsella</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-[3px] bg-teal-soft px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-teal-text">
              <span className="h-1 w-1 rounded-full bg-teal" />
              Verified
            </span>
          </div>
          </Layer>

          <Layer
          n="02"
          name="Data"
          desc="A login portal at venues.getheatapp.com. Four data points plus tile metrics. Updated nightly."
        >
          <div className="w-[88%] space-y-1">
            {[
              ['This week', '412', 'text-text-primary'],
              ['vs. baseline', '+18%', 'text-teal'],
              ['El Born avg.', '347', 'text-text-primary'],
            ].map(([k, v, color]) => (
              <div
                key={k}
                className="flex items-center justify-between border-b-hairline border-border py-1 text-[10px] text-text-secondary last:border-b-0"
              >
                <span>{k}</span>
                <span className={`text-[11px] font-medium tabular-nums ${color}`}>{v}</span>
              </div>
            ))}
          </div>
          </Layer>

          <Layer
          n="03"
          name="Founding 50"
          desc="Locked €49/mo annual rate forever. Identity as one of the first 50. Priority access to Phase 2 in October."
        >
          <div className="flex w-[86%] flex-col gap-2">
            <div className="flex items-center justify-between text-[10px]">
              <span>
                <span className="font-medium tabular-nums">19</span>
                <span className="text-text-tertiary"> / 50</span>
              </span>
              <span className="text-[11px] font-medium text-coral">€49</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-sm bg-bg-secondary">
              <div className="h-full bg-coral" style={{ width: '38%' }} />
            </div>
            <div className="text-center text-[9px] uppercase tracking-wider text-text-tertiary">
              Locked forever
            </div>
          </div>
          </Layer>

          <Layer
          n="04"
          name="Promote"
          desc="Eligibility to buy Spotlight. €80 per event. 50–150 high-relevance users near your venue, 90-min window."
        >
          <div className="relative h-[90px] w-full">
            <div
              className="absolute left-1/2 top-1/2 h-[70px] w-[100px] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(216, 90, 48, 0.18) 0%, rgba(216, 90, 48, 0) 70%)',
              }}
            />
            <div className="absolute left-1/2 top-1/2 z-[2] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-coral" />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] tracking-wider text-text-tertiary">
              90-min window
            </div>
          </div>
          </Layer>
        </div>
      </div>
    </section>
  );
}

function Layer({
  n,
  name,
  desc,
  children,
}: {
  n: string;
  name: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[280px] min-w-[260px] flex-col overflow-hidden rounded-md bg-bg-secondary px-5 pt-5 md:min-w-0">
      <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-text-tertiary">
        {n}
      </div>
      <div className="mb-2 font-serif text-[17px] font-medium tracking-tight">{name}</div>
      <p className="mb-5 text-xs leading-relaxed text-text-secondary">{desc}</p>
      <div className="-mx-5 mt-auto flex h-[120px] items-center justify-center rounded-t-md border-t-hairline border-border bg-bg-card">
        {children}
      </div>
    </div>
  );
}
