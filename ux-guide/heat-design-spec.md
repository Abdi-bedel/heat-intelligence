# Heat Design Spec
## B2B Landing Page + Venue Dashboard (Day 1 + Month 3)

**For:** Abdi · Heat
**Designed:** May 2026
**Status:** Wireframe / mid-fi prototype, ready for production handoff
**Files in this drop:**
- `heat-b2b-landing.html` — full sales page at intelligence.getheatapp.com
- `heat-venue-dashboard-day1.html` — Day 1 state at venues.getheatapp.com
- `heat-venue-dashboard-month3.html` — Month 3 state, same dashboard with full data
- `heat-design-spec.md` — this file

Each HTML file is self-contained. Open in a browser. Resize freely — they're responsive down to ~360px. All animations are CSS-only with one small JS bundle per page (carousel logic, ticker, pricing toggle).

---

## 1. Design system

The system is intentionally not the consumer Heat brand. The consumer app is dark, glowing, club-energy. The B2B surfaces are confident, editorial, warm, and quiet — a hospitality professional should feel like they're being shown the *intelligence layer*, not a clubgoer's surface.

### Colour
- **`--bg`** `#faf8f5` — warm cream paper. The page surface.
- **`--bg-secondary`** `#f3eee7` — secondary cards and inset blocks.
- **`--bg-card`** `#ffffff` — primary cards and the two-tone right-panel of split blocks.
- **`--text-primary`** `#1a1612` — near-black with a brown undertone, never pure black.
- **`--text-secondary`** `#6b6359` — body copy, sub-headers.
- **`--text-tertiary`** `#a39a8e` — meta, captions, tertiary labels.
- **`--border`** `#e7e0d6` — 0.5px hairlines, the structural skeleton.
- **`--coral`** `#d85a30` — single accent. Used for the live indicator, the killer reading, the −40% callout, the Founding 50 cap, the locked rate, the CTA hover state in some places. Restrained — never decorative.
- **`--teal`** `#1d9e75` — Verified mark + the positive-delta colour. Only ever signals "you're up" or "you're verified."
- **`--purple`** `#7f77dd` — used for the empty-state "Building" badge in the dashboard. Also the ambient tier in the live activity widget.
- **`--amber`** `#ef9f27` — drift/warning, third in the colour hierarchy. The "Warming" tier. The −12% drift reading.

The three named tiers across the system are coral (hot/active), amber (warming/drift), purple (ambient/building). Don't introduce a fourth without a reason.

### Type
- **Display** — `Fraunces`, opsz 9–144, weights 400/500/600. Used for headlines, killer readings, large numbers, plan prices. The slight optical sizing makes it feel hand-set rather than UI-stamped.
- **Sans** — `Inter`, weights 400/500/600. Body, labels, UI chrome.

The pairing is deliberate: Fraunces alone reads too magazine, Inter alone reads too SaaS. Together you get hospitality-confident.

### Spacing & layout
- 12px gap between major page blocks
- 16px border-radius on outer blocks, 12px on inner cards, 8px on small elements
- 0.5px hairline borders throughout — one weight, never thicker
- Maximum content width: 1200px on the body
- Block padding: 36–44px on desktop, 24px on mobile

### Motion
- One signature animation per block, never more
- All animations CSS-only (no JS animation libraries)
- Pulse-dot timing: 1.6s ease-in-out (the live indicator, used 5+ times — keep them all on the same beat so the page breathes together)
- Hero carousel: 7-second auto-advance, scrub bar at the bottom
- Reveal animations: 0.4–0.6s ease-out, never longer
- Ticker updates: 1.8–2.4s intervals (numbers feel alive, not stressful)

---

## 2. B2B landing page (`intelligence.getheatapp.com`)

Nine blocks in scroll order. Each is a self-contained `<section>` in the HTML — easy to reorder or A/B test individually.

### Block 0 — Top nav (sticky)
Heat brand mark + "Intelligence" pill, four nav links, primary CTA. Light, transparent on scroll if you want, but ships solid.

### Block 1 — Hero (the carousel)
Two-panel split, 1:1.05.

**Left:** the killer line + sub + CTAs + meta-strip (3 numbers: Users out now / Venues hot / Founding spots).
**Right:** rotating carousel of 4 sample dashboard readings, 7 seconds each:

1. *"You're at 60% of the average heat for bars in El Born this week."* — gap chart (dashed neighbourhood line above solid venue line, −40% callout)
2. *"Tonight, El Born is at 1.4× its normal Tuesday baseline."* — hourly trace with peak marker
3. *"Your Thursdays are pulling +18% ahead of bars like yours."* — bar chart with Thursday in teal
4. *"You're drifting. Down −12% against your neighbourhood over the last 4 weeks."* — four week-tiles + descending line in amber

Carousel controls: chevrons + counter top-right, progress bars at the bottom (clickable as nav).

**Animation per scene:** dashed neighbourhood line draws first (1.4s delay 0.2s), solid venue line draws (1.6s delay 0.7s), callout fades in (delay 1.4–2s). Each scene self-contained — when the carousel advances the new scene's animations replay from zero.

**The hero is the most important real estate on the page.** Don't simplify it.

### Block 2 — Live activity widget
8 neighbourhood cells: name, tier badge (Hot/Warming/Ambient), live count with coral-flash on update, sparkline below. Total at the bottom in tabular numerals: "2,847 people on Heat in Barcelona right now."

Each cell has its own update interval (2.2–4.6s offset) so the page never updates all at once. Hot tier fluctuates more; ambient drifts slowly.

**Production note:** numbers come from a live `GET /api/v1/public/live-counts` endpoint. Polling every 5s is sufficient. If consumer app numbers are pre-launch on launch day, swap the strip for a "launching [date]" frame instead — don't fake it.

### Block 3 — The Marta moment
Two-panel narrative + animated mockup. Left side is third-person prose (per bible: never invent named testimonials). Right side is a sequenced reveal: till report appears (delay 0.2s), then the question (1.6s), then the Heat reading (3.0s), then the final words of the narrative reveal one at a time (4.0–4.75s).

The punchline at the bottom is from the bible verbatim: *"The till is honest. It is also blind."*

### Block 4 — The bundle (4 horizontal cards)
**Visibility · Data · Founding 50 · Promote.** Description on top, signature animated graphic at the bottom of each card.

Per Abdi's note: Visibility and Status merged. The result is cleaner — four cards, full row, no awkward fifth wrap.

### Block 5 — Use cases (6 question cards)
Horizon axis at top: Tonight → This week → Next month. Six cards, 2 per horizon, each card: tag, question (Fraunces), divider, answer (Inter).

The Tonight tag is the only one with a pulsing dot, because tonight is the only horizon where the answer is *literally* live right now.

### Block 6 — Pricing
Free Claim and Verified as side-by-side peers. Monthly/Yearly toggle above (slider animates between the two pills).

**Toggle behaviour:**
- Monthly → €79/mo, "Billed monthly · cancel any time," lock line hidden
- Yearly → €49/mo (€79 struck through), "Billed yearly · €588/year," lock line shows ("Locked forever, even after Phase 2")

Cap bar below: "19 / 50 Founding spots claimed · 31 left · then €49 is gone."

Standard tier as a single horizontal disclosure strip at the bottom: €199, October 2026, "Founding 50 venues get this included." Required disclosure per bible §3.6.

### Block 7 — Why now
Header has a "Phase 2 launches in 5mo 12d" countdown card. Four reason cards in a 2×2 grid, each with a unique signature visual (animated cap donut, ripple-lock, tile mock with check, slow clock).

### Block 8 — FAQ
Eight questions, native HTML `<details>`/`<summary>` accordion. Plus icon rotates 45° to become an X when open. Coral on hover.

The "Can I pay you to rank higher?" answer is the structural defence of the brand: "No amount of money makes you hot." That's the line that makes the map worth looking at.

### Block 9 — Footer
Three sub-sections:
1. **Closing block** (large background panel) — final scarcity-driven CTA: "19 venues claimed. 31 left. After 50, the rate goes up."
2. **Roadmap track** — four steps from May 2026 (now, accent-coral) to 2027.
3. **Footer proper** — brand mark + tagline + App Store / Google Play (per bible: "credibility signal, not primary CTA"), three nav columns, legal strip.

---

## 3. Venue dashboard (`venues.getheatapp.com`)

Single page per PRD §3.6. Two states ship in this drop: Day 1 (most data is empty-state-as-progress) and Month 3 (full data).

The empty-state design is the single most important UX decision in the dashboard MVP. It turns the data-sparsity weakness into a "your product is improving every week" narrative.

### Shared shell (both states)
- **Topbar** — Heat brand + venues pill, help link, avatar
- **Header** — crumb, venue name + Verified mark, Founding 50 / Locked rate pills, last-updated dot, "Day [N] of pilot" counter
- **Body** — sectioned content
- **Footer** — venue ID, Spotlight purchase link, support, logout

### Day 1 — `heat-venue-dashboard-day1.html`
- **Welcome ribbon** — coral-soft callout, "Welcome to your dashboard, Bar Marsella" + the data journey
- **Tile metrics block** — 4 cells: Tile views, Hours/Directions/Website tap-throughs. Live from Day 1 (no empty state needed). Big Fraunces numbers + sparklines + delta colours.
- **Check-ins** — empty-state with "Day 3 of 7" progress bar, "Unlocks ~ May 11"
- **Neighbourhood comparison** — empty-state with "6 of 10 venues active" progress, "Unlocks at 10." The killer line is shown as a placeholder template: *"You're at __% of the average heat for bars in El Born this week."*
- **Peak hours** — empty-state, "Week 1 of 4"
- **Day-of-week** — empty-state, "Week 1 of 4"

The empty-state pattern is consistent: Building badge (purple) → name → killer-line template → why-not-yet detail → progress bar → "[where you are] / [where you need to be]" → ETA. Plus a faint dashed-line preview chart so the venue can see *what's coming*.

### Month 3 — `heat-venue-dashboard-month3.html`
Same shell. Same data points. Now populated:

- **Tile metrics** — bigger numbers (2,481 / 412 / 298 / 94), all up, all teal
- **Killer line** — *"You're at 112% of the average heat for bars in El Born this week."* in Fraunces 26px, with a 7-day comparison chart (dashed neighbourhood line + solid coral venue line)
- **Check-ins** — 487 in 64px Fraunces, "+62 vs. last week" in teal, 8-week trend area chart
- **Peak hours** — *"Avg. peak: 23:00–00:30"* with a full hourly area chart, peak marker at 23:30
- **Day-of-week** — bar chart with Thursday at 112 (peak, in coral) standing out from the muted Mon/Sun shoulders

The Month 3 view is the slide for every Founding 50 sales conversation. It's the answer to "what does my dashboard look like in 12 weeks?"

### Implementation notes for the engineer

**API endpoints required** (per PRD §4.1):
```
GET /v1/venue/me/profile
GET /v1/venue/me/metrics/check-ins?week=current
GET /v1/venue/me/metrics/peak-hours
GET /v1/venue/me/metrics/day-of-week
GET /v1/venue/me/metrics/neighbourhood-comparison
GET /v1/venue/me/metrics/tile-views?week=current
GET /v1/venue/me/metrics/tap-throughs?week=current
```

Each endpoint returns either the metric value or a structured "not available yet" payload with reason and threshold info. Frontend renders the empty-state component when the response is in the not-available shape.

**Empty-state component shape:**
```ts
type EmptyState = {
  status: 'building'
  reason: string                    // "Need 10 venues, currently 6"
  current_progress: number          // 6
  threshold: number                 // 10
  unit: 'days' | 'weeks' | 'venues'
  estimated_unlock: ISO8601 | null  // null if depends on neighbourhood, ISO if days/weeks
}
```

**No fake numbers, ever.** No Google Popular Times backfill, no "estimated based on similar venues." The bible and PRD are explicit about this. Empty states are the feature, not the bug.

**Responsive breakpoints:**
- Desktop: ≥900px — full layouts as designed
- Tablet/mid: 600–900px — split panels stack, 4-column grids become 2-column
- Mobile: <600px — single-column everywhere, padding reduces to 24px

**Auth:** email + password only at MVP. No SSO, no signup self-serve. Sessions: 30-day JWT. Per PRD §3.8.

---

## 4. Production handoff checklist

When the engineer takes this to production:

- [ ] Replace placeholder data (Bar Marsella, El Born, 19/50 counter) with real venue/data from API
- [ ] Wire the live ticker on the landing page to a real `/api/public/live-counts` endpoint
- [ ] Replace pricing toggle stub with real Stripe price IDs
- [ ] Wire the "Claim your venue" CTA to the actual signup flow (not built in this drop)
- [ ] Replace the Founding 50 counter with a real Stripe coupon-tracked count
- [ ] Replace App Store / Google Play links with real consumer app URLs
- [ ] Replace social/email contact placeholders with real ones
- [ ] Add proper error states for API failures (separate from empty states — empty means "not enough data yet," error means "something broke")
- [ ] Add a 401 redirect on the dashboard to the login page
- [ ] Add proper page meta tags (Open Graph, Twitter cards) — not in this drop
- [ ] Add Spanish + Catalan translations for any user-facing strings (not in this drop, ships with consumer app v1.1)
- [ ] Consider adding pause-on-hover for the hero carousel if user testing finds the auto-advance distracting

**What's not in this drop and is needed before launch:**
- Onboarding/signup flow (admin-managed at MVP per PRD §3.8 — no self-serve)
- Login/password-reset pages (basic auth UI, separate spec)
- Spotlight purchase flow (separate flow per bundle architecture)
- Admin/founder dashboard (internal, lower priority)
- Consumer landing page at `getheatapp.com` (lower priority — current Framer site can stay)

---

## 5. Decisions made during design (worth knowing)

These were calls Claude made during the wireframing process. Most are reversible if you decide differently later.

1. **Coral as the only brand accent** rather than introducing more accent colours. Restrained palette — coral does the work of "important / live / locked." Teal for verified/positive, amber for drift, purple for building. Could have added more vibrancy but chose hospitality-confident over startup-energetic.

2. **Fraunces + Inter pairing.** Decided early. Fraunces alone reads too magazine; Inter alone reads too SaaS. The bible doesn't specify type — this is a Claude call.

3. **Hero is a 4-scene carousel, not a static reading.** Originally proposed a single chart. The carousel lets you show the killer sentence in four flavours (gap, tonight, win, drift) — each one a different reason to pay €49.

4. **The B2B page deliberately does NOT show the consumer app.** Earlier draft had the live Barcelona map as the hero centerpiece. Wrong call — it confuses the pitch (venue manager looks at it and thinks "this is the app, where's my dashboard?"). The intelligence layer should be the visible product.

5. **Free Claim is a peer to Verified, not a footnote.** Equal card size. Six-row feature list with three checks (gets) and three minuses (upgrade reasons).

6. **Pricing collapsed to monthly/yearly only** (3-month and 6-month cut). Cleaner story, less decision fatigue.

7. **Bundle is 4 layers, not 5.** Visibility and Status merged — they were the same Verified mark described twice from different angles.

8. **Empty states show progress bars, not "coming soon".** Per PRD §3.7: tells the venue *why and when* the data unlocks, exactly where they are in that journey, what changes when the threshold hits.

---

## 6. Open questions for Abdi

These are decisions deferred during design that should get a final answer before launch:

1. **Hero carousel timing.** 7s feels right but is untested. Worth A/B testing 7s vs 9s once there's traffic.

2. **Auto-advance vs. pause-on-hover.** Currently relentless. If the page sees long dwell times and users complain about distraction, add pause-on-hover. Not a launch blocker.

3. **Phase 2 countdown.** Currently hardcoded "5mo 12d." Should compute against the real Phase 2 ship date. Trivial change once that date is locked.

4. **Sample readings on the landing page.** The four carousel scenes use plausible-but-hypothetical data (Bar Marsella, El Born, −40%). Once real Founding 50 venues are in the door and have given consent, we can swap to anonymised real readings. Do not show real venue names without permission.

5. **The Marta moment narrative copy** is structural. Final copy should get a pass from Jaz before launch — bible voice is locked, but the prose needs a final write-up.

6. **Use case card 6** — *"Where's the foot traffic actually coming from?"* — is the weakest of the six because the honest answer is "Phase 2." Either swap it for something Day 1 (e.g., "Which night should I close early?") or keep it with explicit Phase 2 framing in the answer.

---

*End of spec. Ping Claude in the same project for iterations or extensions (consumer landing page, admin dashboard, onboarding flow, login pages).*
