# North East Regional Intelligence

A production-grade regional intelligence dashboard for North East England's seven local
authorities — Newcastle upon Tyne, Gateshead, Sunderland, County Durham, North Tyneside,
South Tyneside and Northumberland — built on real, live UK government open data (ONS, NOMIS,
HM Land Registry, OHID Fingertips). It is mobile-first, keyboard- and screen-reader-accessible,
uses a colour-vision-deficiency-safe chart palette, and deploys to Vercel in minutes.

## What it covers

| Domain | Metric(s) | Source | Cadence |
|---|---|---|---|
| Economy | GVA (current prices) | ONS Regional GVA by local authority | Annual, manually refreshed (no live API exists — see below) |
| Business | Active enterprises | NOMIS UK Business Counts (NM_142_1) | Live, daily |
| Labour Market | Claimant count, employment rate | NOMIS Claimant Count (NM_162_1) + APS (NM_17_5) | Live, daily |
| Skills | NVQ4+, no qualifications | NOMIS Annual Population Survey (NM_17_5) | Live, daily |
| Population | Total & working-age population | NOMIS Population Estimates (NM_31_1) | Live, daily |
| Housing | Average price, annual % change | HM Land Registry UK House Price Index | Live, weekly |
| Health | Life expectancy (male/female) | OHID Fingertips (indicator 90366) | Live, weekly |
| Crime | — | *Not available* | See [Known limitations](#known-limitations) |

GVA per capita is derived at render time by combining the economy and population domains —
it is never stored, so it's always consistent with whatever the two source metrics currently say.

All figures are Crown Copyright / Open Government Licence v3.0.

## Architecture

- **Next.js 16** (App Router, Turbopack, React 19) + TypeScript, Tailwind CSS v4.
- **Postgres** (Supabase / Neon / Vercel Postgres — any standard Postgres works) via
  **Drizzle ORM**. Three tables: `local_authorities` (reference data), `indicator_observations`
  (long-format time series, one row per LA/domain/metric/period), and `ingestion_runs` (a
  checkpoint log — see below). The connection is opened lazily on first query, so a missing
  or unreachable `DATABASE_URL` surfaces as a friendly in-app setup notice rather than a
  build- or boot-time crash.
- **Scheduled ingestion, not live-per-request fetching.** A protected `/api/ingest` route
  pulls from every real source and upserts into Postgres. Vercel Cron triggers it on two
  schedules (`vercel.json`): fast sources daily at 06:00 UTC, slower/heavier sources
  (housing, health) weekly on Mondays. The dashboard always reads from the database, never
  from upstream APIs directly — so a NOMIS/ONS outage or rate limit never takes the site down.
  The home page is statically rendered and revalidated every 5 minutes (ISR).
- **Data provenance / checkpoints.** Every ingestion run writes a row to `ingestion_runs`
  (source, status, rows written, timestamp, error if any). The dashboard's "Data provenance
  & ingestion checkpoints" panel surfaces this so data freshness and pipeline health are
  auditable in the UI, not just in logs.
- **Health probe.** `GET /api/health` is an unauthenticated liveness/readiness check that
  confirms the database is reachable (`select 1`) and returns no sensitive data.

## Accessibility & UX

- **Domain switcher is a full WAI-ARIA Tabs implementation** — roving `tabindex`,
  Arrow/Home/End keyboard navigation, and complete tab ↔ tabpanel wiring
  (`aria-controls` / `aria-labelledby`).
- **A "skip to main content" link** jumps focus straight to the active panel, past the
  header and nav.
- **Every chart has a visually-hidden data table** (`AccessibleDataTable`) mirroring its
  data point-for-point, so screen-reader users get the same information as the SVG conveys.
- **Light/dark theme** (system-aware via `next-themes`, no flash of the wrong theme on
  first paint), and a global `prefers-reduced-motion` rule that stills animations and
  transitions.
- **Mobile-first responsive layout** throughout — single-column on phones, two-up on wide
  screens, horizontally-scrollable tab bar and tables.

## Data visualisation

Charts are built with Recharts and coloured from a **validated categorical palette**, not
hand-picked hues:

- The seven-authority palette is the reference `dataviz` palette's slots 1–7 in a **fixed
  order chosen so colliding hues (blue and violet) are never adjacent**. It passes the
  palette checker in both modes — light worst-adjacent colour-vision-deficiency ΔE ≈ 24,
  dark ≈ 10 (floor band, backed up by the always-present legend and the accessible data
  table). The dark palette is the same seven hues re-stepped for the dark surface, not an
  automatic flip.
- **Each authority keeps one consistent colour everywhere**, so recognition carries across
  every chart and domain.
- **Refined mark styling:** 2px round-capped lines, recessive solid hairline gridlines,
  soft ~12% area washes, hover crosshair + tooltip with surface-ring dots, and comparison
  bars with rounded data-ends, value labels at each tip, and a labelled cross-authority
  mean line.

## Discoverability & PWA

- Dynamic **Open Graph / social-share image** (`opengraph-image`) and Twitter card, so
  shared links render a branded preview.
- Generated **app icon + Apple touch icon** and a **web app manifest** (installable PWA).
- **Schema.org `Dataset` JSON-LD**, plus `robots.txt` and `sitemap.xml`.

## Security

Hardened HTTP headers (CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy`), a constant-time bearer-token check on `/api/ingest`
(fail-closed when `CRON_SECRET` is unset), and per-IP rate limiting via Upstash Redis
(fail-open with a warning when unconfigured). See **[SECURITY.md](./SECURITY.md)** for the
full audit: threat model, the CSP trade-off recorded deliberately, dependency review, and
residual risks.

## Getting started

```bash
npm install
cp .env.example .env          # then fill in DATABASE_URL and CRON_SECRET
npm run db:generate           # generate SQL migrations from the Drizzle schema
npm run db:migrate            # apply them to your database
npm run seed                  # backfill real data immediately (same pipeline the cron runs)
npm run dev
```

Without `DATABASE_URL` set, the app still builds and runs — it shows a friendly setup
notice instead of crashing (see `src/components/dashboard/SetupNotice.tsx`).

> **Supabase users — use the connection pooler, not the direct host.** Supabase's direct
> database host (`db.<ref>.supabase.co`) is **IPv6-only**. On an IPv4-only machine or
> platform (most laptops, and Vercel's runtime) it will fail with `ENOTFOUND`. Use the
> **Session-mode pooler** connection string instead — it's IPv4 and supports prepared
> statements and Drizzle migrations unchanged:
> ```
> postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
> ```
> (Note the username is `postgres.<ref>`, not plain `postgres`.)

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Standard Next.js dev / build / serve |
| `npm run seed` | Run the full ingestion pipeline once, locally |
| `npm run db:generate` / `db:migrate` / `db:studio` | Drizzle schema migrations / browser |
| `npm test` | Vitest unit tests (date-range math, formatting, CSV parsing) |
| `npm run lint` | ESLint (flat config, Next 16 + React Compiler hooks rules) |

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel (or `vercel deploy`).
2. Provision Postgres and set `DATABASE_URL` under Project Settings → Environment Variables.
   With Supabase, use the **Session-mode pooler** string (see the note above) — the direct
   host is IPv6-only and will not resolve from Vercel.
3. Set `CRON_SECRET` (generate with `openssl rand -hex 32`) as an environment variable.
   Vercel automatically sends it as `Authorization: Bearer $CRON_SECRET` to the cron
   requests defined in `vercel.json` — see [Vercel's cron security docs](https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
4. (Recommended) Create a free [Upstash Redis](https://upstash.com) database and set
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` to enable rate limiting. Without
   these, the app still works, but rate limiting is disabled (logged, fail-open) — fine for
   evaluation, not recommended for a long-lived public deployment.
5. Set `NEXT_PUBLIC_SITE_URL` to your deployed URL (for correct Open Graph / sitemap links).
6. Deploy. Then run migrations against the production database once
   (`DATABASE_URL=<prod-url> npm run db:migrate`) and either wait for the first scheduled
   cron run or trigger it manually:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/ingest
   ```
   Confirm the database is reachable at any time with `curl https://your-app.vercel.app/api/health`.

## Known limitations

- **GVA (economy domain) is a manually-refreshed annual snapshot, not a live API.** ONS
  does not publish local-authority GVA via any queryable API — only as an annual bulletin
  download. The figures in `src/lib/sources/gvaSnapshot.ts` are the real published values
  from the 2025-04-17 release; update that file when ONS issues a new one.
- **Crime has no data.** `data.police.uk` only exposes point-radius ("street-level") crime
  or a location-*less* subset — not force-wide or local-authority-wide totals — and ONS's
  Community Safety Partnership crime tables are bulletin-only (no API). Rather than publish
  a misleading proxy number, this domain intentionally shows an explanatory empty state.
- **Skills (NVQ4+ / no qualifications) has real gaps.** The Annual Population Survey
  suppresses small-sample estimates per local authority per period (`obs_status: "F"`);
  those are omitted, not estimated or interpolated.

## Verification

Every external API integration is exercised against the real live upstream service, and the
full pipeline has been **verified end-to-end against a live Supabase Postgres instance**:
`npm run seed` populates all seven domains and the dashboard renders the real data, charts,
GVA-per-capita and provenance panel. ESLint, `tsc --noEmit`, the Vitest suite, and the
production `next build` all pass. As always, run `npm run seed` against your own database and
open the dashboard once after deploying to confirm it populates in your environment.
