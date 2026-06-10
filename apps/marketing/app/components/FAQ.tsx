const FAQS: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: 'Do I have to pay to be on Heat?',
    a: 'No. Free Claim is free. You get a tile on the map, basic content control, and the Verified label only if you upgrade. Most venues stay on Free Claim. Some upgrade because the data is worth it.',
  },
  {
    q: 'How is this different from my POS analytics?',
    a: (
      <>
        Your till tells you what happened inside your venue. Heat tells you what was happening{' '}
        <span className="font-medium text-coral">everywhere else</span>. The two together give you
        context your till has never had — whether last Monday was your problem or the whole
        neighbourhood&apos;s.
      </>
    ),
  },
  {
    q: 'When will I see useful data?',
    a: (
      <>
        Tile views and tap-throughs are useful from <strong className="font-medium">day one</strong>. The
        neighbourhood comparison line needs at least 10 venues with sufficient activity in your
        neighbourhood — most central neighbourhoods will hit this in the first few weeks.
        Day-of-week patterns unlock at <strong className="font-medium">4 weeks</strong>. We&apos;ll tell
        you exactly where you are in the journey on every empty state.
      </>
    ),
  },
  {
    q: 'What happens at Phase 2 in October?',
    a: (
      <>
        Standard tier launches at €199/month.{' '}
        <strong className="font-medium">
          If you&apos;re on a Founding 50 annual contract, your €49 rate is locked forever
        </strong>{' '}
        and Standard features are included. If you&apos;re on month-to-month, you&apos;ll get one
        chance to lock €49 by switching to annual, or you move to €199.
      </>
    ),
  },
  {
    q: 'Can I cancel?',
    a: 'Month-to-month cancels any time. Annual contracts run the full term. The whole point of the locked rate is the commitment — that’s how it stays €49 forever.',
  },
  {
    q: 'Will my competitors see my data?',
    a: 'No. The dashboard only shows your own data. Comparison data is aggregated across the neighbourhood — never broken out by individual venue. We have privacy floors specifically designed to prevent reverse-engineering of any single venue’s performance.',
  },
  {
    q: 'How many Heat users are there really?',
    a: (
      <>
        The number at the top of this page is real and current.{' '}
        <strong className="font-medium">Don&apos;t trust us — watch it tick.</strong> It&apos;s pulled
        from the live consumer app. Every Heat user shown there is a person currently logged in
        and active in Barcelona.
      </>
    ),
  },
  {
    q: 'Can I pay you to rank higher?',
    a: (
      <>
        No. The live heat score is invariant — no payment, claim status, or commercial
        relationship changes it. If you&apos;re hot, you show as hot. If you&apos;re quiet, no amount
        of money makes you hot.{' '}
        <strong className="font-medium">This is non-negotiable</strong>, written into the product
        architecture and the privacy policy. It&apos;s the whole reason the map is worth looking at.
      </>
    ),
  },
];

export function FAQ() {
  return (
    <section id="faq" className="mb-2 rounded-lg border-hairline border-border bg-bg-card px-5 py-7 sm:mb-3 sm:px-8 sm:py-8 md:px-11 md:py-10">
      <div className="mb-6 sm:mb-7">
        <div className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-text-tertiary">
          Common questions
        </div>
        <h2 className="mb-2.5 font-serif text-[23px] font-medium leading-tight tracking-tight sm:text-[26px]">
          The eight things venue owners actually ask.
        </h2>
        <p className="max-w-lg text-sm leading-relaxed text-text-secondary">
          No hedging. Some answers are uncomfortable. We&apos;d rather tell you now than on a
          sales call.
        </p>
      </div>

      <div className="divide-y-hairline divide-border">
        {FAQS.map((item) => (
          <details key={item.q} className="group py-4 sm:py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-serif text-[16px] font-medium tracking-tight">
              <span>{item.q}</span>
              <span className="text-xl text-text-tertiary transition-transform group-open:rotate-45 group-hover:text-coral">
                +
              </span>
            </summary>
            <div className="mt-3 max-w-3xl text-[13px] leading-relaxed text-text-secondary">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
