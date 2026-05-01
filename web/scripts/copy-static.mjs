/**
 * copy-static.mjs
 * Copies data/dist/*.topojson -> web/public/static/ at build/dev time.
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
  const destPath = join(destDir, basename(src));
  await copyFile(srcPath, destPath);
  count++;
}

if (count === 0) {
  console.warn('[copy-static] No .topojson files found in', dataDir);
} else {
  console.log(`[copy-static] Copied ${count} topojson file(s) to public/static/`);
}
