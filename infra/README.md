# infra/

Operational config for deployable surfaces.

| File                                | Surface          | Notes                                       |
|-------------------------------------|------------------|---------------------------------------------|
| `electionwatch-scraper.service`     | scraper (systemd) | EnvironmentFile points at `%h/factory/.env.electionwatch`; ExecStartPre asserts file exists, is readable, and is mode 600 (see "Scraper env file" below). |

The CF Worker's `wrangler.toml` is co-located in `worker/` per CF
convention.

R2 bucket: `ew-snapshots` (reused from prior `20260430_202044` run);
`static/` prefix added for immutable data baked at CI time.

CF Pages project: `electionwatch`, custom domain
`electionwatch.saiteja.ai` (DNS already wired from prior run; devops
deploys via direct upload — no GitHub source connection).

## Scraper env file

The scraper reads R2 keys + ECI config from `~/factory/.env.electionwatch`
(NOT in this repo — gitignored, lives in the factory env dir). The
systemd unit refuses to start unless that file is present, readable,
and mode `600` (no group/other access). To install:

```bash
# 1. Create / populate the env file
$EDITOR ~/factory/.env.electionwatch
# Required keys: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
# R2_BUCKET=ew-snapshots, ECI_BASE_PATH

# 2. Lock down permissions — required by ExecStartPre
chmod 600 ~/factory/.env.electionwatch
ls -l ~/factory/.env.electionwatch   # → -rw-------

# 3. Install the unit and start
mkdir -p ~/.config/systemd/user
cp infra/electionwatch-scraper.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now electionwatch-scraper.service
journalctl --user -u electionwatch-scraper -f
```

If the mode check fails, `journalctl --user -u electionwatch-scraper`
shows `electionwatch-scraper: env file mode <octal> (expected 600)` and
the service refuses to come up.
