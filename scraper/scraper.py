#!/usr/bin/env python3
"""
ElectionWatch scraper — Python 3.11, home server.

30s loop, 5 concurrent state fetches + 1 partywise summary (asyncio + httpx).
Parses ECI HTML tables (BeautifulSoup / lxml).

Shape B selected: no per-state CEO parsers. On ≥2 consecutive ECI failures
the site-wide snapshot.json flips stale:true (uniform banner). Honest > inconsistent.

Required env vars (load from ~/factory/.env.electionwatch via systemd EnvironmentFile):
  ECI_BASE_PATH          e.g. AcResultGenMay2026 (no trailing slash)
  R2_ACCOUNT_ID
  R2_BUCKET              default: ew-snapshots
  R2_ACCESS_KEY_ID
  R2_SECRET
  TG_CHAT_ID             Telegram chat id for p0 alerts
"""

from __future__ import annotations

import asyncio
import gzip
import json
import logging
import os
import subprocess
import sys
import time
from copy import deepcopy
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

import boto3
import httpx
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
FACTORY_DIR = Path.home() / "factory"
ECI_BASE = os.getenv("ECI_BASE_PATH", "")
ECI_HOST = "https://results.eci.gov.in"
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
R2_BUCKET = os.getenv("R2_BUCKET", "ew-snapshots")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET = os.getenv("R2_SECRET", "")
TG_CHAT_ID = os.getenv("TG_CHAT_ID", "")
TG_SEND = str(FACTORY_DIR / "scripts" / "tg_send.sh")

LOOP_INTERVAL_S = 30
WATCHDOG_TIMEOUT_S = 90
STALE_FAILURES_THRESHOLD = 2
MAX_EVENTS = 200
BACKOFF_BASE = 2.0
BACKOFF_MAX = 60.0
HTTP_TIMEOUT = 20.0

DISK_STATE_PATH = FACTORY_DIR / "runs" / "electionwatch_state.json"
LOG_PATH = FACTORY_DIR / "logs" / "electionwatch_scraper.log"

STATE_CONFIGS: dict[str, dict] = {
    "S03": {"name": "Assam",       "total_seats": 126},
    "S11": {"name": "Kerala",      "total_seats": 140},
    "S22": {"name": "Tamil Nadu",  "total_seats": 234},
    "S25": {"name": "West Bengal", "total_seats": 294},
    "U06": {"name": "Puducherry",  "total_seats": 30},
}

# Best-effort mapping of major parties to NDA / INDIA / OTH.
# Update before counting day once formal alliances confirmed.
PARTY_ALLIANCE: dict[str, str] = {
    "BJP": "NDA", "NDA": "NDA", "NDAM": "NDA", "AJYCP": "NDA",
    "AGP": "NDA", "BPF": "NDA", "UPPL": "NDA",
    "INC": "INDIA", "TMC": "INDIA", "AITC": "INDIA",
    "CPM": "INDIA", "CPI": "INDIA", "LDF": "INDIA", "UDF": "INDIA",
    "DMK": "INDIA", "VCK": "INDIA", "MDMK": "INDIA",
    "IUML": "INDIA", "KEC": "INDIA",
    "NCP": "INDIA", "SP": "INDIA", "RJD": "INDIA",
}

IST = timezone(timedelta(hours=5, minutes=30))

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
_handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]
try:
    _handlers.append(logging.FileHandler(LOG_PATH))
except OSError:
    pass
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    handlers=_handlers,
)
log = logging.getLogger("ew.scraper")


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------
class ParseDriftError(Exception):
    """Raised when the ECI HTML structure no longer matches expected schema."""


# ---------------------------------------------------------------------------
# ECI URL helpers
# ---------------------------------------------------------------------------
def eci_url(path: str) -> str:
    return f"{ECI_HOST}/{ECI_BASE}/{path}"


def state_page_url(code: str) -> str:
    return eci_url(f"ConstituencywiseResult-{code}.htm")


def partywise_url(code: str = "S22") -> str:
    """Single partywise page; used as a 'heartbeat' fetch for the watchdog."""
    return eci_url(f"PartywiseResult-{code}.htm")


def statewise_url() -> str:
    return eci_url("Statewise.htm")


# ---------------------------------------------------------------------------
# HTML parsing
# ---------------------------------------------------------------------------
_DECLARED_TOKENS = {"result declared", "won", "elected"}
_LEADING_TOKENS = {"leading", "counting in progress", "postal votes"}


def _norm_text(td: Any) -> str:
    return td.get_text(" ", strip=True)


def _find_results_table(soup: BeautifulSoup) -> Any | None:
    """Find the main results table (largest table with >2 data rows)."""
    best = None
    best_rows = 0
    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        # Must have numeric content in first cell of some row (AC no.)
        data_rows = 0
        for row in rows[1:]:
            cells = row.find_all("td")
            if cells and cells[0].get_text(strip=True).isdigit():
                data_rows += 1
        if data_rows > best_rows:
            best_rows = data_rows
            best = table
    return best if best_rows > 0 else None


def _detect_columns(header_row: Any) -> dict[str, int]:
    """Map column indices from header text tokens."""
    cols: dict[str, int] = {}
    texts = [_norm_text(c).lower() for c in header_row.find_all(["td", "th"])]
    for i, t in enumerate(texts):
        if "sl" in t or "ac no" in t or t == "no":
            cols.setdefault("ac_no", i)
        elif "constituency" in t and "ac_no" not in cols:
            cols.setdefault("ac_no", i - 1) if i > 0 else None
        if "constituency" in t:
            cols.setdefault("name", i)
        if ("leading" in t or "winning" in t or "candidate" in t) and "trail" not in t:
            cols.setdefault("leading_candidate", i)
        if "party" in t:
            if "leading_candidate" in cols and i > cols["leading_candidate"]:
                cols.setdefault("leading_party", i)
        if "trail" in t and "candidate" in t:
            cols.setdefault("trailing_candidate", i)
        if "margin" in t:
            cols.setdefault("margin", i)
        if "round" in t and "total" not in t:
            cols.setdefault("rounds_completed", i)
        if "total" in t and "round" in t:
            cols.setdefault("rounds_total", i)
        if "status" in t:
            cols.setdefault("status", i)
    return cols


def parse_constituency_page(html: str, state_code: str) -> list[dict]:
    """
    Parse a ConstituencywiseResult-SXXX.htm page.
    Returns list of constituency dicts matching the state_<code>.json schema.
    Raises ParseDriftError if mandatory columns cannot be found.
    """
    soup = BeautifulSoup(html, "lxml")
    table = _find_results_table(soup)
    if table is None:
        raise ParseDriftError(f"[{state_code}] No results table found in HTML")

    rows = table.find_all("tr")
    if not rows:
        raise ParseDriftError(f"[{state_code}] Results table is empty")

    # Try first 3 rows as potential headers (ECI pages sometimes have multi-row headers)
    cols: dict[str, int] = {}
    data_start = 1
    for i, row in enumerate(rows[:4]):
        cols = _detect_columns(row)
        if "name" in cols or "leading_party" in cols:
            data_start = i + 1
            break

    required = {"name"}
    missing = required - set(cols)
    if missing:
        raise ParseDriftError(f"[{state_code}] Cannot detect columns {missing}; headers={rows[:2]}")

    now_ist = datetime.now(IST).isoformat()
    constituencies: list[dict] = []

    for row in rows[data_start:]:
        cells = row.find_all("td")
        if not cells:
            continue

        def cell(key: str, default: str = "") -> str:
            idx = cols.get(key)
            if idx is None or idx >= len(cells):
                return default
            return _norm_text(cells[idx])

        ac_no_raw = cell("ac_no")
        if not ac_no_raw.isdigit():
            continue  # skip header-repeat rows or empty rows

        raw_status = cell("status", "counting in progress").lower()
        if any(t in raw_status for t in _DECLARED_TOKENS):
            status = "declared"
        else:
            status = "leading"

        margin_raw = cell("margin", "0").replace(",", "").strip()
        try:
            margin = int(margin_raw) if margin_raw.isdigit() else 0
        except ValueError:
            margin = 0

        def parse_int(key: str) -> int:
            v = cell(key, "0").replace(",", "").strip()
            try:
                return int(v) if v.isdigit() else 0
            except ValueError:
                return 0

        constituencies.append({
            "ac_no": int(ac_no_raw),
            "name": cell("name"),
            "leading_candidate": cell("leading_candidate"),
            "leading_party": cell("leading_party"),
            "leading_margin": margin,
            "rounds_completed": parse_int("rounds_completed"),
            "rounds_total": parse_int("rounds_total"),
            "status": status,
            "last_change_ts": now_ist,
        })

    if not constituencies:
        raise ParseDriftError(f"[{state_code}] Parsed 0 constituencies from table")

    return constituencies


def parse_statewise_page(html: str) -> dict[str, dict]:
    """
    Parse Statewise.htm → {state_code: {leading: {PARTY: N}, declared: N}}
    Best-effort; used by watchdog only.
    """
    soup = BeautifulSoup(html, "lxml")
    results: dict[str, dict] = {}
    # Partywise pages have tables with party-name / seats-won / seats-leading columns
    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        if len(rows) < 3:
            continue
        for row in rows[1:]:
            cells = row.find_all("td")
            if len(cells) < 3:
                continue
            # We're looking for state name rows
            text = cells[0].get_text(strip=True)
            for code, cfg in STATE_CONFIGS.items():
                if cfg["name"].lower() in text.lower():
                    # Try to extract total won + leading
                    def safe_int(idx: int) -> int:
                        if idx >= len(cells):
                            return 0
                        v = cells[idx].get_text(strip=True).replace(",", "")
                        try:
                            return int(v)
                        except ValueError:
                            return 0
                    results[code] = {"total_tally": safe_int(1) + safe_int(2)}
    return results


def parse_partywise_page(html: str, state_code: str) -> dict[str, int]:
    """
    Parse PartywiseResult-SXXX.htm → {party_abbr: seats_total (won+leading)}
    """
    soup = BeautifulSoup(html, "lxml")
    tally: dict[str, int] = {}
    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        if len(rows) < 3:
            continue
        # Detect header: look for won / leading columns
        won_idx = lead_idx = party_idx = None
        header_cells = rows[0].find_all(["td", "th"])
        for i, c in enumerate(header_cells):
            t = c.get_text(strip=True).lower()
            if "party" in t or "abbr" in t:
                party_idx = i
            elif "won" in t:
                won_idx = i
            elif "lead" in t:
                lead_idx = i
        if party_idx is None:
            continue
        for row in rows[1:]:
            cells = row.find_all("td")
            if not cells or party_idx >= len(cells):
                continue
            party = cells[party_idx].get_text(strip=True)
            if not party or party.lower() in {"total", "grand total", "others"}:
                continue
            won = 0
            lead = 0
            if won_idx is not None and won_idx < len(cells):
                try:
                    won = int(cells[won_idx].get_text(strip=True).replace(",", "") or 0)
                except ValueError:
                    pass
            if lead_idx is not None and lead_idx < len(cells):
                try:
                    lead = int(cells[lead_idx].get_text(strip=True).replace(",", "") or 0)
                except ValueError:
                    pass
            total = won + lead
            if total > 0:
                tally[party] = tally.get(party, 0) + total
        if tally:
            break  # found the results table
    return tally


# ---------------------------------------------------------------------------
# Alliance rollup
# ---------------------------------------------------------------------------
def roll_up_alliances(party_tally: dict[str, int]) -> dict[str, int]:
    result: dict[str, int] = {"INDIA": 0, "NDA": 0, "OTH": 0}
    for party, seats in party_tally.items():
        bucket = PARTY_ALLIANCE.get(party, "OTH")
        result[bucket] = result.get(bucket, 0) + seats
    return result


# ---------------------------------------------------------------------------
# R2 upload
# ---------------------------------------------------------------------------
def _make_r2_client() -> Any:
    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET,
        region_name="auto",
    )


def _upload_sync(key: str, payload: bytes) -> None:
    """Atomic upload: write .tmp key → copy → delete .tmp."""
    client = _make_r2_client()
    tmp_key = f".tmp/{key}"
    put_kwargs: dict = {
        "Bucket": R2_BUCKET,
        "Key": tmp_key,
        "Body": payload,
        "ContentType": "application/json",
        "ContentEncoding": "gzip",
        "CacheControl": "public, max-age=15, s-maxage=15",
    }
    client.put_object(**put_kwargs)
    client.copy_object(
        Bucket=R2_BUCKET,
        CopySource={"Bucket": R2_BUCKET, "Key": tmp_key},
        Key=key,
        ContentType="application/json",
        ContentEncoding="gzip",
        CacheControl="public, max-age=15, s-maxage=15",
        MetadataDirective="REPLACE",
    )
    client.delete_object(Bucket=R2_BUCKET, Key=tmp_key)


async def upload_json(key: str, data: dict) -> None:
    payload = gzip.compress(json.dumps(data, ensure_ascii=False).encode())
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _upload_sync, key, payload)
    log.info("r2_upload key=%s bytes=%d", key, len(payload))


# ---------------------------------------------------------------------------
# Telegram alert
# ---------------------------------------------------------------------------
def fire_tg_alert(msg: str) -> None:
    if not TG_CHAT_ID or not Path(TG_SEND).exists():
        log.warning("tg_alert skipped (TG_CHAT_ID or tg_send.sh not configured): %s", msg)
        return
    try:
        subprocess.run(
            [TG_SEND, TG_CHAT_ID, f"[electionwatch p0] {msg}"],
            timeout=10,
            check=False,
        )
    except Exception as e:
        log.error("tg_alert failed: %s", e)


# ---------------------------------------------------------------------------
# On-disk crash state
# ---------------------------------------------------------------------------
def load_disk_state() -> dict:
    try:
        return json.loads(DISK_STATE_PATH.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_disk_state(state: dict) -> None:
    DISK_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = DISK_STATE_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(state))
    tmp.replace(DISK_STATE_PATH)


# ---------------------------------------------------------------------------
# Event diffing
# ---------------------------------------------------------------------------
def diff_constituencies(
    prev: list[dict],
    curr: list[dict],
    state_code: str,
    now_ist: str,
) -> list[dict]:
    """Compare prev vs curr for lead_flip and result_declared events."""
    prev_map = {c["ac_no"]: c for c in prev}
    events: list[dict] = []
    for c in curr:
        p = prev_map.get(c["ac_no"])
        if p is None:
            continue
        # Lead flip
        if (
            c.get("leading_party")
            and p.get("leading_party")
            and c["leading_party"] != p["leading_party"]
        ):
            events.append({
                "type": "lead_flip",
                "ac_no": c["ac_no"],
                "state": state_code,
                "from": p["leading_party"],
                "to": c["leading_party"],
                "ts": now_ist,
            })
        # Result declared (transition leading → declared)
        if c.get("status") == "declared" and p.get("status") == "leading":
            events.append({
                "type": "result_declared",
                "ac_no": c["ac_no"],
                "state": state_code,
                "winner": c.get("leading_candidate", ""),
                "party": c.get("leading_party", ""),
                "margin": c.get("leading_margin", 0),
                "ts": now_ist,
            })
    return events


# ---------------------------------------------------------------------------
# Backoff helper
# ---------------------------------------------------------------------------
async def fetch_with_backoff(
    client: httpx.AsyncClient,
    url: str,
    max_retries: int = 3,
) -> httpx.Response:
    delay = 1.0
    last_exc: Exception | None = None
    for attempt in range(max_retries):
        try:
            resp = await client.get(url, follow_redirects=True)
            if resp.status_code in (503, 504):
                raise httpx.HTTPStatusError(
                    f"HTTP {resp.status_code}", request=resp.request, response=resp
                )
            return resp
        except (httpx.HTTPStatusError, httpx.TransportError) as exc:
            last_exc = exc
            log.warning("fetch attempt %d/%d failed url=%s err=%s", attempt + 1, max_retries, url, exc)
            if attempt < max_retries - 1:
                await asyncio.sleep(min(delay, BACKOFF_MAX))
                delay *= BACKOFF_BASE
    raise last_exc or RuntimeError(f"fetch failed: {url}")


# ---------------------------------------------------------------------------
# Scraper main class
# ---------------------------------------------------------------------------
class ElectionScraper:
    def __init__(self) -> None:
        self.consecutive_failures = 0
        self.last_push_ts: float = 0.0
        # per-state constituency list from previous cycle (for diffing)
        self.prev_constituencies: dict[str, list[dict]] = {}
        # full events rolling buffer (loaded from disk on startup)
        self.events: list[dict] = []
        self.disk_state: dict = {}
        self._watchdog_alerted = False

    def _now_ist(self) -> str:
        return datetime.now(IST).isoformat()

    def _scraper_run_id(self) -> str:
        return datetime.now(IST).strftime("%Y%m%d_%H%M%S")

    async def start(self) -> None:
        if not ECI_BASE:
            log.error("ECI_BASE_PATH env var not set — run smoke_probe.py first")
            sys.exit(1)

        # Restore crash state
        self.disk_state = load_disk_state()
        self.prev_constituencies = self.disk_state.get("prev_constituencies", {})
        self.events = self.disk_state.get("events", [])[-MAX_EVENTS:]

        log.info("scraper starting ECI_BASE_PATH=%s R2_BUCKET=%s", ECI_BASE, R2_BUCKET)

        # Run watchdog check as a background task
        asyncio.create_task(self._watchdog_task())

        while True:
            cycle_start = time.monotonic()
            try:
                await self._cycle()
            except Exception as exc:
                log.error("cycle error: %s", exc, exc_info=True)
                self.consecutive_failures += 1
            elapsed = time.monotonic() - cycle_start
            await asyncio.sleep(max(0.0, LOOP_INTERVAL_S - elapsed))

    async def _watchdog_task(self) -> None:
        while True:
            await asyncio.sleep(10)
            if self.last_push_ts > 0:
                age = time.time() - self.last_push_ts
                if age > WATCHDOG_TIMEOUT_S and not self._watchdog_alerted:
                    msg = (
                        f"No successful R2 push in {int(age)}s "
                        f"(consecutive_failures={self.consecutive_failures}). "
                        f"Check scraper logs at {LOG_PATH}"
                    )
                    log.error("WATCHDOG: %s", msg)
                    fire_tg_alert(msg)
                    self._watchdog_alerted = True
                elif age <= WATCHDOG_TIMEOUT_S:
                    self._watchdog_alerted = False

    async def _cycle(self) -> None:
        now_ist = self._now_ist()
        run_id = self._scraper_run_id()

        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT, headers={"User-Agent": "ElectionWatch/1.0"}) as client:
            # Fan out 5 state fetches + 1 partywise concurrently
            state_tasks = {
                code: asyncio.create_task(
                    fetch_with_backoff(client, state_page_url(code))
                )
                for code in STATE_CONFIGS
            }
            partywise_task = asyncio.create_task(
                fetch_with_backoff(client, partywise_url())
            )

            # Collect results; track per-state failures
            state_htmls: dict[str, str | None] = {}
            any_success = False
            for code, task in state_tasks.items():
                try:
                    resp = await task
                    resp.raise_for_status()
                    state_htmls[code] = resp.text
                    any_success = True
                except Exception as exc:
                    log.error("fetch failed state=%s err=%s", code, exc)
                    state_htmls[code] = None

            try:
                pw_resp = await partywise_task
                pw_resp.raise_for_status()
                partywise_html = pw_resp.text
            except Exception as exc:
                log.error("partywise fetch failed: %s", exc)
                partywise_html = None

        if not any_success:
            self.consecutive_failures += 1
        else:
            self.consecutive_failures = 0

        stale = self.consecutive_failures >= STALE_FAILURES_THRESHOLD

        # Parse state pages
        new_constituencies: dict[str, list[dict]] = {}
        state_leading: dict[str, dict[str, int]] = {}
        state_declared: dict[str, int] = {}

        for code, html in state_htmls.items():
            if html is None:
                # Keep previous data for this state
                new_constituencies[code] = self.prev_constituencies.get(code, [])
            else:
                try:
                    parsed = parse_constituency_page(html, code)
                    new_constituencies[code] = parsed

                    # Diff for events
                    prev = self.prev_constituencies.get(code, [])
                    if prev:
                        new_events = diff_constituencies(prev, parsed, code, now_ist)
                        self.events.extend(new_events)
                        self.events = self.events[-MAX_EVENTS:]
                        if new_events:
                            log.info("events code=%s count=%d", code, len(new_events))
                except ParseDriftError as exc:
                    log.error("PARSE_DRIFT %s", exc)
                    fire_tg_alert(f"ParseDrift on {code}: {exc}")
                    new_constituencies[code] = self.prev_constituencies.get(code, [])

        # Build per-state tally from parsed constituencies
        for code, consts in new_constituencies.items():
            leading: dict[str, int] = {}
            declared = 0
            for c in consts:
                party = c.get("leading_party", "")
                if party:
                    leading[party] = leading.get(party, 0) + 1
                if c.get("status") == "declared":
                    declared += 1
            state_leading[code] = leading
            state_declared[code] = declared

        # Partywise page → national alliance view
        national_view: dict[str, int] = {"INDIA": 0, "NDA": 0, "OTH": 0}
        if partywise_html:
            try:
                pw_tally = parse_partywise_page(partywise_html, "S22")
                national_view = roll_up_alliances(pw_tally)
            except Exception as exc:
                log.warning("partywise parse failed: %s", exc)

        # If partywise empty, roll up from state tallies
        if sum(national_view.values()) == 0:
            combined: dict[str, int] = {}
            for tally in state_leading.values():
                for party, n in tally.items():
                    combined[party] = combined.get(party, 0) + n
            national_view = roll_up_alliances(combined)

        # ---------------------------------------------------------------
        # Build snapshot.json
        # ---------------------------------------------------------------
        snapshot: dict = {
            "as_of": now_ist,
            "scraper_run_id": run_id,
            "states": {
                code: {
                    "name": cfg["name"],
                    "total_seats": cfg["total_seats"],
                    "leading": state_leading.get(code, {}),
                    "declared": state_declared.get(code, 0),
                }
                for code, cfg in STATE_CONFIGS.items()
            },
            "national_alliance_view": national_view,
            "data_source": "eci_primary",
            "stale": stale,
        }

        # Build per-state files
        state_files: dict[str, dict] = {}
        for code, cfg in STATE_CONFIGS.items():
            state_files[code] = {
                "as_of": now_ist,
                "state": cfg["name"],
                "code": code,
                "constituencies": new_constituencies.get(code, []),
            }

        events_payload = {"events": self.events}

        # ---------------------------------------------------------------
        # Upload to R2
        # ---------------------------------------------------------------
        upload_errors: list[str] = []
        try:
            await upload_json("snapshot.json", snapshot)
            for code, sf in state_files.items():
                await upload_json(f"state_{code}.json", sf)
            await upload_json("events.json", events_payload)

            self.last_push_ts = time.time()
            self.consecutive_failures = max(0, self.consecutive_failures - 1)
            log.info("cycle OK run_id=%s stale=%s", run_id, stale)
        except Exception as exc:
            log.error("r2 upload failed: %s", exc)
            upload_errors.append(str(exc))
            self.consecutive_failures += 1

        # ---------------------------------------------------------------
        # Update prev state and persist to disk
        # ---------------------------------------------------------------
        if not upload_errors:
            self.prev_constituencies = new_constituencies
            save_disk_state({
                "last_push_ts": self.last_push_ts,
                "run_id": run_id,
                "consecutive_failures": self.consecutive_failures,
                "prev_constituencies": new_constituencies,
                "events": self.events,
            })


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    asyncio.run(ElectionScraper().start())
