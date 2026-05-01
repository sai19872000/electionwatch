/**
 * electionwatch-watchdog — Cloudflare Worker, scheduled cron */1 * * * *
 *
 * Purpose:
 *   If the home-server scraper hasn't pushed a fresh snapshot.json in >90s,
 *   this worker runs a minimal ECI fetch (1 GET to Statewise.htm), builds a
 *   degraded snapshot (schema v1), and writes it to R2. Frontend reads
 *   stale:true and shows the "Limited data — primary scraper recovering" banner.
 *
 * R2 binding: EW_SNAPSHOTS (bucket: ew-snapshots, public-read)
 * Env vars (set via `wrangler secret put`):
 *   ECI_BASE_PATH     — e.g. AcResultGenMay2026
 *   TG_BOT_TOKEN      — optional, for watchdog p0 alert
 *   TG_CHAT_ID        — optional
 *
 * Snapshot schema v1 (mirrors scraper.py):
 *   { version, as_of, scraper_run_id, states:[{code,name,total_ac,declared,leading}],
 *     national:{declared,leading,vote_share}, data_source, stale }
 */

const WATCHDOG_STALE_MS = 90_000;         // 90 seconds
const ECI_HOST = "https://results.eci.gov.in";
const CACHE_CONTROL = "public, max-age=15, s-maxage=15";
const SNAPSHOT_VERSION = 1;

const STATE_CONFIGS = {
  S03: { name: "Assam",       total_ac: 126 },
  S11: { name: "Kerala",      total_ac: 140 },
  S22: { name: "Tamil Nadu",  total_ac: 234 },
  S25: { name: "West Bengal", total_ac: 294 },
  U06: { name: "Puducherry",  total_ac: 30  },
};

// ---------------------------------------------------------------------------
// Scheduled handler
// ---------------------------------------------------------------------------
export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runWatchdog(env));
  },
};

async function runWatchdog(env) {
  const eciBase = env.ECI_BASE_PATH;
  if (!eciBase) {
    console.error("[watchdog] ECI_BASE_PATH not set — cannot run minimal scraper");
    return;
  }

  // 1. HEAD-check live/snapshot.json Last-Modified
  const snapshotMeta = await env.EW_SNAPSHOTS.head("live/snapshot.json");
  if (snapshotMeta) {
    const ageMs = Date.now() - snapshotMeta.uploaded.getTime();
    if (ageMs < WATCHDOG_STALE_MS) {
      console.log(`[watchdog] snapshot fresh (${Math.round(ageMs / 1000)}s old) — skipping`);
      return;
    }
    console.warn(`[watchdog] snapshot STALE (${Math.round(ageMs / 1000)}s old) — running minimal scraper`);
  } else {
    console.warn("[watchdog] live/snapshot.json not found in R2 — running minimal scraper");
  }

  // 2. Load existing snapshot for baseline (preserve last-known state data)
  let existingSnapshot = null;
  try {
    const obj = await env.EW_SNAPSHOTS.get("live/snapshot.json");
    if (obj) {
      const raw = await obj.text();
      existingSnapshot = JSON.parse(raw);
    }
  } catch (e) {
    console.warn("[watchdog] could not read existing snapshot:", e.message);
  }

  // 3. Fetch ECI Statewise.htm (1 GET)
  const statewiseUrl = `${ECI_HOST}/${eciBase}/Statewise.htm`;
  let freshStateTallies = {};
  try {
    const resp = await fetch(statewiseUrl, {
      headers: { "User-Agent": "ElectionWatch-Watchdog/1.0" },
      cf: { cacheTtl: 0 },  // bypass CF cache for this fetch
    });
    if (resp.ok) {
      const html = await resp.text();
      freshStateTallies = parseStatewiseHtml(html);
      console.log("[watchdog] statewise parse OK states:", Object.keys(freshStateTallies).length);
    } else {
      console.warn(`[watchdog] statewise fetch HTTP ${resp.status}`);
    }
  } catch (e) {
    console.warn("[watchdog] statewise fetch failed:", e.message);
  }

  // 4. Build degraded snapshot (schema v1)
  const nowIst = toIst(new Date());

  // Build states array (schema v1 uses array not object)
  const existingStateMap = {};
  if (existingSnapshot?.states) {
    // Support both old object format and new array format from existing snapshot
    if (Array.isArray(existingSnapshot.states)) {
      for (const s of existingSnapshot.states) {
        existingStateMap[s.code] = s;
      }
    } else {
      // Legacy object format (prior run)
      for (const [code, s] of Object.entries(existingSnapshot.states)) {
        existingStateMap[code] = s;
      }
    }
  }

  const degradedStates = [];
  for (const [code, cfg] of Object.entries(STATE_CONFIGS)) {
    const freshTally = freshStateTallies[code];
    const existing = existingStateMap[code];

    degradedStates.push({
      code,
      name: cfg.name,
      total_ac: cfg.total_ac,
      declared: freshTally?.declared ?? existing?.declared ?? 0,
      leading: freshTally?.leading ?? existing?.leading ?? {},
    });
  }

  // Build national from existing or zero
  const existingNational = existingSnapshot?.national ?? existingSnapshot?.national_alliance_view;
  const degradedNational = {
    declared: degradedStates.reduce((s, st) => s + (st.declared || 0), 0),
    leading: existingNational?.leading ?? {},
    vote_share: existingNational?.vote_share ?? {},
  };

  const degraded = {
    version: SNAPSHOT_VERSION,
    as_of: nowIst,
    scraper_run_id: `watchdog_${formatRunId(new Date())}`,
    states: degradedStates,
    national: degradedNational,
    data_source: "watchdog_degraded",
    stale: true,
    banner: "Limited data — primary scraper recovering",
  };

  // 5. Write degraded snapshot to R2
  try {
    const body = JSON.stringify(degraded);
    await env.EW_SNAPSHOTS.put("live/snapshot.json", body, {
      httpMetadata: {
        contentType: "application/json",
        cacheControl: CACHE_CONTROL,
      },
    });
    console.log("[watchdog] wrote degraded snapshot.json bytes:", body.length);
  } catch (e) {
    console.error("[watchdog] R2 put failed:", e.message);
  }

  // 6. Optional: fire Telegram alert
  if (env.TG_BOT_TOKEN && env.TG_CHAT_ID) {
    await sendTgAlert(
      env.TG_BOT_TOKEN,
      env.TG_CHAT_ID,
      `[electionwatch watchdog p0] Home scraper stale — degraded snapshot written at ${nowIst}`
    );
  }
}

// ---------------------------------------------------------------------------
// Minimal Statewise.htm parser
// Returns { S03: { leading: {ALL: N}, declared: N }, ... }
// Note: Statewise page provides aggregate totals only (no party breakdown).
// ---------------------------------------------------------------------------
function parseStatewiseHtml(html) {
  const results = {};

  const STATE_NAME_TO_CODE = {
    "assam": "S03",
    "kerala": "S11",
    "tamil nadu": "S22",
    "west bengal": "S25",
    "puducherry": "U06",
    "pondicherry": "U06",
  };

  // ECI statewise rows: State | Won | Leading | Others | Total
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;

  let rowMatch;
  while ((rowMatch = rowRe.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    const cells = [];
    let cellMatch;
    const cellReLocal = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    while ((cellMatch = cellReLocal.exec(rowHtml)) !== null) {
      cells.push(stripHtml(cellMatch[1]).trim());
    }
    if (cells.length < 4) continue;

    const stateName = cells[0].toLowerCase();
    const code = STATE_NAME_TO_CODE[stateName];
    if (!code) continue;

    const won = parseInt(cells[1], 10) || 0;
    const leading = parseInt(cells[2], 10) || 0;
    const total = won + leading;

    results[code] = {
      leading: total > 0 ? { ALL: total } : {},  // aggregate only — no party breakdown here
      declared: won,
    };
  }

  return results;
}

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toIst(d) {
  const offsetMs = 5.5 * 60 * 60 * 1000;
  const ist = new Date(d.getTime() + offsetMs);
  return ist.toISOString().replace("Z", "+05:30");
}

function formatRunId(d) {
  return d.toISOString().replace(/[-:T]/g, "").slice(0, 15);
}

async function sendTgAlert(token, chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (e) {
    console.warn("[watchdog] tg alert failed:", e.message);
  }
}
