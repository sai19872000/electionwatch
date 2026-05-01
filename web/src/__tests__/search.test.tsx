/**
 * Search returns matches for 'Chennai' AND 'சென்னை' (alias test).
 * Per architect spec D-10: native-script aliases baked into search_index.json.
 */
import { describe, it, expect } from 'vitest';
import Fuse from 'fuse.js';

const SAMPLE_INDEX = [
  {
    id: 'S22-5',
    name: 'Chennai North',
    state: 'Tamil Nadu',
    district: 'Chennai',
    aliases: ['சென்னை வடக்கு', 'Madras North'],
  },
  {
    id: 'S22-6',
    name: 'Chennai South',
    state: 'Tamil Nadu',
    district: 'Chennai',
    aliases: ['சென்னை தெற்கு', 'Madras South'],
  },
  {
    id: 'S11-1',
    name: 'Kasaragod',
    state: 'Kerala',
    district: 'Kasaragod',
    aliases: ['കാസർഗോഡ്'],
  },
];

function buildFuse() {
  return new Fuse(SAMPLE_INDEX, {
    keys: [
      { name: 'name',     weight: 2 },
      { name: 'aliases',  weight: 1.5 },
      { name: 'district', weight: 1 },
      { name: 'state',    weight: 0.5 },
    ],
    threshold: 0.35,
    includeScore: true,
    minMatchCharLength: 2,
  });
}

describe('ConstituencySearch Fuse index', () => {
  it('returns results for English query "Chennai"', () => {
    const fuse = buildFuse();
    const results = fuse.search('Chennai');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.name).toContain('Chennai');
  });

  it('returns results for Tamil script query "சென்னை"', () => {
    const fuse = buildFuse();
    const results = fuse.search('சென்னை');
    expect(results.length).toBeGreaterThan(0);
    // Should match Chennai constituencies via alias
    const ids = results.map((r) => r.item.id);
    expect(ids.some((id) => id.startsWith('S22'))).toBe(true);
  });

  it('returns results for partial English "Kasara"', () => {
    const fuse = buildFuse();
    const results = fuse.search('Kasara');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.id).toBe('S11-1');
  });
});
