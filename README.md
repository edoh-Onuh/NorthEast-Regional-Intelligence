# North East Regional Intelligence

A production-grade regional intelligence dashboard for North East England's seven local
authorities — Newcastle upon Tyne, Gateshead, Sunderland, County Durham, North Tyneside,
South Tyneside and Northumberland — built on real, live UK government open data (ONS, NOMIS,
HM Land Registry, OHID Fingertips), designed mobile-first, and deployable to Vercel in minutes.

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
- **Postgres** (Vercel Postgres / Neon / Supabase — any standard Postgres works) via
  **Drizzle ORM**. Schema: `local_authorities` (reference data), `indicator_observations`
  (long-format time series, one row per LA/domain/metric/period), `ingestion_runs` (a
  checkpoint log — see below).
- **Scheduled ingestion, not live-per-request fetching.** A protected `/api/ingest` route
  pulls from every real source and upserts into Postgres. Vercel Cron triggers it on two
  schedules (`vercel.json`): fast sources daily at 06:00 UTC, slower/heavier sources
  (housing, health) weekly on Mondays. The dashboard always reads from the database, never
  from upstream APIs directly — so a NOMIS/ONS outage or rate limit never takes the site down.
- **Data provenance / checkpoints.** Every ingestion run writes a row to `ingestion_runs`
  (source, status, rows written, timestamp, error if any). The dashboard's "Data provenance
  & ingestion checkpoints" panel surfaces this so data freshness and pipeline health are
  auditable in the UI, not just in logs.

## Getting started

```bash
npm install
cp .env.example .env         # then fill in DATABASE_URL and CRON_SECRET
npm run db:generate           # generate SQL migrations from the Drizzle schema
npm run db:migrate            # apply them to your database
npm run seed                  # backfill real data immediately (same pipeline the cron runs)
npm run dev
```

Without `DATABASE_URL` set, the app still builds and runs — it shows a friendly setup
notice instead of crashing (see `src/components/dashboard/SetupNotice.tsx`).

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Standard Next.js dev/build/serve |
| `npm run seed` | Run the full ingestion pipeline once, locally |
| `npm run db:generate` / `db:migrate` / `db:studio` | Drizzle schema migrations / browser |
| `npm test` | Vitest unit tests (date-range math, formatting, CSV parsing) |
| `npm run lint` | ESLint (flat config, Next 16 + React Compiler hooks rules) |

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel (or `vercel deploy`).
2. Provision Postgres: Vercel dashboard → Storage → create a Postgres database (Neon-backed),
   which sets `DATABASE_URL` automatically — or bring your own Neon/Supabase instance and add
   `DATABASE_URL` manually under Project Settings → Environment Variables.
3. Set `CRON_SECRET` (generate with `openssl rand -hex 32`) as an environment variable.
   Vercel automatically sends it as `Authorization: Bearer $CRON_SECRET` to the cron
   requests defined in `vercel.json` — see [Vercel's cron security docs](https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
4. (Recommended) Create a free [Upstash Redis](https://upstash.com) database and set
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` to enable rate limiting. Without
   these, the app still works, but rate limiting is disabled (logged, fail-open) — fine for
   evaluation, not recommended for a long-lived public deployment.
5. Set `NEXT_PUBLIC_SITE_URL` to your deployed URL (for correct Open Graph/sitemap links).
6. Deploy. Then run migrations against the production database once
   (`DATABASE_URL=<prod-url> npm run db:migrate`) and either wait for the first scheduled
   cron run or trigger it manually:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/ingest
   ```

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
- **This project could not be verified against a live Postgres instance in the environment
  it was built in** (no outbound DB provisioning/credentials available). TypeScript,
  ESLint, the production build, and all unit tests pass, and every external API integration
  was exercised against the real live upstream service during development — but you should
  run `npm run seed` against your own database and confirm the dashboard populates before
  treating this as fully verified end-to-end.

## Security

See [SECURITY.md](./SECURITY.md) for the full audit: threat model, headers, rate limiting,
authentication, dependency review, and residual risks.
