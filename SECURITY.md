# Security Audit

This is a public, read-only, unauthenticated dashboard with one privileged write path (the
ingestion cron endpoint). The threat model is therefore narrower than a typical SaaS app —
no user accounts, no user-submitted content, no payments — but the checklist below was
worked through in full rather than assumed.

## 1. Transport & headers (`next.config.ts`)

| Header | Value | Why |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS for 2 years; Vercel terminates TLS in front of this anyway, this is defense-in-depth against downgrade/misconfiguration. |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'` (+ `'unsafe-eval'` in dev only) `; style-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests` | Blocks loading of any third-party script/object (only same-origin `src` scripts run); blocks framing (clickjacking). Both `script-src` and `style-src` need `'unsafe-inline'` — see the "CSP trade-off" note below. |
| `X-Frame-Options` | `DENY` | Belt-and-braces alongside `frame-ancestors 'none'` for older browsers that don't parse CSP. |
| `X-Content-Type-Options` | `nosniff` | Stops MIME-sniffing attacks. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Avoids leaking full URLs (which never contain secrets here, but this is standard hygiene). |
| `Permissions-Policy` | camera/microphone/geolocation disabled, FLoC (`interest-cohort`) disabled | None of these are used; explicitly denying reduces attack surface and opts out of the FLoC cohort. |

**CSP trade-off, recorded deliberately:** Next.js's documented *strict* CSP approach uses a
per-request nonce, but that requires every page to be dynamically rendered (no static
generation, no ISR) because the nonce must be generated in `proxy.ts` per-request and
threaded through rendering. This app is deliberately built around **scheduled ingestion +
cached reads** for performance and resilience against upstream (NOMIS/ONS/Land
Registry/Fingertips) outages or rate limits — forcing full dynamic SSR on every request
would defeat that. The non-nonce CSP (Next's own documented fallback pattern) was used
instead. With that pattern `script-src` must include `'unsafe-inline'` in production:
the App Router emits inline hydration/flight-data scripts (`self.__next_f.push(…)`) and
`next-themes` emits an inline anti-flash script, and with no nonce (would force dynamic
rendering) and no viable hash (the flight-data payload changes with the data),
`'unsafe-inline'` is what permits Next's own bootstrap — without it the browser blocks
those scripts and the page never hydrates (tabs, theme toggle and the provenance panel
go dead). `style-src` needs `'unsafe-inline'` likewise, because of inline SVG/DOM styling
from the charting library. `'unsafe-eval'` is dev-only (React Fast Refresh).

**Residual risk of `script-src 'unsafe-inline'`:** it weakens the XSS defence that a
nonce/hash CSP would give, since an injected inline `<script>` would execute. In practice
the exposure here is low: the app renders only trusted UK-government open data and static
copy (no user-generated content), the one hand-authored inline block is JSON-LD emitted
as inert `application/ld+json` with `<` escaped, and third-party/cross-origin scripts are
still blocked (only same-origin `src=` scripts load). If the app ever renders user input,
switch the home page to dynamic rendering and adopt a per-request nonce.

## 2. Authentication on the one privileged endpoint (`/api/ingest`)

- **Fails closed**: if `CRON_SECRET` isn't configured, the endpoint accepts *nothing* —
  there is no "open by default" fallback.
- **Constant-time comparison**: the bearer token is SHA-256 hashed on both sides and
  compared with `crypto.timingSafeEqual`, rather than `===`, to avoid a timing side-channel
  on the secret value.
- **Rate limited** (5 requests/minute/IP via Upstash) before the auth check even runs, so
  brute-force attempts against the secret are throttled independently of whether they'd
  succeed.
- Both `GET` (what Vercel Cron actually sends) and `POST` (for manual/ad-hoc triggering)
  require the identical bearer check — there's no unauthenticated method.
- The `?domains=` query parameter is only ever matched against a fixed, hard-coded enum
  (`IndicatorDomain`) via `.includes()` — it never reaches a SQL query, a shell command, or
  a file path, so there's no injection surface even though it's unvalidated user input.

## 3. Injection

- **SQL**: 100% Drizzle ORM query builder. The only raw `sql\`...\`` usages in the codebase
  are fixed literals (`sql\`excluded.value\``, `sql\`now()\``, `sql\`select 1\``) with zero
  interpolated variables — grepped and confirmed. No string concatenation into queries
  anywhere.
- **XSS**: zero uses of `dangerouslySetInnerHTML`, `eval`, or `new Function` in the codebase
  (grepped and confirmed). All rendering goes through React's default escaping.
- **CSV parsing** (`lib/sources/health.ts`, parsing the Fingertips public health dataset):
  a small hand-written parser that only ever handles quoted-comma escaping in a fixed-schema
  government CSV, never evaluates the content, and only extracts a bounded set of columns
  by name lookup — not a general-purpose CSV/formula-injection risk.

## 4. Secrets handling

- `DATABASE_URL`, `CRON_SECRET`, `UPSTASH_REDIS_REST_TOKEN` are read only in server-only
  modules (`lib/db`, `lib/rateLimit`, `app/api/*/route.ts`) — grepped to confirm none of
  these appear in any `"use client"` file, so they never reach the browser bundle.
  `NEXT_PUBLIC_SITE_URL` is the only intentionally-public env var, used for Open
  Graph/sitemap URLs.
- The Postgres client is constructed **lazily** (on first query, not at module import), so a
  missing/invalid `DATABASE_URL` surfaces as a caught error the app displays a generic
  message for — it doesn't crash the process or appear in an unhandled stack trace.
- If the DB connection error message is shown at all (a `SetupNotice` screen), the raw
  technical detail is only rendered when `NODE_ENV !== "production"` — a production
  deployment with a misconfigured `DATABASE_URL` shows a generic message only, so
  infrastructure details (hostnames, etc.) in driver error messages can't leak to the public
  internet.
- `error.tsx` (the global error boundary) logs the full error server-side via
  `console.error` but only ever renders a generic "something went wrong" message to the
  client — no stack traces or internal messages are shipped to the browser.

## 5. Rate limiting & abuse

- **Page-level** (`src/proxy.ts`, all routes except static assets): 120 requests/minute/IP,
  sliding window, via Upstash. Protects the DB-backed dashboard from scraping/DoS.
- **Ingestion-endpoint-level**: 5 requests/minute/IP, stricter because legitimate traffic is
  ~1 request per scheduled cron run.
- **Fails open, loudly, if unconfigured**: if `UPSTASH_REDIS_REST_URL`/`TOKEN` aren't set,
  rate limiting is skipped (not blocked) and a `console.warn` fires once. This is a
  conscious trade-off so the app remains fully functional for local development/evaluation
  without requiring a Redis account, but it means **rate limiting is not actually active
  until Upstash is configured** — call this out explicitly to whoever deploys this: set
  Upstash env vars before treating a public deployment as hardened.

## 6. Dependencies (`npm audit`)

Two moderate-severity advisories remain, both reviewed and accepted rather than blindly
"fixed":

1. **`esbuild <=0.24.2`** via `drizzle-kit` → `@esbuild-kit/esm-loader` (deprecated,
   upstream hasn't migrated off it yet even in the latest drizzle-kit 0.31.10). The
   advisory is about esbuild's *development server* accepting cross-origin requests.
   `drizzle-kit` is a local CLI tool (migrations only) — it is never imported into the
   Next.js app bundle or run in the deployed environment, and its bundled esbuild is never
   invoked as an exposed dev server here. Forcing a fix would downgrade `drizzle-kit` to
   0.18.1, a breaking regression, for no real reduction in this project's actual attack
   surface. **Decision: accept, monitor for a drizzle-kit release that drops
   `@esbuild-kit`.**
2. **`postcss <8.5.10`** — bundled *inside Next.js itself* (`next/node_modules/postcss`
   pinned at 8.4.31), separate from this project's own top-level `postcss@8.5.16` (already
   patched, used by Tailwind). This is Next 16.2.9's own internal build-time CSS tooling,
   not something this project's `package.json` can independently pin. The advisory is an
   XSS-via-unescaped-`</style>` risk in postcss's *stringifier output* — relevant to
   applications that feed untrusted, user-supplied CSS through postcss at runtime. This app
   only ever processes its own static Tailwind source at build time; no user input reaches
   this code path. `npm audit`'s suggested fix (downgrade `next` to `9.3.4`) is not a
   genuine remediation. **Decision: accept, no action available until Next.js ships an
   internal postcss bump.**

Run `npm audit` yourself before relying on this list — dependency advisories change over
time and this snapshot reflects the state at build time.

## 7. Denial of service / resource exhaustion

- `/api/ingest`'s health-data fetcher downloads a multi-megabyte CSV from OHID Fingertips.
  It's scheduled weekly (not daily, not per-request), and it's the *server* making that
  outbound call on a timer — not something a visitor can trigger repeatedly, since the
  endpoint itself is rate-limited and secret-gated.
- The housing fetcher batches requests per month across all 7 LAs in parallel (7 concurrent
  requests) rather than 84 fully-sequential calls, keeping the ingestion route within
  Vercel's function duration limit (`maxDuration = 60`).
- Database writes are chunked (500 rows/batch) to avoid oversized single statements.

## 8. What this audit does *not* cover

- **No automated dependency-vulnerability scanning is wired into CI** (there is no CI
  pipeline in this repo at all — add GitHub Actions/`dependabot.yml` if you want ongoing
  coverage rather than a one-time snapshot).
- **No live penetration test** was performed against a deployed instance — this is a static
  code/configuration review plus local `npm audit`/build verification.
- **The database itself was never provisioned or connected to in this environment** (see
  the README's "Known limitations" section) — schema-level correctness (constraints,
  indexes, upsert conflict targets) was verified by code review and `tsc`/build success, not
  by executing real queries against Postgres. Run `npm run seed` against your own database
  and confirm before considering this fully verified end-to-end.
