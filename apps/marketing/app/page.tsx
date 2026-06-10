import { Bundle } from './components/Bundle';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { LiveActivity } from './components/LiveActivity';
import { MartaMoment } from './components/MartaMoment';
import { Nav } from './components/Nav';
import { Pricing } from './components/Pricing';
import { UseCases } from './components/UseCases';
import { WhyNow } from './components/WhyNow';
import { fetchFounding50, fetchLiveCounts } from '@/lib/api';

export default async function MarketingPage() {
  // Fetch in parallel; degrade gracefully if the API isn't running locally.
  const [liveCounts, founding50] = await Promise.all([
    fetchLiveCounts().catch(() => null),
    fetchFounding50().catch(() => null),
  ]);

  const fallbackFounding = founding50 ?? { cap: 50 as const, claimed: 19, remaining: 31, closed_at: null };

  return (
    <main className="landing-shell mx-auto max-w-[1200px] px-3 py-4 pb-12 sm:px-5 sm:py-6 sm:pb-16 md:px-6 md:py-8 md:pb-20">
      <Nav />
      <Hero
        initialUsers={liveCounts?.total_users ?? 2847}
        initialVenues={liveCounts?.neighbourhoods.filter((n) => n.tier === 'hot').length ?? 2}
      />
      {liveCounts ? (
        <LiveActivity initial={liveCounts} />
      ) : (
        <div className="mb-2 rounded-lg border-hairline border-border bg-bg-card px-5 py-6 text-center text-text-tertiary sm:mb-3 sm:px-8 sm:py-7 md:px-11 md:py-8">
          Live activity unavailable — start the API on :8787 to populate.
        </div>
      )}
      <MartaMoment />
      <Bundle />
      <UseCases />
      <Pricing founding50={fallbackFounding} />
      <WhyNow />
      <FAQ />
      <Footer founding50={fallbackFounding} />
    </main>
  );
}
