# electionwatch

Public Indian election results dashboard — **electionwatch.saiteja.ai**

Aspirational v1 build targeting the **5-state assembly counting on
May 4, 2026** (Assam 126, Kerala 140, Tamil Nadu 234, West Bengal 294,
Puducherry 30 = 824 ACs).

## Layout

| Path       | Purpose                                                      |
|------------|--------------------------------------------------------------|
| `web/`     | Next.js 15 app (static export → CF Pages)                    |
| `scraper/` | Python ECI scraper (systemd-managed counting-day worker)     |
| `worker/`  | Cloudflare Worker watchdog (R2 read, snapshot diffing)       |
| `data/`    | Build-time data baking (TopoJSON simplification, historical) |
| `infra/`   | systemd unit, wrangler config, R2 setup notes                |

Architecture spec (run `20260501_122446`):
`sai-ai-factory/outputs/20260501_122446/architect_electionwatch_20260501_122447.md`

## Status

- Repo created: 2026-05-01 (devops, run `20260501_122446`)
- Working branch: `feat/electionwatch-v1-aspirational`
- Baseline `web/` migrated from `sai-ai-factory/apps/electionwatch/`
- Baseline `scraper/` + `worker/` migrated from
  `sai-ai-factory/services/electionwatch_scraper/` and
  `sai-ai-factory/services/electionwatch_watchdog/`

`dev_backend`, `dev_frontend`, `data` will land v1 changes onto
`feat/electionwatch-v1-aspirational` in parallel. `devops` ships the
production deploy after `qa_lead` PASS.
