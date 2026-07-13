import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Non-nonce CSP (Next.js's documented "without nonces" pattern). A strict
// nonce-based CSP was considered and rejected: it requires every page to be
// dynamically rendered per request, which defeats the scheduled-ingestion +
// cached-read architecture this project relies on for performance and
// resilience against upstream (NOMIS/ONS) outages.
//
// script-src therefore needs 'unsafe-inline' in production too: the App
// Router injects inline hydration/flight-data scripts (self.__next_f.push…)
// and next-themes injects an inline anti-flash script. Without a nonce those
// can't be allow-listed by origin, and hashing is not viable because the
// flight-data payload changes with the underlying data. With no nonce/hash
// present, 'unsafe-inline' is what actually permits Next's own bootstrap —
// dropping it blocks hydration and leaves the page non-interactive. style-src
// needs 'unsafe-inline' likewise because Recharts renders positioning via
// inline SVG/DOM styles. 'unsafe-eval' is dev-only (React Fast Refresh).
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader.replace(/\s{2,}/g, " ").trim() },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
