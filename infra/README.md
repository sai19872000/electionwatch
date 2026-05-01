# infra/

Operational config for deployable surfaces.

| File                                | Surface          | Notes                                       |
|-------------------------------------|------------------|---------------------------------------------|
| `electionwatch-scraper.service`     | scraper (systemd) | EnvironmentFile path may need updating once the prod env-file location is finalized; today it points at `%h/factory/.env.electionwatch` from the prior run. |

The CF Worker's `wrangler.toml` is co-located in `worker/` per CF
convention.

R2 bucket: `ew-snapshots` (reused from prior `20260430_202044` run);
`static/` prefix added for immutable data baked at CI time.

CF Pages project: `electionwatch`, custom domain
`electionwatch.saiteja.ai` (DNS already wired from prior run; devops
swaps Pages target on deploy).
