// Source-of-events interface — the contract between the cron and the consumer app.
//
// The cron NEVER reads consumer-app tables directly. It calls these methods,
// which today are stubbed and throw a helpful error, and tomorrow proxy to the
// consumer-app internal API once Abdi shares its spec (E7).
//
// Keeping it behind an interface means swapping `StubSource` for `HttpSource`
// is one line in cron/recompute.ts.

export type ConsumerCheckIn = {
  venue_id: string;       // canonical venue id (matches our venues table)
  occurred_at: string;    // ISO8601 UTC
};

export type ConsumerEngagementEvent = {
  venue_id: string;
  type: 'tile_view' | 'tap_hours' | 'tap_directions' | 'tap_website';
  occurred_at: string;
};

export type LiveCount = {
  neighbourhood: string;
  users_now: number;
  sparkline_15min: number[]; // 12 buckets of 75s each
};

export interface ConsumerEventsSource {
  /** Check-in events between the half-open interval [from, to). */
  fetchCheckIns(from: Date, to: Date, venueIds?: string[]): Promise<ConsumerCheckIn[]>;

  /** Tile views + tap-throughs in the same interval. */
  fetchEngagementEvents(
    from: Date,
    to: Date,
    venueIds?: string[]
  ): Promise<ConsumerEngagementEvent[]>;

  /** Per-neighbourhood live counts. Drives /v1/public/live-counts. */
  fetchLiveCounts(): Promise<LiveCount[]>;
}

// ─── Stub: throws everywhere with a clear "configure E7" message ─────────────
class StubSource implements ConsumerEventsSource {
  private fail(method: string): never {
    throw new Error(
      `[ConsumerEventsSource.${method}] not configured. ` +
        `Set CONSUMER_API_BASE_URL + CONSUMER_API_INTERNAL_TOKEN, then swap to HttpSource in cron/recompute.ts.`
    );
  }
  async fetchCheckIns(_from: Date, _to: Date, _venueIds?: string[]): Promise<ConsumerCheckIn[]> {
    this.fail('fetchCheckIns');
  }
  async fetchEngagementEvents(
    _from: Date,
    _to: Date,
    _venueIds?: string[]
  ): Promise<ConsumerEngagementEvent[]> {
    this.fail('fetchEngagementEvents');
  }
  async fetchLiveCounts(): Promise<LiveCount[]> {
    this.fail('fetchLiveCounts');
  }
}

// ─── HTTP impl — paths match heat-app/docs/api/openapi.yaml `/b2b/v1/...` ────
//
// Authentication contract (per b2b_contracts.md):
//   Authorization: Bearer <HEAT_APP_B2B_TOKEN>
//   X-Heat-B2B-Client: <HEAT_APP_B2B_CLIENT_NAME>   // default: "heat-intelligence"
//
// All read endpoints follow cursor pagination. fetchCheckIns / fetchEngagementEvents
// auto-page until the cursor goes null so the cron sees a complete window.
class HttpSource implements ConsumerEventsSource {
  constructor(
    private baseUrl: string,
    private token: string,
    private clientName: string
  ) {}

  private headers() {
    return {
      authorization: `Bearer ${this.token}`,
      'x-heat-b2b-client': this.clientName,
      'content-type': 'application/json',
    };
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers() });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`heat-app B2B ${res.status} for ${path}: ${body.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  }

  private async pageAll<T>(pathBase: string): Promise<T[]> {
    type CursorPage<TItem> = {
      events: TItem[];
      next_cursor: string | null;
    };
    const all: T[] = [];
    let cursor: string | null = null;
    let hops = 0;
    do {
      const sep = pathBase.includes('?') ? '&' : '?';
      const pageUrl = cursor ? `${pathBase}${sep}cursor=${encodeURIComponent(cursor)}` : pathBase;
      const page: CursorPage<T> = await this.get<CursorPage<T>>(pageUrl);
      all.push(...page.events);
      cursor = page.next_cursor ?? null;
      hops++;
      if (hops > 200) throw new Error(`pagination runaway on ${pathBase} after ${hops} hops`);
    } while (cursor);
    return all;
  }

  async fetchCheckIns(from: Date, to: Date, venueIds?: string[]): Promise<ConsumerCheckIn[]> {
    const q = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    if (venueIds?.length) q.set('venue_ids', venueIds.join(','));
    return this.pageAll<ConsumerCheckIn>(`/b2b/v1/check-ins?${q}`);
  }

  async fetchEngagementEvents(
    from: Date,
    to: Date,
    venueIds?: string[]
  ): Promise<ConsumerEngagementEvent[]> {
    const q = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    if (venueIds?.length) q.set('venue_ids', venueIds.join(','));
    return this.pageAll<ConsumerEngagementEvent>(`/b2b/v1/engagement-events?${q}`);
  }

  async fetchLiveCounts(): Promise<LiveCount[]> {
    // Response shape per openapi B2BLiveCountsResponse — flatten to LiveCount[].
    type Resp = {
      neighbourhoods: Array<{
        name: string;
        users_now: number;
        sparkline_15min: number[];
      }>;
    };
    const res = await this.get<Resp>('/b2b/v1/live-counts');
    return res.neighbourhoods.map((n) => ({
      neighbourhood: n.name,
      users_now: n.users_now,
      sparkline_15min: n.sparkline_15min,
    }));
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────
export function consumerEvents(): ConsumerEventsSource {
  const url = process.env.HEAT_APP_API_BASE_URL ?? process.env.CONSUMER_API_BASE_URL;
  const token = process.env.HEAT_APP_B2B_TOKEN ?? process.env.CONSUMER_API_INTERNAL_TOKEN;
  const clientName = process.env.HEAT_APP_B2B_CLIENT_NAME ?? 'heat-intelligence';
  if (!url || !token) return new StubSource();
  return new HttpSource(url, token, clientName);
}
