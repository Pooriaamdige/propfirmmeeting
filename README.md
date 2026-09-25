# پراپ‌میتینگ — PropFirm Meeting

Persian (RTL) reference platform for reviewing and comparing Forex prop firms, with live market data, a Forex Factory–based news feed and economic calendar (Tehran time by default), and trader tools.

Stack: **Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · TradingView Lightweight Charts · Zod · React Hook Form · Drizzle ORM + PostgreSQL**.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional in development
npm run dev                  # http://localhost:3000
```

In development, market and calendar data default to the **mock providers**. Every mock response is flagged `isMock`, and the UI labels it «داده نمایشی — غیر زنده» so it can't be mistaken for live data.

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint (flat config) / `tsc --noEmit` |
| `npm run db:generate` / `db:migrate` | Drizzle migrations (`drizzle/`) |

## Pages

| Route | Content |
| --- | --- |
| `/` | Hero + market monitor, ticker, market overview + session clock, prop firm directory, quick comparison, chart, news, calendar, calculators, articles, lottery, newsletter |
| `/prop-firms/` · `/prop-firms/[slug]/` | Directory with search, filters and sorting · full firm review (quick facts, fee tiers, challenge phases, rules, pros/limits, Iran access note, FAQ, sources, review date) |
| `/compare/?firms=a,b,c` | Up to 4 firms side by side; shareable URL; row groups, "differences only", column sorting |
| `/markets/?symbol=XAUUSD` | Interactive chart (candles/line, 1m–1D), overview, market clock |
| `/news/` · `/economic-calendar/` | High/medium impact feed · calendar (today / tomorrow / this week / next week, currency + impact filters), timezone switch: Tehran / UTC / New York / London |
| `/tools/` | Position size calculator, drawdown calculator (with presets loaded from firm rules) |
| `/blog/` · `/blog/[slug]/` | Articles with category filter |

The site also has global search (`/` or `Ctrl+K`), dark mode (default) and a separately designed light theme, `sitemap.xml`, `robots.txt`, Open Graph/Twitter images, a web manifest, and JSON-LD (Organization, WebSite, BreadcrumbList, ItemList, Article, FAQPage).

## Architecture

```
src/
  app/                     routes + API route handlers (/api/*)
  components/              UI (never imports provider SDKs or datasets directly)
  data/                    prop-firms.ts, articles.ts (content, replaceable by CMS/DB)
  lib/
    services/
      marketService.ts            getMarketQuotes / getMarketChart / getMarketOverview
      market/{mockProvider,liveProvider}.ts
      economicCalendarService.ts  getEconomicCalendar(range, tz)
      calendar/{forexFactoryProvider,mockProvider}.ts
      newsService.ts              getForexNews(tz)
      propFirmService.ts          getPropFirms / getPropFirm
      articleService.ts, searchService.ts
    db/                    Drizzle schema, client, repository
    hooks/useLiveData.ts   polling client for our own /api endpoints
```

**Data flow:** Component → `/api/*` route → service → provider. The UI depends only on the `DataEnvelope<T>` shape (`data`, `source`, `isMock`, `fetchedAt`), so going from mock data to a real API is a config change (`MARKET_DATA_PROVIDER`, `CALENDAR_PROVIDER`), not a component change.

**Live data rules**
- Every data widget shows its source and «آخرین بروزرسانی» timestamp.
- When a provider fails, the API returns 503 and the UI shows «اطلاعات لحظه‌ای موقتاً در دسترس نیست.» with a retry button and the last successful update time. It never falls back to fake data.
- Provider calls go through an in-process TTL cache. A stale value is served for a short window only on refresh failure, and it keeps its original timestamp.
- Market data loads client-side after first paint, so provider latency never blocks the initial page load. The chart library loads only when the chart mounts.

### Providers

| Env | Values | Notes |
| --- | --- | --- |
| `MARKET_DATA_PROVIDER` | `mock` (default in dev) · `live` (default in prod) | `live` = **Twelve Data** (forex, XAUUSD, DXY; needs `TWELVEDATA_API_KEY`) + **Binance** public API (BTC/ETH, USDT pairs as USD proxy) |
| `CALENDAR_PROVIDER` | `mock` (default in dev) · `forexfactory` (default in prod) | Forex Factory weekly JSON export (`nfs.faireconomy.media`), cached for 30 minutes. That feed has no `actual` values, so the UI shows "—" for them |

To add a provider, implement `MarketDataProvider` / `CalendarProvider` and select it in the service.

> Note: the live providers were written against the documented response formats. They could not be exercised end-to-end from the build environment, which blocks outbound traffic. Verify them with real keys before launch.

### Forms, database and spam protection

- `POST /api/lottery` stores `name, email, phone, telegram_id, campaign_id (LOTTERY_CAMPAIGN_ID), ip_hash, created_at`. It enforces uniqueness per campaign on both email and phone.
- `POST /api/newsletter` stores email subscribers.
- The same Zod schemas validate on the client (React Hook Form) and the server. Phone numbers accept Persian digits and are normalised to `09xxxxxxxxx`. Telegram IDs follow the Telegram username rules.
- Spam protection: a honeypot field, a minimum fill time, per-IP rate limiting (in-memory; use Redis/Upstash when running multiple instances) and **Cloudflare Turnstile** when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` are set.
- Without `DATABASE_URL`, development keeps submissions in memory. Production returns 503 instead of pretending to save.

Create the tables with `npm run db:migrate` (or apply `drizzle/0000_init.sql`).

## Editorial: prop firm data ⚠️

`src/data/prop-firms.ts` holds **six sample records** (FTMO, FundedNext, The5ers, FundingPips, E8 Markets, Alpha Capital Group) built from public information. All of them are marked `status: "in-review"`. **Before publishing, an editor must verify every value against the official rules pages** listed in each record's `sources`, then set `status: "reviewed"` and update `lastReviewedAt`. The UI always shows the status and the review date («آخرین بررسی قوانین: …»).

The site deliberately has no aggregate "score". Firms are compared on explicit, separate data points.

## Accessibility and performance

- Semantic landmarks, skip link, labelled controls, `aria-pressed`/`aria-selected`/`aria-sort`, a keyboard-navigable search dialog, visible focus rings.
- `prefers-reduced-motion` turns off the ticker, reveals, count-ups and chart drawing animations.
- No animation library: reveals use IntersectionObserver and CSS. Sparklines and the hero chart are plain SVG. Lightweight Charts is code-split.
- Static generation for all content pages. The Vazirmatn variable font is self-hosted through `next/font/local`.

## Environment variables

See `.env.example`.
