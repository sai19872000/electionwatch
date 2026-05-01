/**
 * ElectionWatch static data build pipeline.
 *
 * Takes raw inputs (TopoJSON shards, historical JSONs, alliance map,
 * search index) and emits content-hashed files to data/dist/.
 *
 * Usage:
 *   npx ts-node data/build.ts          # full build
 *   npx ts-node data/build.ts --dry    # print manifest only
 *
 * Outputs:
 *   data/dist/<filename>.<hash8>.ext   — content-addressed artifacts
 *   data/dist/manifest.json            — maps logical → hashed filename
 *
 * Per architect §Build: "static files cached forever (immutable URLs +
 * content-hash filenames)". This pipeline enforces that contract.
 */

import { createHash } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, extname, basename } from "path";

const ROOT = join(__dirname);
const DIST = join(ROOT, "dist");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function contentHash(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex").slice(0, 8);
}

function readBuf(relPath: string): Buffer {
  return readFileSync(join(ROOT, relPath));
}

function readJson(relPath: string): unknown {
  return JSON.parse(readBuf(relPath).toString("utf8"));
}

type ManifestEntry = {
  logical: string;
  hashed: string;
  sizeRaw: number;
  sizeGz?: number;
};

const manifest: Record<string, ManifestEntry> = {};

function emit(logicalName: string, buf: Buffer): string {
  const ext = extname(logicalName);
  const base = basename(logicalName, ext);
  const hash = contentHash(buf);
  const hashedName = `${base}.${hash}${ext}`;
  const outPath = join(DIST, hashedName);

  if (!process.argv.includes("--dry")) {
    writeFileSync(outPath, buf);
  }

  manifest[logicalName] = {
    logical: logicalName,
    hashed: hashedName,
    sizeRaw: buf.byteLength,
  };

  console.log(`  [emit] ${logicalName} → ${hashedName} (${Math.round(buf.byteLength / 1024)}KB)`);
  return hashedName;
}

function emitJson(logicalName: string, data: unknown): string {
  const buf = Buffer.from(JSON.stringify(data), "utf8");
  return emit(logicalName, buf);
}

// ---------------------------------------------------------------------------
// Build steps
// ---------------------------------------------------------------------------

console.log("🗺  ElectionWatch data build — " + new Date().toISOString());

mkdirSync(DIST, { recursive: true });

// 1. TopoJSON shards (5 states)
const STATE_CODES = ["S03", "S11", "S22", "S25", "S26"] as const;
type StateCode = (typeof STATE_CODES)[number];

console.log("\n[1] TopoJSON shards");
for (const sc of STATE_CODES) {
  const buf = readBuf(`topojson/india_constituencies_${sc}.topojson`);
  emit(`india_constituencies_${sc}.topojson`, buf);
}

// 2. Overview SVG
console.log("\n[2] Overview SVG");
const svgBuf = readBuf("svg/india_overview.svg");
emit("india_overview.svg", svgBuf);

// 3. Historical LS JSON files
console.log("\n[3] Historical LS data");
const ls2019 = readJson("historical/historical_2019_ls.json");
const ls2024 = readJson("historical/historical_2024_ls.json");
emitJson("historical_2019_ls.json", ls2019);
emitJson("historical_2024_ls.json", ls2024);

// 4. Historical assembly JSON files (per state)
console.log("\n[4] Historical assembly data");
const STATE_NAMES: Record<StateCode, string> = {
  S03: "assam",
  S11: "kerala",
  S22: "tamilnadu",
  S25: "westbengal",
  S26: "puducherry",
};
for (const sc of STATE_CODES) {
  const name = STATE_NAMES[sc];
  const data = readJson(`historical/historical_assembly_2021_${name}.json`);
  emitJson(`historical_assembly_2021_${name}.json`, data);
}

// 5. Alliance map
console.log("\n[5] Alliance map");
const allianceMap = readJson("alliance_map_2026.json");
emitJson("alliance_map_2026.json", allianceMap);

// 6. Search index
console.log("\n[6] Search index");
const searchIndex = readJson("search_index.json");
emitJson("search_index.json", searchIndex);

// 7. Write manifest
console.log("\n[7] Manifest");
const manifestBuf = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");
if (!process.argv.includes("--dry")) {
  writeFileSync(join(DIST, "manifest.json"), manifestBuf);
}

const totalKb = Object.values(manifest).reduce(
  (acc, e) => acc + e.sizeRaw,
  0
);
console.log(`\n✓ ${Object.keys(manifest).length} artifacts, ${Math.round(totalKb / 1024)} KB total raw`);
console.log(`  Manifest written to data/dist/manifest.json`);

if (process.argv.includes("--dry")) {
  console.log("\n[dry-run] No files written.");
}
