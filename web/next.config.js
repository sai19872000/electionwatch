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

const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_DATA_BASE: process.env.NEXT_PUBLIC_DATA_BASE || DEFAULT_DATA_BASE,
  },
};

module.exports = nextConfig;
