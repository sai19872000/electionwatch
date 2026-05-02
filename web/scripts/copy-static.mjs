/**
 * copy-static.mjs
 * Copies data/dist/*.topojson -> web/public/static/ at build/dev time.
 * Writes both the hashed name (e.g. india_constituencies_S03.b063fb42.topojson)
 * AND the logical unhashed name (india_constituencies_S03.topojson) so
 * StateChoroplethDrillDown can fetch by logical name without a manifest lookup.
 * Run automatically via npm predev / prebuild hooks.
 */
import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dir, '..');
const dataDir = join(webRoot, '..', 'data', 'dist');
const destDir = join(webRoot, 'public', 'static');

await mkdir(destDir, { recursive: true });

const files = (await readdir(dataDir)).filter(f => f.endsWith('.topojson'));
let count = 0;
for (const src of files) {
  const srcPath = join(dataDir, src);
  // Copy with hashed name (cache-busting for CDN)
  const destPath = join(destDir, basename(src));
  await copyFile(srcPath, destPath);
  // Also copy with logical (unhashed) name so code can reference predictably:
  // india_constituencies_S03.b063fb42.topojson → india_constituencies_S03.topojson
  const logicalName = basename(src).replace(/\.[0-9a-f]{8}(\.topojson)$/, '$1');
  if (logicalName !== basename(src)) {
    await copyFile(srcPath, join(destDir, logicalName));
  }
  count++;
}

if (count === 0) {
  console.warn('[copy-static] No .topojson files found in', dataDir);
} else {
  console.log(`[copy-static] Copied ${count} topojson file(s) to public/static/ (hashed + logical names)`);
}
