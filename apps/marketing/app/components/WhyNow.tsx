const REASONS = [
  {
    n: '01',
    title: 'The cap is real',
    desc: (
      <>
        50 venues. Not 50-ish. When it&apos;s gone, it&apos;s gone.{' '}
        <strong className="font-medium text-text-primary">19 claimed, 31 left.</strong>
      </>
    ),
  },
  {
    n: '02',
    title: 'The rate is locked',
    desc: '€49 a month forever, even after Phase 2 takes the standard rate to €199. Annual commitment, locked rate.',
  },
  {
    n: '03',
    title: 'Your tile is already there',
    desc: 'Heat already lists Barcelona venues. Free Claim takes 5 minutes. You control how you show up.',
  },
  {
    n: '04',
    title: 'Phase 2 ships in October',
    desc: 'Real-time, neighbourhood overview, crowd composition. Founding 50 keeps the €49 rate and gets it included.',
  },
];

export function WhyNow() {
  return (
    <section className="mb-2 rounded-lg border-hairline border-border bg-bg-card px-5 py-7 sm:mb-3 sm:px-8 sm:py-8 md:px-11 md:py-10">
      <div className="mb-6 sm:mb-7">
        <div>
          <div className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-text-tertiary">
            Why now
          </div>
          <h2 className="mb-2.5 font-serif text-[23px] font-medium leading-tight tracking-tight sm:text-[26px]">
            Four reasons to claim before October.
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-text-secondary">
            The cap is real, the rate is locked, the tile is already there, and Phase 2 ships
            in 5 months.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {REASONS.map((r) => (
          <div
            key={r.n}
            className="flex items-center gap-4 rounded-md bg-bg-secondary px-6 py-5 text-center sm:items-start sm:gap-5 sm:text-left"
          >
            <div className="font-serif text-[28px] font-medium leading-none tracking-tight text-text-tertiary">
              {r.n}
            </div>
            <div className="flex-1">
              <div className="mb-1 font-serif text-[17px] font-medium tracking-tight">
                {r.title}
              </div>
              <p className="text-[13px] leading-relaxed text-text-secondary">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
