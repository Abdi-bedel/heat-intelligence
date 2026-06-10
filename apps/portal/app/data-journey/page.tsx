// Placeholder explainer linked from the Day-1 dashboard ribbon.
// Final copy comes from Abdi — replace inline below when ready.
import Link from 'next/link';

export default function DataJourneyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-xs uppercase tracking-wider text-text-tertiary hover:text-text-primary">
        ← Back to dashboard
      </Link>
      <h1 className="mt-6 font-serif text-4xl font-medium leading-tight tracking-tight">
        Your data journey.
      </h1>
      <p className="mt-3 text-text-secondary">
        Here&apos;s what unlocks, when, and why we wait.
      </p>

      <Section
        when="Day 1"
        title="Tile metrics live immediately"
        body="As soon as your tile is live in the consumer app, you'll see views and tap-throughs in the dashboard. These are direct counts — every view, every tap to your hours, directions, or website."
      />
      <Section
        when="Day 7"
        title="Check-in count this week"
        body="We hold the headline check-in number until you've completed your first full week. Tiny early counts are misleading and we'd rather not show you a number that could swing 100% on Tuesday."
      />
      <Section
        when="Week 4"
        title="Peak hours and day-of-week patterns"
        body="Pattern data needs four full weeks to filter out one-off events — a band, a public holiday, a power cut. The cells will look thin in Week 1, fair in Week 4. We tell you exactly where you are."
      />
      <Section
        when="When density allows"
        title="Neighbourhood comparison"
        body="The killer line — 'You're at X% of the average heat for bars in El Born this week' — only unlocks when there are at least 10 venues with 20+ check-ins each in your neighbourhood. Until then, it stays empty. No backfilled estimates, no synthetic numbers."
      />

      <p className="mt-12 border-t-hairline border-border pt-8 text-sm text-text-secondary">
        Questions? Email <a className="text-coral hover:underline" href="mailto:support@getheatapp.com">support@getheatapp.com</a>.
      </p>
    </main>
  );
}

function Section({ when, title, body }: { when: string; title: string; body: string }) {
  return (
    <section className="mt-10">
      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-coral-text">
        {when}
      </div>
      <h2 className="mb-2 font-serif text-2xl font-medium tracking-tight">{title}</h2>
      <p className="text-[15px] leading-relaxed text-text-secondary">{body}</p>
    </section>
  );
}
