'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { partyColor, OPACITY } from '@/lib/party-colors';
import type { StateDetail } from '@/lib/types';

// TopoJSON shards are public static assets served at /static/, not API fixtures.
// Use root-relative path so this works in dev, preview, and production alike.
const STATIC = '/static';

// MapLibre GL JS is lazy-imported so WebGL init (~200KB gz core) only runs
// on /state/[code] pages, not the overview. This is the ADR D-7 split-tech
// contract.

interface StateChoroplethDrillDownProps {
  stateCode: string;
  stateData: StateDetail | undefined;
  onConstituencyClick: (acId: string) => void;
}

interface TooltipState {
  x: number;
  y: number;
  name: string;
  acNo: number;
  party: string;
  status: string;
}

// @registry-candidate v2
export function StateChoroplethDrillDown({
  stateCode,
  stateData,
  onConstituencyClick,
}: StateChoroplethDrillDownProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [mapLibreLoaded, setMapLibreLoaded] = useState(false);
  const [topoLoaded, setTopoLoaded] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Lazy-load MapLibre GL JS
  useEffect(() => {
    import('maplibre-gl').then((mod) => {
      setMapLibreLoaded(true);
    }).catch(() => setError('Map failed to load'));
  }, []);

  // Initialize map once MapLibre is loaded
  useEffect(() => {
    if (!mapLibreLoaded || !mapRef.current) return;

    import('maplibre-gl').then(({ default: maplibregl }) => {
      // Import MapLibre CSS once (declaration in src/types/css.d.ts allows this)
      import('maplibre-gl/dist/maplibre-gl.css').catch(() => {});

      const map = new maplibregl.Map({
        container: mapRef.current!,
        style: {
          version: 8,
          name: 'ElectionWatch Dark',
          sources: {},
          layers: [
            {
              id: 'background',
              type: 'background',
              // Aura --surface token value (#10141F)
              paint: { 'background-color': '#10141F' },
            },
          ],
        },
        center: [80, 22],
        zoom: 4,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      map.on('load', async () => {
        // Load per-state TopoJSON shard on demand (logical unhashed name written by copy-static.mjs)
        const topoUrl = `${STATIC}/india_constituencies_${stateCode}.topojson`;
        try {
          const res = await fetch(topoUrl);
          if (!res.ok) throw new Error('TopoJSON not found');
          const topojson = await res.json();

          // Convert TopoJSON to GeoJSON using the topojson-client library
          // We do a minimal inline conversion for MVP since topojson-client is not installed.
          // T1 will serve pre-converted GeoJSON; for now we handle the stub case.
          const geojson = await topoJsonToGeoJson(topojson);

          (map as any).addSource('constituencies', {
            type: 'geojson',
            data: geojson,
            generateId: true,
          });

          (map as any).addLayer({
            id: 'constituency-fill',
            type: 'fill',
            source: 'constituencies',
            paint: {
              'fill-color': ['case',
                ['boolean', ['feature-state', 'declared'], false], ['feature-state', 'partyColor'],
                ['concat', ['feature-state', 'partyColor'], ''],
              ],
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'declared'], false], OPACITY.declared,
                ['boolean', ['feature-state', 'hasData'], false], OPACITY.leading,
                0.3,
              ],
            },
          });

          (map as any).addLayer({
            id: 'constituency-outline',
            type: 'line',
            source: 'constituencies',
            paint: {
              // Aura --border token: rgba(255,255,255,0.08)
              'line-color': 'rgba(255,255,255,0.08)',
              'line-width': 0.5,
            },
          });

          setTopoLoaded(true);

          // Fit map to bounds of the loaded GeoJSON
          if (geojson.features && geojson.features.length > 0) {
            const bounds = computeBounds(geojson.features);
            if (bounds) (map as any).fitBounds(bounds, { padding: 24, duration: 0 });
          }
        } catch {
          // TopoJSON not baked yet (pre-T1) — show a placeholder grid
          setTopoLoaded(true); // no error; just empty map with dark bg
        }

        // Hover throttled to rAF
        let rafPending = false;
        (map as any).on('mousemove', 'constituency-fill', (e: any) => {
          if (rafPending) return;
          rafPending = true;
          requestAnimationFrame(() => {
            rafPending = false;
            const f = e.features?.[0];
            if (!f) return;
            const acNo = f.properties?.ac_no;
            const name = f.properties?.name ?? `AC ${acNo}`;
            const c = stateData?.constituencies.find((x) => x.ac_no === acNo);
            setTooltip({
              x: e.point.x,
              y: e.point.y,
              name,
              acNo,
              party: c?.leading_party ?? '—',
              status: c?.status ?? 'pending',
            });
          });
        });
        (map as any).on('mouseleave', 'constituency-fill', () => setTooltip(null));

        // Click → navigate
        (map as any).on('click', 'constituency-fill', (e: any) => {
          const f = e.features?.[0];
          if (!f) return;
          const acNo = f.properties?.ac_no;
          onConstituencyClick(`${stateCode}-${acNo}`);
        });
      });

      return () => {
        map.remove();
        mapInstanceRef.current = null;
      };
    });
  }, [mapLibreLoaded, stateCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update feature states when live data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !stateData) return;
    const map = mapInstanceRef.current as any;
    if (!map.getSource('constituencies')) return;

    for (const c of stateData.constituencies) {
      map.setFeatureState(
        { source: 'constituencies', id: c.ac_no },
        {
          partyColor: partyColor(c.leading_party),
          hasData: c.status !== 'pending',
          declared: c.status === 'declared',
        }
      );
    }
  }, [stateData]);

  return (
    <div className="relative w-full h-[360px] sm:h-[480px] rounded-xl overflow-hidden bg-surface border border-border">
      <div ref={mapRef} className="absolute inset-0" />

      {/* CSS skeleton while MapLibre boots */}
      {!mapLibreLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface">
          <div className="space-y-2 w-full px-8">
            {[80, 60, 75, 50, 65].map((w, i) => (
              <div
                key={i}
                className="h-6 rounded bg-surface2 animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
          {error}
        </div>
      )}

      {tooltip && (
        <div
          className="absolute z-20 bg-surface2/95 border border-border rounded-lg px-3 py-2 pointer-events-none shadow-xl text-xs text-fg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 12, transform: 'translateY(-100%)' }}
        >
          <p className="font-semibold">{tooltip.name}</p>
          <p className="text-muted">
            {tooltip.party === '—' ? 'Pending' : tooltip.party} · {tooltip.status}
          </p>
        </div>
      )}

      <div className="absolute bottom-2 right-2 text-muted text-xs">
        Map: DataMeet CC0 boundaries
      </div>
    </div>
  );
}

// Convert TopoJSON → GeoJSON using topojson-client (dynamically imported).
// Falls back to empty FeatureCollection if the topology has no objects.
async function topoJsonToGeoJson(topology: any): Promise<GeoJSON.FeatureCollection> {
  // Pass-through if the data pipeline ever serves pre-converted GeoJSON
  if (topology.type === 'FeatureCollection') return topology as GeoJSON.FeatureCollection;

  // Real TopoJSON: use topojson-client to convert the first object layer
  const { feature } = await import('topojson-client');
  const objectKey = Object.keys(topology.objects ?? {})[0];
  if (!objectKey) return { type: 'FeatureCollection', features: [] };

  return feature(topology, topology.objects[objectKey]) as unknown as GeoJSON.FeatureCollection;
}

function computeBounds(features: GeoJSON.Feature[]): [[number, number], [number, number]] | null {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const f of features) {
    const geo = f.geometry;
    if (!geo) continue;
    const coords = extractCoords(geo);
    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
  }
  if (!isFinite(minLng)) return null;
  return [[minLng, minLat], [maxLng, maxLat]];
}

function extractCoords(geo: GeoJSON.Geometry): [number, number][] {
  const out: [number, number][] = [];
  function walk(c: unknown) {
    if (!Array.isArray(c)) return;
    if (typeof c[0] === 'number') { out.push(c as [number, number]); return; }
    for (const item of c) walk(item);
  }
  if ('coordinates' in geo) walk((geo as any).coordinates);
  return out;
}
