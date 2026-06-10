type Tag = 'tonight' | 'week' | 'month';

const CASES: Array<{
  tag: Tag;
  q: string;
  a: React.ReactNode;
}> = [
  {
    tag: 'tonight',
    q: 'Is it me, or is the whole neighbourhood quiet?',
    a: <>El Born is at <span className="font-medium text-coral">60% of baseline</span> tonight. It&apos;s not you.</>,
  },
  {
    tag: 'tonight',
    q: 'Should I extend the kitchen or close early?',
    a: <>El Born is at <span className="font-medium text-teal">1.4× baseline</span> and rising. Keep the kitchen open.</>,
  },
  {
    tag: 'week',
    q: 'Which night am I underperforming on?',
    a: <>Your <span className="font-medium text-text-primary">Wednesdays</span> are pulling <span className="font-medium text-coral">−22% behind</span> bars like yours.</>,
  },
  {
    tag: 'week',
    q: 'When should I run my next event?',
    a: <>Tuesdays are flat in El Born. Sparse competition. Lower-cost slot.</>,
  },
  {
    tag: 'month',
    q: 'Am I drifting against my neighbourhood?',
    a: <>Down <span className="font-medium text-coral">−12%</span> against El Born over the last 4 weeks. Wasn&apos;t yet.</>,
  },
  {
    tag: 'month',
    q: "Where's the foot traffic actually coming from?",
    a: <>Tile views breakdown. Tap-throughs to hours, directions, website.</>,
  },
];

const TAG_CLASS: Record<Tag, string> = {
  tonight: 'bg-coral-soft text-coral-text',
  week: 'bg-amber-soft text-amber-text',
  month: 'bg-purple-soft text-purple-text',
};

const TAG_LABEL: Record<Tag, string> = {
  tonight: 'Tonight',
  week: 'This week',
  month: 'Next month',
};

const TAG_ORDER: Tag[] = ['tonight', 'week', 'month'];

export function UseCases() {
  return (
    <section className="mb-2 rounded-lg border-hairline border-border bg-bg-card px-5 py-7 sm:mb-3 sm:px-8 sm:py-8 md:px-11 md:py-10">
      <div className="mb-6 sm:mb-7">
        <div className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-text-tertiary">
          Use cases
        </div>
        <h2 className="mb-2.5 font-serif text-[23px] font-medium leading-tight tracking-tight sm:text-[26px]">
          Six questions you can answer with Heat.
        </h2>
        <p className="max-w-lg text-sm leading-relaxed text-text-secondary">
          Organised by time horizon. From the call you&apos;re making right now to the drift
          you can&apos;t see yet.
        </p>
      </div>

      <div className="mb-5 hidden items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-text-tertiary md:flex">
        <span>Tonight</span>
        <div className="relative h-px flex-1 bg-border">
          <span className="absolute -top-1 left-0 h-2 w-2 rounded-full bg-border-strong" />
          <span className="absolute -top-1 right-0 h-2 w-2 rounded-full bg-border-strong" />
        </div>
        <span>This week</span>
        <div className="relative h-px flex-1 bg-border">
          <span className="absolute -top-1 left-0 h-2 w-2 rounded-full bg-border-strong" />
          <span className="absolute -top-1 right-0 h-2 w-2 rounded-full bg-border-strong" />
        </div>
        <span>Next month</span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {TAG_ORDER.map((tag) => (
          <div key={tag} className="space-y-4">
            {CASES.filter((c) => c.tag === tag).map((c) => (
              <article
                key={c.q}
                className="flex h-full flex-col rounded-md bg-bg-secondary px-6 py-6 text-center transition-transform hover:-translate-y-px hover:bg-bg-card sm:px-7 sm:py-7 md:text-left"
              >
                <span
                  className={`mx-auto mb-4 inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider md:mx-0 ${TAG_CLASS[c.tag]}`}
                >
                  {c.tag === 'tonight' && (
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-coral" />
                  )}
                  {TAG_LABEL[c.tag]}
                </span>
                <p className="mb-4 font-serif text-[18px] font-medium leading-[1.3] tracking-tight">
                  {c.q}
                </p>
                <div className="mb-4 h-px bg-border" />
                <p className="text-[15px] leading-[1.55] text-text-secondary">{c.a}</p>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
