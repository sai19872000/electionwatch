/** @type {import('next').NextConfig} */

// Production data layer for SWR. The scraper writes `snapshot.json` and
// `state_<code>.json` to the R2 bucket `ew-snapshots`; the watchdog Worker
// writes a degraded snapshot when the scraper falls behind. Frontend reads
// these objects via the URL below.
//
// Custom domain (subdomain convention `*.saiteja.ai`):
//   ew-snapshots.saiteja.ai → R2 bucket `ew-snapshots`
//
// Override at build time by setting NEXT_PUBLIC_DATA_BASE in the
// Cloudflare Pages project env (e.g. while the custom domain is being
// wired, point at the r2.dev public URL).
const DEFAULT_DATA_BASE = 'https://ew-snapshots.saiteja.ai';

// R2 origin used in the CSP connect-src directive. Must match the host that
// serves live/snapshot.json and live/state_*.json at runtime.
const r2Host = (() => {
  const base = process.env.NEXT_PUBLIC_DATA_BASE || DEFAULT_DATA_BASE;
  try {
    return new URL(base).origin;
  } catch {
    return DEFAULT_DATA_BASE;
  }
})();

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    // worker-src blob: required by MapLibre GL JS (spawns a Worker from a blob URL).
    value: [
      "default-src 'self'",
      "script-src 'self'",
      "img-src 'self' data: https:",
      `connect-src 'self' ${r2Host}`,
      "worker-src blob:",
      "style-src 'self' 'unsafe-inline'",
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_DATA_BASE: process.env.NEXT_PUBLIC_DATA_BASE || DEFAULT_DATA_BASE,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
