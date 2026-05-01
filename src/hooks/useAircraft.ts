import { useState, useEffect, useRef, useCallback } from 'react';
import { Aircraft } from '@/types/globe';
import { classifyAircraft } from '@/utils/militaryClassification';

// airplanes.live — free, no key, CORS-enabled, ADSBexchange-compatible readsb format
const REGIONS = [
  { name: 'North America', lat: 40, lon: -100, dist: 500 },
  { name: 'Europe', lat: 48, lon: 10, dist: 500 },
  { name: 'East Asia', lat: 35, lon: 105, dist: 500 },
  { name: 'Middle East', lat: 25, lon: 55, dist: 400 },
  { name: 'South Asia', lat: 20, lon: 78, dist: 400 },
  { name: 'Southeast Asia', lat: 15, lon: 120, dist: 400 },
  { name: 'Africa', lat: 5, lon: 25, dist: 400 },
  { name: 'South America', lat: -10, lon: -50, dist: 400 },
  { name: 'Australia', lat: -25, lon: 135, dist: 400 },
  { name: 'Russia', lat: 60, lon: 80, dist: 500 },
];

function parseAircraft(raw: any[]): Aircraft[] {
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
        // s.seen = seconds since last message received. Use directly as lastContact.
        lastContact: s.seen != null ? s.seen : 0,
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

      // Classify by callsign/speed/altitude if not already flagged
      if (!isMil) {
        const cls = classifyAircraft(a.callsign, a.velocity, a.altitude);
        if (cls.isMilitary) {
          a.militaryClassification = cls.classification;
          a.isMilitary = true;
        }
      }

      return a;
    });
}

export function useAircraft(civilianEnabled: boolean, militaryEnabled: boolean) {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const backoffRef = useRef(15000);
  const regionIndex = useRef(0);
  const accumulatedRef = useRef<Map<string, Aircraft>>(new Map());
  const logTimer = useRef<ReturnType<typeof setInterval>>();

  // Aircraft should be fetched if EITHER civilian or military toggle is on
  const enabled = civilianEnabled || militaryEnabled;

  const fetchRegionBatch = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      setError(null);

      const batch = [];
      for (let i = 0; i < 2; i++) {
        const region = REGIONS[(regionIndex.current + i) % REGIONS.length];
        batch.push(
          fetch(`https://api.airplanes.live/v2/point/${region.lat}/${region.lon}/${region.dist}`)
            .then(async (res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const data = await res.json();
              return { region: region.name, ac: data.ac || [] };
            })
            .catch((err) => {
              console.warn(`[ACFT] ${region.name} fetch failed:`, err.message);
              return { region: region.name, ac: [] };
            })
        );
      }
      regionIndex.current = (regionIndex.current + 2) % REGIONS.length;

      const results = await Promise.all(batch);

      // Merge into accumulated map — NEVER clear
      for (const result of results) {
        const parsed = parseAircraft(result.ac);
        for (const a of parsed) {
          accumulatedRef.current.set(a.icao24, a);
        }
      }

      // Remove stale entries (lastContact > 5 minutes = 300 seconds)
      for (const [id, a] of accumulatedRef.current) {
        if (a.lastContact > 300) {
          accumulatedRef.current.delete(id);
        }
      }

      setAircraft(Array.from(accumulatedRef.current.values()));
      backoffRef.current = 15000;
    } catch (err: any) {
      setError(err.message);
      console.warn('[ACFT] fetch failed:', err.message);
      backoffRef.current = Math.min(backoffRef.current * 1.5, 60000);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // Logging every 10s
  useEffect(() => {
    if (!enabled) return;
    logTimer.current = setInterval(() => {
      const all = accumulatedRef.current.size;
      const mil = Array.from(accumulatedRef.current.values()).filter(a => a.isMilitary).length;
      const civ = all - mil;
      console.log(`[ACFT] Total entities: ${all}`);
      console.log(`[ACFT] Visible civilian: ${civ}`);
      console.log(`[ACFT] Visible military: ${mil}`);
      if (all > 0 && civ === 0 && mil === 0) {
        console.error('[ACFT ERROR] Classification/visibility logic hiding all aircraft — fix UI filters, not ingestion.');
      }
    }, 10000);
    return () => { if (logTimer.current) clearInterval(logTimer.current); };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setAircraft([]);
      accumulatedRef.current.clear();
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    fetchRegionBatch();
    intervalRef.current = setInterval(fetchRegionBatch, backoffRef.current);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, fetchRegionBatch]);

  return { aircraft, loading, error };
}
