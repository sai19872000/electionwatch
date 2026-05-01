# ElectionWatch India 2026

Live assembly election results dashboard for May 4, 2026 counting day.  
States: Assam · Kerala · Tamil Nadu · West Bengal · Puducherry (824 constituencies)

## Dev setup

```bash
cd apps/electionwatch
npm install
npm run dev   # opens http://localhost:3000
```

Dev mode uses `/fixtures/` data (sample fixtures checked in at `public/fixtures/`). No R2 credentials needed.

## Point at R2 (production)

Create `.env.local`:

```
NEXT_PUBLIC_DATA_BASE=https://<r2-public-id>.r2.dev
```

Then `npm run dev` or `npm run build`.

## Build (static export)

```bash
npm run build   # produces apps/electionwatch/out/
```

## Cloudflare Pages config

| Setting | Value |
|---|---|
| Build command | `cd apps/electionwatch && npm install && npm run build` |
| Build output | `apps/electionwatch/out` |
| Root | `/` |
| Node version | 20+ |

## Environment variables (CF Pages → Settings → Environment variables)

| Key | Value |
|---|---|
| `NEXT_PUBLIC_DATA_BASE` | `https://<r2-public-id>.r2.dev` |
