# PropFirm Meeting — پراپ‌فرم میتینگ

Persian (RTL) platform for reviewing prop firms, sharing exclusive coupon codes, live market data, Forex Factory news and calendar (Tehran time), trader tools, a lottery, and an **admin panel** for managing all of it.

Stack: **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Motion · TradingView Lightweight Charts · Drizzle ORM · PostgreSQL or embedded PGlite · Zod**

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
```

- In development the database is created automatically in `.data/pglite`, seeded with sample prop firms, articles, a lottery campaign and example coupons.
- A development admin is created as **admin@propfirm.local / admin1234**. Open http://localhost:3000/admin. This admin is never created in production.
- To work offline with demo prices, set `MARKET_DATA_PROVIDER=mock CALENDAR_PROVIDER=mock`. The UI labels this data «داده نمایشی».

## Production deployment (single server behind nginx)

```bash
cp .env.example .env.local      # fill in the values below
npm ci
npm run build
npm start                       # or: pm2 start npm --name propfirm -- start
```

Minimum `.env.local`:

```
NEXT_PUBLIC_SITE_URL=https://propfirm.rokhsarweb.com
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=a-long-random-password
TWELVEDATA_API_KEY=...          # live spot forex/gold
OUTBOUND_PROXY_URL=...          # if the server is in a region the data providers block
```

- **Database.** Without `DATABASE_URL`, data lives in `PGLITE_DIR` (default `./.data/pglite`). Back up that folder. Run **only one** app process on it: no PM2 cluster mode. For several processes or servers, set `DATABASE_URL` to PostgreSQL. Migrations in `drizzle/` run automatically on startup.
- **First admin.** Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before the first start, or run `npm run admin:create -- you@example.com "password"`. Add more admins or editors in **/admin/users**.
- **HTTPS.** Admin cookies are `Secure` in production. If the site is served over plain `http`, set `COOKIE_SECURE=false`; otherwise login silently fails.

### nginx

```nginx
location / {
    proxy_pass http://192.168.23.30:3000;      # no trailing slash
    proxy_http_version 1.1;
    proxy_set_header Host $host;               # required: server actions check Origin vs Host
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_buffer_size 16k;
    proxy_buffers 8 16k;
}
```

Don't let nginx cache `/_next/` across deployments: stale chunks cause “elements not loading”. Don't intercept `/_next/static` with a `root` or `try_files` rule unless it points at the current build's `.next/static`.

## Live market data

The browser only calls our own `/api/*` endpoints. The server fetches from providers, shares each response with every visitor for `MARKET_QUOTE_TTL_SECONDS` (default 5 s), and falls back automatically when a provider fails.

| Asset | Default chain (`MARKET_FX_PROVIDERS` / `MARKET_CRYPTO_PROVIDERS`) | Notes |
| --- | --- | --- |
| Forex, XAUUSD, DXY | `twelvedata,yahoo` | Twelve Data (key) gives spot prices. The Yahoo fallback is keyless; it serves gold as COMEX futures (GC=F) and labels the source so on the page |
| BTC, ETH | `binance,coinbase,yahoo` | All keyless |
| Calendar / news | Forex Factory weekly feed | Cached 30 min |

- Every widget shows its source and the last update time. If every provider fails, the UI shows «اطلاعات لحظه‌ای موقتاً در دسترس نیست» with a retry button and never fake prices.
- A failing provider is paused for a while (circuit breaker).
- **Admin → Dashboard → «وضعیت داده‌های زنده»** shows each provider's last success and last error. Check it first if prices don't load.
- **Servers in Iran:** Binance, Coinbase, Yahoo, Twelve Data and Forex Factory may block Iranian IPs. Set `OUTBOUND_PROXY_URL` to a proxy outside the restricted region (`http://user:pass@host:port` or `socks5://user:pass@host:port`, e.g. a local v2ray/xray client); all provider requests go through it.
- The Twelve Data free tier (8 requests/min) is too small for 5-second polling of many symbols. Use a paid plan, or raise `MARKET_QUOTE_TTL_SECONDS`.

## Site structure

| Route | Purpose |
| --- | --- |
| `/` | Purpose-focused homepage: hero + live monitor, firm marquee, live ticker, feature grid linking to every section, featured firms, featured coupons, market snapshot, upcoming news, how-it-works, articles, lottery + newsletter |
| `/prop-firms/`, `/prop-firms/[slug]/` | Directory (search/filter/sort) and full reviews |
| `/compare/` | Overview table + side-by-side comparison of up to 4 firms (shareable URL) |
| `/coupons/` | **Coupon codes**: ticket cards with one-click copy, filter by firm, sort, expiry countdown, copy analytics |
| `/markets/` | Interactive chart (candles/line, 1m–1D), overview, session clock |
| `/news/`, `/economic-calendar/` | Forex Factory feed and calendar with timezone switch |
| `/tools/` | Position size and drawdown calculators |
| `/blog/` | Articles |
| `/lottery/` | Active lottery campaign + registration form |
| `/admin/` | Admin panel |

## Admin panel (`/admin`)

| Section | What you can do |
| --- | --- |
| Dashboard | Counts, recent lottery sign-ups, live-data provider health |
| پراپ‌فرم‌ها | Add/edit/delete firms with a structured editor (fees, phases, drawdowns, all rules, payout, pros/limits, FAQ, sources, review status and date), publish/feature toggles, ordering |
| کدهای تخفیف | Add/edit coupons: firm, code, discount label, link, terms, start/expiry, active/featured, order; see copy counts |
| مقالات | Write articles in lightweight Markdown with live preview |
| قرعه‌کشی | Create campaigns (only one active), view registrations, export CSV |
| خبرنامه | Subscribers list, CSV export |
| تنظیمات سایت | Homepage hero text, announcement bar, social links (admins only) |
| مدیران | Add admins/editors, change your password (admins only) |

Changes are visible on the site immediately. Security: scrypt password hashing; httpOnly session cookies stored hashed in the database; failed-login throttling; every page and action checks the session server-side; `/admin` is `noindex`.

## Design and animation

The palette comes from the logo: warm black, logo orange (`#EB7E2F`) and logo gold (`#F2C85B`), with a separately designed light theme. The `P`-with-check mark is redrawn as an SVG (`components/layout/Logo.tsx`), so it works in both themes.

Animations are built in-house (`components/fx/`) in the style of 21st.dev and cult-ui components, since those sites weren't reachable from the build environment:
- drifting aurora backdrop and film grain
- canvas particle field with pointer constellation
- spotlight cards and rotating border beam
- 3D tilt coupon tickets with copy "sparks"
- word-by-word blur-in headlines and shine text
- number tickers, marquee, staggered reveals
- page transitions and a scroll progress bar

All of it respects `prefers-reduced-motion`. Canvas effects pause offscreen.

## Editorial note

The seeded prop firm data is marked «در حال بررسی». Verify each firm against its official rules (links under *منابع* in the editor), then set the status to «بررسی‌شده» and update the review date in the admin. The seeded coupons are examples: they are hidden in production. Replace them with real codes.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm run admin:create -- email "password" [admin\|editor]` | Create or reset an admin |
| `npm run db:generate` | Generate a migration after editing `src/lib/db/schema.ts` |
