# ElectionWatch Scraper

Python 3.11 scraper for the 5-state assembly counting on May 4, 2026. Polls
ECI every 30 seconds, diffs against the previous cycle, emits lead-flip and
result-declared events, and atomically writes three JSON files to Cloudflare R2.

## Architecture

```
ECI portal (primary) ──────────────────────────────────┐
                                                        ▼
per-state CEO portal (fallback on 503/timeout) → scraper.py (30s loop)
                                                        │
                                   atomic R2 writes (gzip)
                                        ├─ live/snapshot.json
                                        ├─ live/state_<code>.json (×5)
                                        └─ live/events.json (rolling 200)
```

## Requirements

```
pip install -r requirements.txt
# Optional (schema validation):
pip install jsonschema
```

## Environment variables

Copy `env.template` to `~/factory/.env.electionwatch` and fill in values.

| Variable | Required | Description |
|----------|----------|-------------|
| `ECI_BASE_PATH` | Yes | ECI base path, e.g. `AcResultGenMay2026`. Run `smoke_probe.py` to confirm. |
| `R2_ENDPOINT` | Yes | Cloudflare R2 endpoint: `https://<CF_ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_BUCKET` | No | R2 bucket name (default: `ew-snapshots`) |
| `R2_ACCESS_KEY_ID` | Yes | R2 API token key ID |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 API token secret |
| `TG_CHAT_ID` | No | Telegram chat ID for P0 alerts (scraper stale, parse drift) |
| `CEO_BASE_S03` | No | Assam CEO portal base path — fallback on ECI 503/timeout |
| `CEO_BASE_S11` | No | Kerala CEO portal base path |
| `CEO_BASE_S22` | No | Tamil Nadu CEO portal base path |
| `CEO_BASE_S25` | No | West Bengal CEO portal base path |
| `CEO_BASE_U06` | No | Puducherry CEO portal base path |

CEO portal base paths use the same `ConstituencywiseResult-<code>.htm` URL
structure as ECI. Example: `CEO_BASE_S22=https://www.elections.tn.gov.in/AcResultGenMay2026`

## Run

```bash
# 1. Confirm ECI portal is live (do this on/after May 2, 2026)
python3 smoke_probe.py

# 2. Start scraper
ECI_BASE_PATH=AcResultGenMay2026 python3 -u scraper.py

# Or via systemd (after copying env file):
systemctl --user start electionwatch-scraper
systemctl --user status electionwatch-scraper
journalctl --user -u electionwatch-scraper -f
# Also tailed at:
tail -f ~/factory/logs/electionwatch_scraper.log
```

## Systemd unit

The unit file is at `../infra/electionwatch-scraper.service`. Install:

```bash
mkdir -p ~/.config/systemd/user
cp ../infra/electionwatch-scraper.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now electionwatch-scraper
```

The unit reads `~/factory/.env.electionwatch` via `EnvironmentFile`.

## Test

```bash
cd ~/electionwatch/scraper
python3 -m pytest tests/ -v
```

Tests cover:
- `parse_constituency_page` — 11 cases against an ECI-structure HTML fixture
- `parse_partywise_page` — 4 cases including vote share extraction
- `diff_constituencies` — 7 smoke tests for lead_flip and result_declared
- Schema validation — fixture validates against `schemas/snapshot.schema.json`

## Snapshot schema (v1)

```json
{
  "version": 1,
  "as_of": "<ISO-8601 IST>",
  "scraper_run_id": "YYYYMMDD_HHMMSS",
  "states": [
    {
      "code": "S22",
      "name": "Tamil Nadu",
      "total_ac": 234,
      "declared": 52,
      "leading": { "DMK": 138, "AIADMK": 66, ... }
    },
    ...
  ],
  "national": {
    "declared": 177,
    "leading": { "DMK": 138, "BJP": 171, ... },
    "vote_share": {}
  },
  "data_source": "eci_primary | ceo_fallback | watchdog_degraded",
  "stale": false,
  "banner": null
}
```

`vote_share` is populated when ECI's partywise page includes vote count columns;
empty dict `{}` otherwise. Alliance-level rollups (NDA / INDIA / Others) are
computed client-side from `states[*].leading` using
`/static/alliance_map_2026.json`.

## CEO fallback

If a per-state ECI fetch returns 503 or times out, the scraper attempts the
configured CEO portal for that state (same HTML structure, NIC infra). States
with no CEO fallback configured retain last-known data for that cycle and
increment the consecutive-failure counter. A `ceo_fallback` source flag is
written to the snapshot.

## Watchdog

The CF Worker at `../worker/` runs every minute and writes a degraded snapshot
with `stale: true` and `data_source: "watchdog_degraded"` if the home-server
scraper hasn't pushed in >90 seconds.

## Validate schema fixtures

```bash
python3 validate.py           # all three fixtures
python3 validate.py snapshot  # snapshot fixture only
```
