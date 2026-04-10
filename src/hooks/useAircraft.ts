import { useState, useEffect, useRef, useCallback } from 'react';
import { Aircraft } from '@/types/globe';
import { classifyAircraft } from '@/utils/militaryClassification';

// adsb.lol — free, no key, no signup, CORS-enabled, ADSBexchange-compatible format
// /v2/all is unavailable; use regional endpoint based on camera position
const ADSB_BASE = 'https://api.adsb.lol/v2';

// Multiple regional queries to cover most of the globe
const GLOBAL_REGIONS = [
  { lat: 48, lon: 10, dist: 500, label: 'Europe' },
  { lat: 40, lon: -100, dist: 500, label: 'North America' },
  { lat: 35, lon: 105, dist: 500, label: 'East Asia' },
  { lat: 25, lon: 55, dist: 400, label: 'Middle East' },
  { lat: -25, lon: 135, dist: 400, label: 'Australia' },
  { lat: 20, lon: 78, dist: 400, label: 'South Asia' },
  { lat: -10, lon: -50, dist: 400, label: 'South America' },
  { lat: 5, lon: 25, dist: 400, label: 'Africa' },
  { lat: 60, lon: 40, dist: 400, label: 'Russia West' },
  { lat: 55, lon: 100, dist: 400, label: 'Russia East' },
  { lat: 15, lon: 120, dist: 400, label: 'Southeast Asia' },
];

export function useAircraft(enabled: boolean, classifyMilitary: boolean) {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const backoffRef = useRef(10000);
  const regionIndexRef = useRef(0);
  const accumulatedRef = useRef<Map<string, Aircraft>>(new Map());

  const fetchRegion = useCallback(async (region: typeof GLOBAL_REGIONS[0]) => {
    const url = `${ADSB_BASE}/lat/${region.lat}/lon/${region.lon}/dist/${region.dist}`;
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        backoffRef.current = Math.min(backoffRef.current * 2, 120000);
        console.warn(`[AIRCRAFT] 429 on ${region.label}, backing off to ${backoffRef.current / 1000}s`);
        return [];
      }
      if (!res.ok) {
        console.warn(`[AIRCRAFT ERROR] HTTP ${res.status} for ${region.label}`);
        return [];
      }
      const data = await res.json();
      const raw: any[] = data.ac || [];
      console.log(`[AIRCRAFT RAW] ${region.label}: ${raw.length} aircraft`);
      if (raw.length > 0) {
        console.log(`[AIRCRAFT RAW] First aircraft object:`, JSON.stringify(raw[0]).slice(0, 300));
      }
      return raw;
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
        console.warn(`[AIRCRAFT ERROR] CORS blocked ADS-B feed for ${region.label}`);
      } else {
        console.warn(`[AIRCRAFT ERROR] Fetch failed for ${region.label}:`, err.message);
      }
      return [];
    }
  }, []);

  const parseAircraft = useCallback((raw: any[]): Aircraft[] => {
    return raw
      .filter((s: any) => s.lat != null && s.lon != null && typeof s.lat === 'number' && typeof s.lon === 'number')
      .map((s: any) => {
        const isMil = !!(s.dbFlags && (s.dbFlags & 1));
        const a: Aircraft = {
          icao24: s.hex || '',
          callsign: (s.flight || '').trim(),
          originCountry: s.cou_name || s.cou_iso || '',
          latitude: s.lat,
          longitude: s.lon,
          altitude: s.alt_baro === 'ground' ? 0 : (s.alt_baro || s.alt_geom || 0) * 0.3048,
          baroAltitude: s.alt_baro === 'ground' ? 0 : s.alt_baro != null ? s.alt_baro * 0.3048 : undefined,
          geoAltitude: s.alt_geom != null ? s.alt_geom * 0.3048 : undefined,
          velocity: (s.gs || 0) * 0.5144,
          heading: s.track || s.true_heading || 0,
          verticalRate: s.baro_rate != null ? s.baro_rate * 0.00508 : (s.geom_rate != null ? s.geom_rate * 0.00508 : 0),
          onGround: s.alt_baro === 'ground' || !!s.ground,
          lastContact: s.seen != null ? Math.floor(Date.now() / 1000) - s.seen : 0,
          squawk: s.squawk || undefined,
          positionSource: s.type || 'adsb_icao',
          airline: s.ownOp || (s.flight && s.flight.length >= 3 ? s.flight.substring(0, 3) : 'Unknown'),
          aircraftType: s.t || 'Unknown',
          model: s.desc || 'Unknown',
          registration: s.r || 'Unknown',
          operator: s.ownOp || 'Unknown',
          emergency: s.emergency || 'none',
          isMilitary: isMil,
          trueAirspeed: s.tas != null ? s.tas * 0.5144 : undefined,
          mach: s.mach || undefined,
          route: s.route || undefined,
        };

        if (classifyMilitary && !isMil) {
          const cls = classifyAircraft(a.callsign, a.velocity, a.altitude);
          if (cls.isMilitary) {
            a.militaryClassification = cls.classification;
            a.isMilitary = true;
          }
        }

        return a;
      });
  }, [classifyMilitary]);

  const fetchNextRegion = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch 2 regions per cycle to fill faster
      const idx1 = regionIndexRef.current % GLOBAL_REGIONS.length;
      const idx2 = (regionIndexRef.current + 1) % GLOBAL_REGIONS.length;
      regionIndexRef.current = (regionIndexRef.current + 2) % GLOBAL_REGIONS.length;

      const [raw1, raw2] = await Promise.all([
        fetchRegion(GLOBAL_REGIONS[idx1]),
        fetchRegion(GLOBAL_REGIONS[idx2]),
      ]);

      const parsed1 = parseAircraft(raw1);
      const parsed2 = parseAircraft(raw2);

      // Accumulate into persistent map
      const map = accumulatedRef.current;
      const now = Date.now();

      [...parsed1, ...parsed2].forEach(a => {
        map.set(a.icao24, a);
      });

      // Remove stale entries (not seen for 5 minutes)
      for (const [id, ac] of map) {
        if (ac.lastContact > 300) {
          map.delete(id);
        }
      }

      const allAircraft = Array.from(map.values());
      console.log(`[AIRCRAFT] Total accumulated: ${allAircraft.length}`);

      if (allAircraft.length === 0) {
        console.warn('[AIRCRAFT ERROR] No aircraft to render — ingestion aborted.');
      }

      setAircraft(allAircraft);
      backoffRef.current = 5000; // Reset backoff on success
    } catch (err: any) {
      setError(err.message);
      console.warn('[AIRCRAFT ERROR] Fetch cycle failed:', err.message);
      backoffRef.current = Math.min(backoffRef.current * 1.5, 60000);
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchRegion, parseAircraft]);

  useEffect(() => {
    if (!enabled) {
      setAircraft([]);
      accumulatedRef.current.clear();
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    fetchNextRegion();
    intervalRef.current = setInterval(fetchNextRegion, backoffRef.current);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, fetchNextRegion]);

  return { aircraft, loading, error };
}
